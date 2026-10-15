import { COUNTRY_ROWS } from "@/data/countries";

/** A made-up guest for tests, shaped like the game's day.js. Never real data. */
export function dayScript(overrides: Record<string, unknown> = {}): string {
  const distances: Record<string, number> = {};
  COUNTRY_ROWS.forEach((country, index) => {
    distances[country.code] = 500 + index * 37;
  });
  Object.assign(distances, { KE: 0, ET: 0, SO: 0, SS: 0, TZ: 0, UG: 0, RW: 349, CD: 352, BI: 403 });
  const day = {
    edition: "010",
    name: "Testa",
    country: "Kenya",
    answer: "KE",
    clues: [
      ["t-01", "WELCOME", "Say hello."],
      ["t-02", "A LITTLE OF MY LANGUAGE", "Listen."],
      ["t-03", "FROM THE KITCHEN", "Taste."],
      ["t-08", "WHERE I AM", "The outline."],
    ],
    outlineClue: "t-08",
    distances,
    ...overrides,
  };
  return `window.ORIGINLE_DAY=${JSON.stringify(day, null, 2)};\n`;
}

export function scheduleScript(ids: string[], launchDate = "2026-10-05"): string {
  return `window.ORIGINLE_SCHEDULE=${JSON.stringify({ launchDate, timeZone: "America/New_York", puzzles: ids }, null, 2)};\n`;
}
