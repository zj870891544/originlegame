import { d1PuzzleStore } from "@/lib/db/puzzles";
import { describeSync, syncOfficial } from "@/lib/official/sync";

/**
 * POST /api/admin/sync runs the official sync on demand
 * (`npm run sync:official -- --server <origin>`). It is answered by the Worker
 * entry itself, before the app, so the sync code lives in one bundle.
 * Off unless the ADMIN_TOKEN secret is set; every request must carry it.
 * Body (optional JSON): { "force": true } re-reads every released day.
 */

export const ADMIN_SYNC_PATH = "/api/admin/sync";
const MIN_TOKEN_LENGTH = 32;
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

let failedAttempts = 0;
let lockedUntil = 0;

async function sameToken(given: string, expected: string): Promise<boolean> {
  const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([digest(given), digest(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function handleAdminSync(request: Request, env: { DB: D1Database; ADMIN_TOKEN?: string }): Promise<Response> {
  const token = env.ADMIN_TOKEN;
  if (request.method !== "POST" || !token || token.length < MIN_TOKEN_LENGTH) return new Response("Not found", { status: 404, headers });
  const now = Date.now();
  if (now < lockedUntil) return json({ error: "Too many failed attempts. Try again later." }, 429);
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!given || !(await sameToken(given, token))) {
    failedAttempts += 1;
    if (failedAttempts >= 10) {
      failedAttempts = 0;
      lockedUntil = now + 10 * 60_000;
    }
    return json({ error: "Unauthorized" }, 401);
  }
  failedAttempts = 0;

  let force = false;
  try {
    const body = (await request.json()) as { force?: unknown };
    force = body?.force === true;
  } catch {
    // An empty body is a plain sync.
  }
  try {
    const report = await syncOfficial(d1PuzzleStore(env.DB), fetch, new Date(), { force, maxFetches: force ? 60 : undefined });
    return json({ ok: true, summary: describeSync(report), report });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 502);
  }
}
