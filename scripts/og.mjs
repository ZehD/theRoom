#!/usr/bin/env node
// Renders the room's share images from the logo mark, so a link preview and a home-screen icon look like the site.
//
//   node scripts/og.mjs        -> og.png (1200x630, the card) and icon.png (180x180, apple-touch-icon)
//
// Needs Playwright and the installed Chrome, same as scripts/shot.mjs. Re-run it only when the logo or the palette changes;
// both files are committed.

import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/Users/luizaurio/.npm/_npx/e41f203b7505f1fb/node_modules/playwright', '/Users/luizaurio/.npm/_npx/9833c18b2d85bc59/node_modules/playwright', 'playwright']) {
  try { ({ chromium } = require(p)); break; } catch {}
}
if (!chromium) { console.error('playwright not found'); process.exit(1); }

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const INK = '#060A07', PH = '#5FB0FF', DIM = '#085FA6', BLOOM = '#B6D8FF';
const MARK = (scale, stroke) => `<svg viewBox="0 0 32 32" width="${32 * scale}" height="${32 * scale}" fill="none" stroke="${PH}" stroke-width="${stroke}" shape-rendering="crispEdges"><path d="M3 5h26v18H3zM11 29h10M16 23v6M7 10l3 3-3 3"/><rect x="13" y="10" width="3" height="6" fill="${BLOOM}" stroke="none"/></svg>`;
const SCAN = `repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px)`;

const page$ = (body, css) => `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=VT323&family=Doto:ROND,wght@0,800&family=Silkscreen&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:${INK};color:${PH};overflow:hidden}${css}</style>${body}`;

const CARD = page$(`<div class="c">
    <div class="mark">${MARK(4.6, 2)}</div>
    <div class="txt"><b>theRoom</b><small>by Luiz Cordeiro</small></div>
    <div class="foot"><span class="p">luiz@theroom:~$</span> are you human? [yes/no]<i></i></div>
  </div>`,
  `.c{position:relative;width:100%;height:100%;display:grid;align-content:center;justify-items:start;gap:34px;padding:0 96px;
      background:${SCAN}, radial-gradient(ellipse at 38% 45%, rgba(95,176,255,.10), transparent 62%)}
   .c::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,.65) 100%)}
   .mark{display:flex;filter:drop-shadow(0 0 18px rgba(95,176,255,.45))}
   .txt b{display:block;font:800 128px/0.9 Doto,monospace;font-variation-settings:"ROND" 0,"wght" 800;color:${BLOOM};letter-spacing:.02em;text-shadow:0 0 26px rgba(95,176,255,.5)}
   .txt small{display:block;margin-top:22px;font:28px/1 Silkscreen,monospace;letter-spacing:.22em;text-transform:uppercase;color:${DIM}}
   .foot{position:absolute;left:96px;bottom:74px;font:34px/1 VT323,monospace;color:${PH};text-shadow:0 0 10px rgba(95,176,255,.5)}
   .foot .p{color:${DIM}}
   .foot i{display:inline-block;width:.5em;height:.9em;margin-left:.35em;vertical-align:-.1em;background:${BLOOM}}`);

const ICON = page$(`<div class="c">${MARK(4.2, 2.4)}</div>`,
  `.c{width:100%;height:100%;display:grid;place-items:center;background:${INK};filter:drop-shadow(0 0 14px rgba(95,176,255,.5))}`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [name, html, w, h] of [['og.png', CARD, 1200, 630], ['icon.png', ICON, 180, 180]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(ROOT, name) });
  console.log(`wrote ${name} (${w}x${h})`);
  await page.context().close();
}
await browser.close();
