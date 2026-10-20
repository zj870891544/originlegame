# Originle Game (originlegame.app)

Source for **https://originlegame.app**: an independent guide to [Originle](https://originle.io/), the daily
guess-the-country game. Today's answer behind three spoiler-free hints, the nearby countries for close misses,
an archive with a page for every guest, the rules with exact scoring tables, and similar games.

Not affiliated with or endorsed by Originle. Built the same way as krilliontoday.com.

## Pages

| Path | What it is | Keyword it targets |
|---|---|---|
| `/` | The game, today's guest card (hints, clue titles, answer), how it works, guide links, recent answers, FAQ | originle game |
| `/today` | Today's answer, close misses with scores, yesterday's answer | originle answer today |
| `/hints` | Three hints that get stronger, the clue titles, a "which clue are you on" tracker, how to read each kind of clue | originle hints |
| `/archive` | Every puzzle, answers blurred until tapped | originle archive |
| `/archive/<n>` | One puzzle: guest/date summary, hints, answer, country and distance explanation, source times, folded FAQ, previous/next | originle #n answer, originle <date> answer |
| `/how-to-play` | Rule card, first round, scoring tables, overlooked rules, tips, comparison table, FAQ | how to play originle |
| `/originle-score-calculator` | Interactive score calculator (round or pasted share text), clue and miss costs, scoring FAQ | originle score calculator |
| `/originle-solver` | Country candidates from wrong-guess distances and an optional continent, using independent boundary estimates and adjustable tolerance | originle solver, originle distance solver |
| `/guess-where-im-from-game` | For people who saw the game but don't know its name: what Originle is, roots vs nationality | guess where someone is from game |
| `/games-like-originle` | Ten similar daily games | games like originle |
| `/about`, `/privacy`, `/terms` | Sources and editorial notes, privacy, terms | |

`/play` is deliberately left free for a game of our own later. Old or alternative addresses
(`/originle-answer-today`, `/rules`, …) redirect permanently; see `next.config.ts`.

## Stack

- Next.js App Router API on [vinext](https://github.com/cloudflare/vinext) 1.1.0 (pinned), React 19, TypeScript, Tailwind CSS 4
- Cloudflare Workers, D1 for the puzzles, a cron trigger for the sync, the edge cache for pages
- Vitest (unit) and Playwright (end-to-end against the built Worker in `workerd`)

## Quick start

Requires Node 22+.

```sh
npm install
cp .dev.vars.example .dev.vars        # put 32+ random characters in ADMIN_TOKEN
npm run db:migrate:local
npm run dev                           # http://localhost:5173
npm run sync:official                 # fills the local database from originle.io
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server in the Workers runtime |
| `npm run build` | Production build into `dist/` (runs `scripts/fix-server-chunks.mjs` afterwards, see below) |
| `npm run deploy` | Deploy the existing production build; run `check` or `build` first |
| `npm run preview` | Serve the build with Wrangler on port 8787 (IndexNow off) |
| `npm run typecheck` / `lint` / `test` | TypeScript, ESLint, Vitest |
| `npm run test:e2e` | Playwright against the build (run `build` first) |
| `npm run check` | All of the above, in order |
| `npm run db:migrate:local` / `db:migrate:remote` | Apply D1 migrations |
| `npm run sync:official -- --server <origin> [--force]` | Run the sync on a running site (needs `ADMIN_TOKEN`) |
| `npm run assets:brand` | Re-render `public/og.png` and the icons |
| `npx tsx scripts/build-countries.ts` | Regenerate `src/data/countries.ts` |

## How it fits together

- **Where the data comes from** (`src/lib/official/source.ts`). Originle is a static site.
  `originle.io/daily-config.js` lists the guests in order from the launch date (2026-10-05), and each released
  guest's `originle.io/<id>/day.js` holds the guest's name, the country (ISO code), the eight clue titles and the
  border-to-border distance from that country to all 197 others. Unreleased days answer 403, so the site can't see
  a guest early. Both files are parsed as JSON, never executed, and validated with zod; if their shape changes the
  sync stops instead of guessing.
- **Sync** (`src/lib/official/sync.ts`, `worker/index.ts`). The cron trigger runs every 5 minutes in the two hours
  around midnight New York time and every 30 minutes otherwise. Each run stores any released day that's missing
  and re-checks today's guest every 2 hours; an unchanged day only has its check time updated. Every run is logged
  in `sync_runs`. Changed pages are announced to IndexNow after the page cache has turned over.
- **Game day** (`src/lib/time/game-day.ts`): every date is the calendar date in `America/New_York`, puzzle `#n` is
  `n − 1` days after launch, and the rollover follows daylight saving on its own.
- **No data, no claims.** If today's guest isn't stored yet, pages say it's on its way; an older puzzle is never
  shown as today's. Future puzzle numbers are 404s.
- **Hints** (`src/lib/puzzle/view.ts`) are written from the data: (1) continent and coastline/landlocked status, (2) region
  and official languages, (3) first letter, letter count and nearby countries in the game's distance table. An editor can replace them
  for a day by setting `hints_json` to a JSON array of three strings. Country facts live in `src/data/countries.ts`
  (names as the game names them; capitals/languages from `countries-list`, MIT; UN M49 regions).
- **Close misses** use the game's own distance table: 0 km is a recorded game distance, not proof of a shared land border. Points follow the published formula
  in `src/lib/official/scoring.ts` (checked against the game's scoring script on 2026-10-15). Puzzles #1 and #2 keep
  the original rules.
- **The official game can't be embedded** (`frame-ancestors 'none'`), so every "play" entry is a link to
  originle.io with UTM tags.
- **Page cache** (`src/lib/edge/page-cache.ts`, from krilliontoday): pages are rendered once per data centre and
  reused for 2 minutes (daily pages) or an hour, never past the reset or across deployments. `x-og-cache: hit|miss`.
- **One address per page**: HTTP and `www` redirect to `https://originlegame.app`; any other host is `noindex`
  with a closed `robots.txt`.
- **Admin sync** `POST /api/admin/sync` is answered by the Worker entry itself (`src/lib/admin/sync-endpoint.ts`),
  not as an app route: an app route sharing the sync code with the Worker entry makes vinext 1.1 split the entry
  into a chunk. Off unless the `ADMIN_TOKEN` secret is set.
- **`scripts/fix-server-chunks.mjs`**: vinext 1.1 loads metadata routes (sitemap, robots) by dynamically importing
  the Worker entry, which then lands in `dist/server/_next/static/` and its relative imports of vinext's root-level
  manifests break ("No such module"). The post-build script repoints them and fails the build if one can't be found.

The deploy command uses `--skip-build` so vinext deploys the build after the server-chunk fix. Its built-in
rebuild would bypass that fix; always run `npm run check` or `npm run build` before deploying.

## Independent country solver

`src/lib/solver` filters 197 countries using up to three wrong-guess distances, an optional continent and
adjustable tolerance. It uses a static symmetric distance matrix from Natural Earth v5.1.2 public-domain
country polygons, sampled on the sphere at up to 2 km intervals. It never reads the daily answer, guest or
database. Country footprints and overseas territories can differ substantially from the game's table;
even a wide tolerance cannot guarantee the correct country is included.

The generated `src/data/solver-distances.ts` includes source and matrix hashes. To regenerate it offline:

```sh
python3 -m venv /tmp/originle-solver-venv
/tmp/originle-solver-venv/bin/pip install numpy==2.4.4 scipy==1.17.1 shapely==2.1.2
/tmp/originle-solver-venv/bin/python scripts/build-solver-distances.py --report /tmp/originle-solver-model-build.json
```

The generator pins and checks the source hash and fails on missing or ambiguous country mappings.
These Python packages are build tools only; the website adds no runtime GIS dependencies.

## Deploying to Cloudflare

One-time setup:

```sh
npx wrangler d1 create originlegame          # copy database_id into wrangler.jsonc
npm run db:migrate:remote
npm run check && npm run deploy
npx wrangler secret put ADMIN_TOKEN --name originlegame     # optional: enables the manual sync
npm run sync:official -- --server https://originlegame.<account>.workers.dev
```

Then add `originlegame.app` and `www.originlegame.app` as **Custom Domains** on the Worker (the domain's DNS must
be on Cloudflare). Recommended: a rate-limiting rule on `/api/admin/*`.

Search setup: verify the domain in Google Search Console and Bing Webmaster Tools and submit
`https://originlegame.app/sitemap.xml`. Keep the Google verification TXT record in Cloudflare DNS and
`public/BingSiteAuth.xml` so ownership remains verified.

GA4 uses web stream `G-C5F3XYH0N1` (`Originle Game Web`). Enhanced Measurement is off: the app sends page views
and interactions itself, avoiding duplicate history-change page views. Attribution retains short, approved UTM
campaign tags and the actual referring site; other query parameters and fragments are excluded. A link with only
`utm_source=chatgpt.com` gets `utm_medium=ai-assistant` in its GA page location, including when no browser referrer is
available. An explicit medium is preserved, and the browser URL is unchanged. In GA's **Reports → Acquisition →
Traffic acquisition**, select **Session source / medium** and filter for `chatgpt.com / ai-assistant` (or select
the **AI Assistant** default channel). This follows [Google's channel definition](https://support.google.com/analytics/answer/9756891?hl=en).
Untagged visits with a real `chatgpt.com` or `chat.openai.com` referrer continue to use GA's normal attribution.

The production robots rules allow `OAI-SearchBot` (ChatGPT search), `ChatGPT-User` (user-requested fetching), and
`GPTBot` (training, a separate choice). The answer, dated summary and public source are server-rendered. The
`llms.txt` summary also links to each day's permanent archive page. These help discovery and citation; they do
not guarantee indexing, ranking or traffic. Keep Cloudflare's per-crawler block controls off for permitted bots.

Optional: set up Cloudflare Email Routing for `hello@originlegame.app`.

## Environment

| Name | Where | Purpose |
|---|---|---|
| `DB` | `wrangler.jsonc` binding | The D1 database |
| `SITE_URL` | var | Canonical origin |
| `PAGE_CACHE` | var | `off` always renders (tests) |
| `HTTPS_ONLY` | var | `off` serves plain HTTP (tests) |
| `INDEXNOW_KEY` | var | Public IndexNow key, matches `public/<key>.txt`; `off` disables announcements |
| `GA_MEASUREMENT_ID` | var | GA4 stream; analytics only run on the HTTPS production host |
| `ADMIN_TOKEN` | secret / `.dev.vars` | Enables `POST /api/admin/sync` |
