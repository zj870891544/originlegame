/**
 * Gives the end-to-end run a freshly migrated local database holding three
 * made-up guests: today, yesterday and the day before (by New York time).
 * Runs as part of the web server command, before the server opens the database.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseDay } from "../src/lib/official/source";
import { contentHash } from "../src/lib/official/sync";
import { addDays, gameDateAt, puzzleNumberOn } from "../src/lib/time/game-day";
import { dayScript } from "../tests/fixtures";

const root = resolve(import.meta.dirname, "..");
const stateDir = resolve(root, ".wrangler/e2e-state");
const wrangler = resolve(root, "node_modules/.bin/wrangler");

if (!existsSync(resolve(root, "dist/server/wrangler.json"))) {
  console.error("No production build found. Run `npm run build` before the end-to-end tests.");
  process.exit(1);
}
rmSync(stateDir, { recursive: true, force: true });
execFileSync(wrangler, ["d1", "migrations", "apply", "originlegame", "--local", "--persist-to", stateDir], { cwd: root, stdio: "inherit" });

const quote = (value: string | null) => (value === null ? "NULL" : `'${value.replace(/'/g, "''")}'`);
const today = gameDateAt(new Date());
const now = new Date().toISOString();
const statements: string[] = [];
for (const offset of [0, 1, 2]) {
  const date = addDays(today, -offset);
  const number = puzzleNumberOn(date);
  const day = parseDay(dayScript({ name: `Fixture ${number}` }), `fixture-${number}`);
  const hash = await contentHash(day, number);
  statements.push(
    `INSERT INTO puzzles (number, game_date, slug, guest_name, country_code, country_label, clues_json, outline_clue, distances_json,
      disabled_guesses_json, guess_note, source_url, content_hash, first_seen_at, updated_at, checked_at) VALUES (${number}, ${quote(date)},
      ${quote(day.slug)}, ${quote(day.guestName)}, ${quote(day.countryCode)}, ${quote(day.countryLabel)}, ${quote(JSON.stringify(day.clues))},
      ${quote(day.outlineClue)}, ${quote(JSON.stringify(day.distances))}, '[]', NULL, ${quote(day.sourceUrl)}, ${quote(hash)}, ${quote(now)}, ${quote(now)}, ${quote(now)});`,
  );
}
mkdirSync(resolve(root, ".wrangler"), { recursive: true });
const file = resolve(root, ".wrangler/e2e-seed.sql");
writeFileSync(file, statements.join("\n"));
execFileSync(wrangler, ["d1", "execute", "originlegame", "--local", "--persist-to", stateDir, "--file", file], { cwd: root, stdio: "inherit" });
