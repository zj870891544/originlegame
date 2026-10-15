import { env } from "cloudflare:workers";

/** The site's D1 database, bound as `DB` in wrangler.jsonc. */
export function getDb(): D1Database {
  return env.DB;
}

/**
 * Runs a read and reports whether the database answered. Public pages use this
 * so a missing binding or an unmigrated database degrades to the honest
 * "awaiting verified answers" state instead of an error page.
 */
export async function safeRead<T>(read: (db: D1Database) => Promise<T>, fallback: T): Promise<{ data: T; ok: boolean }> {
  try {
    return { data: await read(getDb()), ok: true };
  } catch (error) {
    console.error("[db] read failed", error);
    return { data: fallback, ok: false };
  }
}
