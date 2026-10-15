import type { OfficialClue, OfficialDay } from "@/lib/official/source";
import type { GameDate } from "@/lib/time/game-day";

/** One daily puzzle as the pages use it. */
export interface Puzzle {
  number: number;
  gameDate: GameDate;
  slug: string;
  guestName: string;
  countryCode: string;
  countryLabel: string;
  clues: OfficialClue[];
  outlineClue: string | null;
  distances: Record<string, number>;
  disabledGuesses: string[];
  guessNote: string | null;
  /** Hand-written hints, when an editor has replaced the generated ones. */
  hints: string[] | null;
  editorNote: string | null;
  sourceUrl: string;
  firstSeenAt: string;
  updatedAt: string;
}

/** The fields an archive listing needs. */
export interface PuzzleSummary {
  number: number;
  gameDate: GameDate;
  slug: string;
  guestName: string;
  countryCode: string;
  updatedAt: string;
}

interface PuzzleRow {
  number: number;
  game_date: string;
  slug: string;
  guest_name: string;
  country_code: string;
  country_label: string;
  clues_json: string;
  outline_clue: string | null;
  distances_json: string;
  disabled_guesses_json: string;
  guess_note: string | null;
  hints_json: string | null;
  editor_note: string | null;
  source_url: string;
  first_seen_at: string;
  updated_at: string;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toPuzzle(row: PuzzleRow): Puzzle {
  const hints = parseJson<unknown>(row.hints_json, null);
  return {
    number: row.number,
    gameDate: row.game_date,
    slug: row.slug,
    guestName: row.guest_name,
    countryCode: row.country_code,
    countryLabel: row.country_label,
    clues: parseJson<OfficialClue[]>(row.clues_json, []),
    outlineClue: row.outline_clue,
    distances: parseJson<Record<string, number>>(row.distances_json, {}),
    disabledGuesses: parseJson<string[]>(row.disabled_guesses_json, []),
    guessNote: row.guess_note,
    hints: Array.isArray(hints) && hints.length === 3 && hints.every((h) => typeof h === "string" && h.trim()) ? (hints as string[]) : null,
    editorNote: row.editor_note,
    sourceUrl: row.source_url,
    firstSeenAt: row.first_seen_at,
    updatedAt: row.updated_at,
  };
}

const FULL = `number, game_date, slug, guest_name, country_code, country_label, clues_json, outline_clue, distances_json,
  disabled_guesses_json, guess_note, hints_json, editor_note, source_url, first_seen_at, updated_at`;

/** A puzzle by number, only once its day has come in New York. */
export async function getPuzzle(db: D1Database, number: number, today: GameDate): Promise<Puzzle | null> {
  const row = await db.prepare(`SELECT ${FULL} FROM puzzles WHERE number = ? AND game_date <= ?`).bind(number, today).first<PuzzleRow>();
  return row ? toPuzzle(row) : null;
}

export async function getPuzzleOn(db: D1Database, gameDate: GameDate): Promise<Puzzle | null> {
  const row = await db.prepare(`SELECT ${FULL} FROM puzzles WHERE game_date = ?`).bind(gameDate).first<PuzzleRow>();
  return row ? toPuzzle(row) : null;
}

/** The newest puzzles up to today, newest first. */
export async function getRecentPuzzles(db: D1Database, today: GameDate, limit: number): Promise<Puzzle[]> {
  const { results } = await db.prepare(`SELECT ${FULL} FROM puzzles WHERE game_date <= ? ORDER BY number DESC LIMIT ?`).bind(today, limit).all<PuzzleRow>();
  return results.map(toPuzzle);
}

export async function listPuzzles(db: D1Database, today: GameDate): Promise<PuzzleSummary[]> {
  const { results } = await db
    .prepare(`SELECT number, game_date, slug, guest_name, country_code, updated_at FROM puzzles WHERE game_date <= ? ORDER BY number DESC`)
    .bind(today)
    .all<{ number: number; game_date: string; slug: string; guest_name: string; country_code: string; updated_at: string }>();
  return results.map((row) => ({
    number: row.number,
    gameDate: row.game_date,
    slug: row.slug,
    guestName: row.guest_name,
    countryCode: row.country_code,
    updatedAt: row.updated_at,
  }));
}

/* ── writing, for the sync ─────────────────────────────────────────────── */

export interface StoredPuzzle {
  number: number;
  slug: string;
  contentHash: string;
  checkedAt: string;
}

export type SaveResult = "created" | "updated" | "unchanged";

export interface SyncRunRecord {
  startedAt: string;
  finishedAt: string;
  status: "succeeded" | "failed";
  gameDate: string | null;
  summary: string | null;
  error: string | null;
}

/** What the sync needs from storage; D1 in the Worker, an in-memory copy in tests. */
export interface PuzzleStore {
  stored(): Promise<StoredPuzzle[]>;
  save(number: number, gameDate: GameDate, day: OfficialDay, contentHash: string, now: string): Promise<SaveResult>;
  logRun(run: SyncRunRecord): Promise<void>;
}

export function d1PuzzleStore(db: D1Database): PuzzleStore {
  return {
    async stored() {
      const { results } = await db
        .prepare("SELECT number, slug, content_hash, checked_at FROM puzzles ORDER BY number")
        .all<{ number: number; slug: string; content_hash: string; checked_at: string }>();
      return results.map((row) => ({ number: row.number, slug: row.slug, contentHash: row.content_hash, checkedAt: row.checked_at }));
    },
    async save(number, gameDate, day, contentHash, now) {
      const existing = await db.prepare("SELECT content_hash FROM puzzles WHERE number = ?").bind(number).first<{ content_hash: string }>();
      if (existing?.content_hash === contentHash) {
        await db.prepare("UPDATE puzzles SET checked_at = ? WHERE number = ?").bind(now, number).run();
        return "unchanged";
      }
      // Editorial fields (hints_json, editor_note) and first_seen_at survive an update.
      await db
        .prepare(
          `INSERT INTO puzzles (number, game_date, slug, guest_name, country_code, country_label, clues_json, outline_clue,
             distances_json, disabled_guesses_json, guess_note, source_url, content_hash, first_seen_at, updated_at, checked_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (number) DO UPDATE SET
             game_date = excluded.game_date, slug = excluded.slug, guest_name = excluded.guest_name,
             country_code = excluded.country_code, country_label = excluded.country_label, clues_json = excluded.clues_json,
             outline_clue = excluded.outline_clue, distances_json = excluded.distances_json,
             disabled_guesses_json = excluded.disabled_guesses_json, guess_note = excluded.guess_note,
             source_url = excluded.source_url, content_hash = excluded.content_hash,
             updated_at = excluded.updated_at, checked_at = excluded.checked_at`,
        )
        .bind(
          number, gameDate, day.slug, day.guestName, day.countryCode, day.countryLabel, JSON.stringify(day.clues), day.outlineClue,
          JSON.stringify(day.distances), JSON.stringify(day.disabledGuesses), day.guessNote, day.sourceUrl, contentHash, now, now, now,
        )
        .run();
      return existing ? "updated" : "created";
    },
    async logRun(run) {
      await db
        .prepare("INSERT INTO sync_runs (started_at, finished_at, status, game_date, summary, error) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(run.startedAt, run.finishedAt, run.status, run.gameDate, run.summary, run.error)
        .run();
    },
  };
}
