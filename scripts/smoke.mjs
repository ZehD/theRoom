#!/usr/bin/env node
// Smoke test for the deployed page. Runs against a local preview by default,
// or against any base URL you pass:
//
//   npm test                                          -> spins up scripts/serve.mjs, tests it, shuts down
//   node scripts/smoke.mjs https://example.vercel.app -> tests a live deployment
//
// Checks: the root rewrite serves the page with the expected <title>, the page
// itself is reachable, and every local asset the page references exists and
// comes back with a sensible content-type. Exit code 1 on any failure.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, startServer } from './serve.mjs';

const PAGE = 'theroom.html';
const EXPECTED_TITLE = 'Luiz Cordeiro · theRoom';

const EXPECTED_TYPE = {
  '.html': 'text/html',
  '.mp3': 'audio/mpeg',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

// Local files the page depends on at runtime: declared resource dependencies,
// src/href attributes, and string literals passed to fetch().
function localAssetsReferencedBy(html) {
  const refs = new Set();
  for (const m of html.matchAll(/<meta\s+name="ext-resource-dependency"\s+content="([^"]+)"/g)) refs.add(m[1]);
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) refs.add(m[1]);
  for (const m of html.matchAll(/fetch\(\s*(?:[^)'"]*\|\|\s*)?["']([^"']+)["']/g)) refs.add(m[1]);
  return [...refs]
    .filter((r) => !/^(?:https?:|data:|blob:|#|javascript:|mailto:|\/\/)/i.test(r))
    // Skip dynamic values built in script code (template literals, calls) — not static files.
    .filter((r) => !/[${}()<>\s]/.test(r))
    .map((r) => '/' + r.replace(/^\.?\//, ''));
}

let base = process.argv[2]?.replace(/\/+$/, '');
let local;
if (!base) {
  local = await startServer({ port: 0, quiet: true });
  base = local.url;
}

const results = [];
async function check(path, { contains, type } = {}) {
  const url = base + path;
  const problems = [];
  let status = 0;
  let bytes = 0;
  let contentType = '';
  try {
    // `connection: close` so no keep-alive socket outlives the test and holds the process open.
    const res = await fetch(url, { redirect: 'manual', headers: { connection: 'close' } });
    status = res.status;
    contentType = res.headers.get('content-type') ?? '';
    const buf = new Uint8Array(await res.arrayBuffer());
    bytes = buf.length;
    if (status !== 200) problems.push(`expected 200, got ${status}`);
    if (bytes === 0) problems.push('empty body');
    if (type && !contentType.startsWith(type)) problems.push(`content-type "${contentType}" does not start with "${type}"`);
    if (contains && !new TextDecoder().decode(buf).includes(contains)) problems.push(`body does not contain ${JSON.stringify(contains)}`);
  } catch (err) {
    problems.push(`request failed: ${err.message}`);
  }
  results.push({ path, status, bytes, contentType, problems });
}

await check('/', { type: 'text/html', contains: `<title>${EXPECTED_TITLE}</title>` });
await check('/' + PAGE, { type: 'text/html', contains: `<title>${EXPECTED_TITLE}</title>` });

const html = await readFile(join(ROOT, PAGE), 'utf8');
for (const asset of localAssetsReferencedBy(html)) {
  const ext = asset.slice(asset.lastIndexOf('.')).toLowerCase();
  await check(asset, { type: EXPECTED_TYPE[ext] });
}

if (local) {
  local.server.closeAllConnections();
  await local.close();
}

const failed = results.filter((r) => r.problems.length);
console.log(`\nSmoke test against ${base}\n`);
for (const r of results) {
  const mark = r.problems.length ? 'FAIL' : ' ok ';
  console.log(`  [${mark}] ${r.path.padEnd(28)} ${String(r.status).padStart(3)}  ${String(r.bytes).padStart(8)} B  ${r.contentType}`);
  for (const p of r.problems) console.log(`         - ${p}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed.\n`);
// Let the process end on its own; calling process.exit() while the server is still
// tearing down trips a libuv assertion on Windows.
process.exitCode = failed.length ? 1 : 0;
