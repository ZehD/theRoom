#!/usr/bin/env node
// A tiny stand-in for Upstash's REST protocol, for local tests of the visitor book and the message tray without a database.
// Speaks just enough: POST / with a JSON command array, POST /pipeline with an array of them. Data lives in memory.
//
//   node scripts/fake-upstash.mjs            -> http://127.0.0.1:3199
//   UPSTASH_REDIS_REST_URL=http://127.0.0.1:3199 UPSTASH_REDIS_REST_TOKEN=x PORT=3102 node scripts/mcp-serve.mjs
//
// EVAL / EVALSHA (the rate limiter's Lua) answer with an error on purpose: the server must fail open, not hang.

import { createServer } from 'node:http';

const store = new Map();   // key -> { v: string | string[], exp?: number }
const live = k => { const e = store.get(k); if (e && e.exp && e.exp < Date.now()) { store.delete(k); return undefined; } return e; };

function run(cmd) {
  const [name, ...a] = cmd.map(String); const op = name.toUpperCase();
  switch (op) {
    case 'PING': return 'PONG';
    case 'GET': return live(a[0])?.v ?? null;
    case 'SET': {
      const [k, v, ...opts] = a; const up = opts.map(o => o.toUpperCase());
      if (up.includes('NX') && live(k)) return null;
      const ex = up.indexOf('EX'); store.set(k, { v, exp: ex >= 0 ? Date.now() + Number(opts[ex + 1]) * 1000 : undefined }); return 'OK';
    }
    case 'INCR': { const e = live(a[0]); const n = (Number(e?.v) || 0) + 1; store.set(a[0], { v: String(n) }); return n; }
    case 'LPUSH': { const e = live(a[0]) ?? { v: [] }; e.v = [...a.slice(1).reverse(), ...e.v]; store.set(a[0], e); return e.v.length; }
    case 'LTRIM': { const e = live(a[0]); if (e) e.v = e.v.slice(Number(a[1]), Number(a[2]) + 1); return 'OK'; }
    case 'LRANGE': { const e = live(a[0]); if (!e) return []; const stop = Number(a[2]); return e.v.slice(Number(a[1]), stop < 0 ? undefined : stop + 1); }
    case 'DEL': { let n = 0; for (const k of a) if (store.delete(k)) n++; return n; }
    case 'KEYS': { const re = new RegExp('^' + a[0].replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'); return [...store.keys()].filter(k => re.test(k)); }
    case 'FLUSHALL': store.clear(); return 'OK';
    case 'EVAL': case 'EVALSHA': case 'SCRIPT': throw new Error('ERR fake-upstash: scripts are not supported here');
    default: throw new Error(`ERR unknown command '${name}'`);
  }
}
const answer = cmd => { try { return { result: run(cmd) }; } catch (e) { return { error: e.message }; } };

createServer(async (req, res) => {
  let body = ''; for await (const c of req) body += c;
  let out;
  try {
    const parsed = JSON.parse(body || '[]');
    out = req.url.startsWith('/pipeline') ? parsed.map(answer) : req.url.startsWith('/multi-exec') ? parsed.map(answer) : answer(parsed);
  } catch (e) { out = { error: 'ERR bad request: ' + e.message }; }
  res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(out));
}).listen(Number(process.env.PORT) || 3199, '127.0.0.1', () => console.log(`fake upstash at http://127.0.0.1:${Number(process.env.PORT) || 3199}`));
