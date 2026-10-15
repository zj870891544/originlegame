import { z } from "zod";
import { countryByCode } from "@/lib/countries";
import { isValidGameDate } from "@/lib/time/game-day";

/**
 * Reading the data the official game publishes.
 *
 * Originle is a static site. `daily-config.js` lists the guests in order from
 * the launch date, and each released guest's `<id>/day.js` holds who they are,
 * the country they represent, the clue titles and the border-to-border distance
 * from that country to every other. Unreleased days answer 403, so nothing here
 * can see a guest before the game releases them.
 *
 * Both files are scripts that assign one object literal written as JSON. They
 * are parsed as JSON, never run; if their shape changes the sync stops instead
 * of guessing.
 */

export const OFFICIAL_ORIGIN = "https://originle.io";
const USER_AGENT = "OriginleGameBot/1.0 (+https://originlegame.app/about)";

export class OfficialDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfficialDataError";
  }
}

const SLUG = /^[a-z][a-z0-9-]*$/;
const CODE = /^[A-Z]{2}$/;

const scheduleSchema = z.object({
  launchDate: z.string().refine(isValidGameDate, "launchDate must be YYYY-MM-DD"),
  timeZone: z.literal("America/New_York"),
  puzzles: z.array(z.string().regex(SLUG)).min(1).max(5000)
    .refine((ids) => new Set(ids).size === ids.length, "puzzle ids must be unique"),
});
export type OfficialSchedule = z.infer<typeof scheduleSchema>;

const daySchema = z.object({
  name: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  answer: z.string().regex(CODE),
  clues: z.array(z.tuple([z.string().min(1).max(80), z.string().min(1).max(120), z.string().max(400)]).rest(z.unknown()))
    .min(1).max(12),
  outlineClue: z.string().max(80).optional(),
  distances: z.record(z.string().regex(CODE), z.number().finite().min(0).max(25_000)),
  disabledGuesses: z.array(z.string().regex(CODE)).max(10).optional(),
  guessNote: z.string().max(400).optional(),
});

export interface OfficialClue {
  id: string;
  title: string;
  teaser: string;
}

/** One released puzzle, as stored. */
export interface OfficialDay {
  slug: string;
  guestName: string;
  countryCode: string;
  countryLabel: string;
  clues: OfficialClue[];
  outlineClue: string | null;
  distances: Record<string, number>;
  disabledGuesses: string[];
  guessNote: string | null;
  sourceUrl: string;
}

/** The object literal assigned to `window.<name>` by one of the game's data scripts. */
export function parseAssignment(script: string, name: string): unknown {
  const marker = new RegExp(`^\\s*window\\.${name}\\s*=\\s*`);
  const match = marker.exec(script);
  if (!match) throw new OfficialDataError(`Expected the script to assign window.${name}`);
  const body = script.slice(match[0].length).trim().replace(/;\s*$/, "");
  if (!body.startsWith("{") || !body.endsWith("}")) throw new OfficialDataError(`window.${name} is not an object literal`);
  try {
    return JSON.parse(body);
  } catch {
    throw new OfficialDataError(`window.${name} is not plain JSON any more`);
  }
}

function describeIssues(error: z.ZodError): string {
  return error.issues.slice(0, 3).map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
}

export function parseSchedule(script: string): OfficialSchedule {
  const parsed = scheduleSchema.safeParse(parseAssignment(script, "ORIGINLE_SCHEDULE"));
  if (!parsed.success) throw new OfficialDataError(`Schedule format changed: ${describeIssues(parsed.error)}`);
  return parsed.data;
}

const MINOR_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "of", "on", "or", "the", "to", "with"]);

/** "A LITTLE OF MY LANGUAGE" → "A Little of My Language". */
export function headlineCase(value: string): string {
  const words = value.trim().toLowerCase().split(/\s+/);
  return words
    .map((word, index) =>
      index > 0 && index < words.length - 1 && MINOR_WORDS.has(word) ? word : word.replace(/\p{L}/u, (letter) => letter.toUpperCase()),
    )
    .join(" ");
}

export function parseDay(script: string, slug: string): OfficialDay {
  const parsed = daySchema.safeParse(parseAssignment(script, "ORIGINLE_DAY"));
  if (!parsed.success) throw new OfficialDataError(`Day format changed for ${slug}: ${describeIssues(parsed.error)}`);
  const day = parsed.data;
  if (!countryByCode(day.answer)) throw new OfficialDataError(`${slug}: unknown country code ${day.answer}`);
  if (day.distances[day.answer] !== 0) throw new OfficialDataError(`${slug}: the answer's own distance should be 0`);
  if (Object.keys(day.distances).length < 150) throw new OfficialDataError(`${slug}: distance table looks incomplete`);
  const distances: Record<string, number> = {};
  for (const [code, km] of Object.entries(day.distances)) {
    if (countryByCode(code)) distances[code] = Math.round(km);
  }
  return {
    slug,
    guestName: day.name.trim(),
    countryCode: day.answer,
    countryLabel: day.country.trim(),
    clues: day.clues.map(([id, title, teaser]) => ({ id, title: headlineCase(title), teaser: teaser.trim() })),
    outlineClue: day.outlineClue ?? null,
    distances,
    disabledGuesses: (day.disabledGuesses ?? []).filter((code) => code !== day.answer),
    guessNote: day.guessNote?.trim() || null,
    sourceUrl: `${OFFICIAL_ORIGIN}/${slug}/`,
  };
}

async function getScript(fetchImpl: typeof fetch, url: string): Promise<{ status: number; text: string }> {
  const response = await fetchImpl(url, {
    headers: { "user-agent": USER_AGENT, accept: "application/javascript, text/javascript, */*" },
    redirect: "follow",
  });
  return { status: response.status, text: response.ok ? await response.text() : "" };
}

export async function fetchSchedule(fetchImpl: typeof fetch): Promise<OfficialSchedule> {
  const { status, text } = await getScript(fetchImpl, `${OFFICIAL_ORIGIN}/daily-config.js`);
  if (status !== 200) throw new OfficialDataError(`daily-config.js answered HTTP ${status}`);
  return parseSchedule(text);
}

/** A released day's data, or null while the game still holds it back (403/404). */
export async function fetchDay(fetchImpl: typeof fetch, slug: string): Promise<OfficialDay | null> {
  if (!SLUG.test(slug)) throw new OfficialDataError(`Bad puzzle id ${slug}`);
  const { status, text } = await getScript(fetchImpl, `${OFFICIAL_ORIGIN}/${slug}/day.js`);
  if (status === 403 || status === 404) return null;
  if (status !== 200) throw new OfficialDataError(`${slug}/day.js answered HTTP ${status}`);
  return parseDay(text, slug);
}
