/**
 * Post-build fix for a vinext 1.1 bundling quirk.
 *
 * When the Worker entry ends up in a shared chunk under dist/server/_next/static
 * (here because vinext's metadata-route loader imports it dynamically), its
 * relative imports of vinext's root-level manifests, such as
 * `./__vinext_cacheability_manifest.js`, point into the wrong folder and the
 * Worker fails to start ("No such module"). This rewrites any such import to
 * the file at dist/server/, and fails the build if one can't be resolved.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const server = resolve(import.meta.dirname, "../dist/server");
const chunks = join(server, "_next/static");
const pattern = /((?:from|import\(|import)\s*)(["`])\.\/([^"`/]+\.js)\2/g;
let fixed = 0;
const missing = [];

for (const name of readdirSync(chunks).filter((file) => file.endsWith(".js"))) {
  const path = join(chunks, name);
  const source = readFileSync(path, "utf8");
  const rewritten = source.replace(pattern, (match, prefix, quote, target) => {
    if (existsSync(join(chunks, target))) return match;
    if (!existsSync(join(server, target))) {
      missing.push(`${name} -> ${target}`);
      return match;
    }
    fixed += 1;
    return `${prefix}${quote}../../${target}${quote}`;
  });
  if (rewritten !== source) writeFileSync(path, rewritten);
}

if (missing.length) {
  console.error(`Unresolvable server imports:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
console.log(`fix-server-chunks: ${fixed} import${fixed === 1 ? "" : "s"} repointed`);
