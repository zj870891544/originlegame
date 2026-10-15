/**
 * Renders public/og.png and the app icons from HTML with the site's own fonts.
 *
 *   npm run assets:brand
 *
 * Uses the locally installed Chromium through Playwright; nothing is downloaded.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "..");
const font = (path: string) => `data:font/woff2;base64,${readFileSync(resolve(root, "node_modules", path)).toString("base64")}`;
const fonts = `
  @font-face { font-family: Display; font-weight: 100 900; src: url(${font("@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2")}) format("woff2"); }
  @font-face { font-family: Sans; font-weight: 100 900; src: url(${font("@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2")}) format("woff2"); }
`;
const mark = readFileSync(resolve(root, "public/favicon.svg"), "utf8");

const icon = (size: number) =>
  `<html><body style="margin:0;background:transparent">${mark.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`;

const airmail = "repeating-linear-gradient(-45deg,#C8413B 0 22px,#FFFAF1 22px 33px,#2F4C8C 33px 55px,#FFFAF1 55px 66px)";
const social = `<html><head><style>${fonts}
  body { margin:0; width:1200px; height:630px; font-family:Sans; color:#1D2B2A; background:#F3ECDF;
    background-image: linear-gradient(to right, rgb(30 94 90/.08) 1px, transparent 1px), linear-gradient(to bottom, rgb(30 94 90/.08) 1px, transparent 1px);
    background-size: 40px 40px; position:relative; overflow:hidden; }
  .card { position:absolute; left:64px; top:60px; width:1072px; height:510px; padding:10px; border-radius:14px; background:${airmail}; }
  .inner { background:#FFFAF1; border-radius:8px; height:100%; box-sizing:border-box; padding:56px 64px; position:relative; }
  .brand { display:flex; align-items:center; gap:16px; font-family:Display; font-weight:700; font-size:34px; }
  .brand span { color:#1E5E5A; }
  h1 { font-family:Display; font-weight:720; font-size:74px; line-height:1.02; letter-spacing:-1.5px; margin:40px 0 0; max-width:640px; }
  p { font-size:27px; color:#4E5C59; margin:22px 0 0; max-width:600px; line-height:1.35; }
  .stamp { position:absolute; right:64px; top:200px; transform:rotate(-8deg); border:5px double #C8413B; color:#C8413B; border-radius:16px;
    padding:18px 30px; text-align:center; font-family:Display; }
  .stamp b { display:block; font-size:44px; font-weight:780; letter-spacing:2px; }
  .stamp small { font-family:Sans; font-weight:700; font-size:18px; letter-spacing:3px; }
  .url { position:absolute; right:64px; bottom:44px; font-weight:700; font-size:24px; color:#1E5E5A; }
</style></head><body>
  <div class="card"><div class="inner">
    <div class="brand">${mark.replace("<svg ", '<svg width="52" height="52" ')}<div>Originle <span>Game</span></div></div>
    <h1>Originle answer today, with hints first</h1>
    <p>Three spoiler-free hints, the answer when you want it, and every past guest.</p>
    <div class="stamp"><small>WHERE ARE</small><b>THEY FROM?</b><small>DAILY GUIDE</small></div>
    <div class="url">originlegame.app</div>
  </div></div>
</body></html>`;

const browser = await chromium.launch();
const shoot = async (html: string, width: number, height: number, path: string, transparent = false) => {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(root, "public", path), omitBackground: transparent });
  await page.close();
  console.log(`public/${path}`);
};
await shoot(social, 1200, 630, "og.png");
await shoot(icon(512), 512, 512, "icon-512.png", true);
await shoot(icon(192), 192, 192, "icon-192.png", true);
await shoot(icon(180).replace("background:transparent", "background:#F3ECDF"), 180, 180, "apple-touch-icon.png");
await browser.close();
