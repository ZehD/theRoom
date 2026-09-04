#!/usr/bin/env node
// Zero-dependency static server for local preview.
// Mirrors how Vercel serves this repo: static files from the repo root,
// plus the exact-match `rewrites` declared in vercel.json (so `/` -> /theroom.html).
// Dotfiles and dot-directories (.git, .vercel) are never served, same as Vercel.
//
//   npm run dev            -> http://127.0.0.1:3000
//   PORT=4000 npm run dev  -> custom port

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function loadRewrites() {
  try {
    const cfg = JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8'));
    return (cfg.rewrites ?? []).map((r) => ({ source: r.source, destination: r.destination }));
  } catch {
    return [];
  }
}

export async function startServer({ port = Number(process.env.PORT) || 3000, host = '127.0.0.1', quiet = false } = {}) {
  const rewrites = await loadRewrites();

  const server = createServer(async (req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    const hit = rewrites.find((r) => r.source === pathname);
    if (hit) pathname = hit.destination;

    const segments = pathname.split('/').filter(Boolean);
    const hidden = segments.some((s) => s.startsWith('.'));
    const filePath = resolve(ROOT, ...segments);
    const inside = filePath === ROOT || filePath.startsWith(ROOT + sep);

    let status = 404;
    if (inside && !hidden) {
      try {
        let target = filePath;
        let info = await stat(target);
        if (info.isDirectory()) {
          target = join(target, 'index.html');
          info = await stat(target);
        }
        if (info.isFile()) {
          const body = await readFile(target);
          status = 200;
          res.writeHead(200, {
            'content-type': MIME[extname(target).toLowerCase()] ?? 'application/octet-stream',
            'content-length': body.length,
            'cache-control': 'no-store',
          });
          res.end(body);
        }
      } catch {
        /* fall through to 404 */
      }
    }
    if (status === 404) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${pathname}`);
    }
    if (!quiet) console.log(`${status} ${req.method} ${req.url}`);
  });

  await new Promise((ok, fail) => {
    server.once('error', fail);
    server.listen(port, host, ok);
  });

  const { port: boundPort } = server.address();
  const url = `http://${host}:${boundPort}`;
  return { server, url, close: () => new Promise((ok) => server.close(ok)) };
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const { url } = await startServer();
  console.log(`theRoom local preview: ${url}  (serving ${ROOT})`);
  console.log('Press Ctrl+C to stop.');
}
