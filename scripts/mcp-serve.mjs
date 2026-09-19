#!/usr/bin/env node
// Runs the room's functions locally the way Vercel mounts them, so the MCP inspector can drive them before a push.
//
//   npm run dev:mcp                      -> http://127.0.0.1:3100/mcp and /api/visitors
//   npx @modelcontextprotocol/inspector --cli http://127.0.0.1:3100/mcp --method tools/list
//
// Needs Node 22+ (it imports the .ts sources directly). Without Upstash variables in the environment the store is
// absent and the tools answer honestly that nobody is counting.

import { createServer } from 'node:http';
import { Readable } from 'node:stream';

const mcp = await import('../api/mcp.ts');
const visitors = await import('../api/visitors.ts');
const port = Number(process.env.PORT) || 3100;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const route = url.pathname === '/mcp' || url.pathname === '/api/mcp' ? mcp : url.pathname === '/api/visitors' ? visitors : null;
  const fn = route?.[req.method];
  if (!fn) { res.writeHead(route ? 405 : 404); res.end(); return; }
  try {
    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req);
    const response = await fn(new Request(url, { method: req.method, headers: req.headers, body, duplex: 'half' }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body).pipe(res); else res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'content-type': 'text/plain' }); res.end(String(err?.stack || err));
  }
});
server.listen(port, '127.0.0.1', () => console.log(`theRoom functions at http://127.0.0.1:${port}/mcp`));
