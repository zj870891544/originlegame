# originlegame.app — working rules

Read `README.md` first: it explains the data source, the sync, the page list and two vinext workarounds.

1. Every SEO page is server-rendered; hints and answers are in the HTML, folded in `<details>`, never client-only.
2. Data comes only from what originle.io publishes for released days. Never show a guest before its day starts in
   New York, never show an older puzzle as today's, never invent answers. If the data format changes, the sync must
   stop, not guess.
3. Don't copy the guests' videos, photos or captions. Clue titles, the guest's first name, the country and the
   distance table are the only official data shown.
4. Keep the independent-fan-site disclaimer in the footer and on About.
5. Keep vinext pinned to 1.1.0 and keep `scripts/fix-server-chunks.mjs` in the build until a newer vinext is verified
   with `npm run build && npm run test:e2e`.
6. Before saying anything is done: `npm run check` (typecheck, lint, unit tests, build, end-to-end).
7. `/play` is reserved for a future game of our own.
