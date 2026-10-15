/**
 * Runs the official sync on a running copy of the site.
 *
 *   npm run sync:official -- --server http://localhost:5173
 *   npm run sync:official -- --server https://originlegame.app --force
 *
 * The token is read from ADMIN_TOKEN in the environment or in .dev.vars.
 * In production the Worker's cron trigger runs the same sync on its own.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    server: { type: "string", default: process.env.OG_SERVER ?? "http://localhost:5173" },
    force: { type: "boolean", default: false },
  },
});

function token(): string {
  if (process.env.ADMIN_TOKEN) return process.env.ADMIN_TOKEN;
  const file = resolve(import.meta.dirname, "../.dev.vars");
  if (existsSync(file)) {
    const match = /^ADMIN_TOKEN=(.+)$/m.exec(readFileSync(file, "utf8"));
    if (match) return match[1].trim();
  }
  throw new Error("Set ADMIN_TOKEN (or put it in .dev.vars)");
}

const response = await fetch(new URL("/api/admin/sync", values.server), {
  method: "POST",
  headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
  body: JSON.stringify({ force: values.force }),
});
const body = (await response.json().catch(() => ({}))) as { ok?: boolean; summary?: string; error?: string };
if (!response.ok || !body.ok) {
  console.error(`Sync failed (HTTP ${response.status}): ${body.error ?? "no details"}`);
  process.exit(1);
}
console.log(`${values.server}: ${body.summary}`);
