import { describe, expect, it } from "vitest";
import type { PuzzleStore, StoredPuzzle, SyncRunRecord } from "@/lib/db/puzzles";
import { syncOfficial } from "@/lib/official/sync";
import { dayScript, scheduleScript } from "./fixtures";

function memoryStore() {
  const rows = new Map<number, StoredPuzzle & { gameDate: string; guest: string }>();
  const runs: SyncRunRecord[] = [];
  const store: PuzzleStore = {
    async stored() {
      return [...rows.values()];
    },
    async save(number, gameDate, day, contentHash, now) {
      const existing = rows.get(number);
      if (existing?.contentHash === contentHash) {
        existing.checkedAt = now;
        return "unchanged";
      }
      rows.set(number, { number, slug: day.slug, contentHash, checkedAt: now, gameDate, guest: day.guestName });
      return existing ? "updated" : "created";
    },
    async logRun(run) {
      runs.push(run);
    },
  };
  return { store, rows, runs };
}

/** A fake originle.io: `released` days answer, later ones are 403 as on the real site. */
function fakeGame(ids: string[], released: number, guestName = "Testa") {
  const requests: string[] = [];
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    requests.push(url);
    if (url.endsWith("/daily-config.js")) return new Response(scheduleScript(ids));
    const slug = /originle\.io\/([^/]+)\/day\.js$/.exec(url)?.[1];
    const index = slug ? ids.indexOf(slug) : -1;
    if (index < 0) return new Response("missing", { status: 404 });
    if (index >= released) return new Response("forbidden", { status: 403 });
    return new Response(dayScript({ name: `${guestName} ${index + 1}` }));
  }) as typeof fetch;
  return { fetchImpl, requests };
}

// 2026-10-07 12:00 in New York: puzzle #3 is live.
const NOW = new Date("2026-10-07T16:00:00Z");

describe("syncOfficial", () => {
  it("stores every released day with its own date", async () => {
    const { store, rows, runs } = memoryStore();
    const { fetchImpl } = fakeGame(["a", "b", "c", "d"], 3);
    const report = await syncOfficial(store, fetchImpl, NOW);
    expect(report.todayNumber).toBe(3);
    expect(report.saved.map((s) => [s.number, s.result])).toEqual([[3, "created"], [2, "created"], [1, "created"]]);
    expect([...rows.values()].map((r) => r.gameDate).sort()).toEqual(["2026-10-05", "2026-10-06", "2026-10-07"]);
    expect(runs.at(-1)?.status).toBe("succeeded");
  });

  it("never asks for a day that hasn't started", async () => {
    const { store } = memoryStore();
    const { fetchImpl, requests } = fakeGame(["a", "b", "c", "d"], 4);
    await syncOfficial(store, fetchImpl, NOW);
    expect(requests.some((url) => url.includes("/d/"))).toBe(false);
  });

  it("records a day the game still holds back without failing", async () => {
    const { store, rows } = memoryStore();
    const { fetchImpl } = fakeGame(["a", "b", "c"], 2);
    const report = await syncOfficial(store, fetchImpl, NOW);
    expect(report.held).toEqual([3]);
    expect(rows.has(3)).toBe(false);
  });

  it("re-checks only today within the refresh interval, and notices no change", async () => {
    const { store } = memoryStore();
    const game = fakeGame(["a", "b", "c"], 3);
    await syncOfficial(store, game.fetchImpl, NOW);
    const soon = await syncOfficial(store, game.fetchImpl, new Date(NOW.getTime() + 60_000));
    expect(soon.saved).toEqual([]);
    const later = await syncOfficial(store, game.fetchImpl, new Date(NOW.getTime() + 3 * 3600_000));
    expect(later.saved).toEqual([{ number: 3, result: "unchanged" }]);
  });

  it("follows a correction the game makes", async () => {
    const { store, rows } = memoryStore();
    await syncOfficial(store, fakeGame(["a", "b", "c"], 3).fetchImpl, NOW);
    const report = await syncOfficial(store, fakeGame(["a", "b", "c"], 3, "Renamed").fetchImpl, NOW, { force: true });
    expect(report.saved.filter((s) => s.result === "updated")).toHaveLength(3);
    expect(rows.get(1)?.guest).toBe("Renamed 1");
  });

  it("logs and rethrows when the schedule changes shape", async () => {
    const { store, runs } = memoryStore();
    const broken = (async () => new Response("window.ORIGINLE_SCHEDULE=oops")) as unknown as typeof fetch;
    await expect(syncOfficial(store, broken, NOW)).rejects.toThrow();
    expect(runs.at(-1)?.status).toBe("failed");
  });
});
