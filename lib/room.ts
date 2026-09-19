// Shared bits for the room's functions: the markdown, the visitor book (Upstash Redis), rate limits, the message tray.
// Everything degrades honestly when the store is not configured: reads say so, writes say nothing was saved.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const SITE = 'https://theroom-seven-theta.vercel.app';
export const MCP_URL = `${SITE}/mcp`;
export const INSTALL_LINE = `claude mcp add --transport http theroom ${MCP_URL}`;

const KEYS = { visits: 'theroom:visits', total: 'theroom:visits:total', messages: 'theroom:messages', seen: 'theroom:seen' };
const VISITS_KEPT = 50, MESSAGES_KEPT = 200;

// ── the room as text ─────────────────────────────────────────────────────────────────────────────
let roomMd: Promise<string> | null = null;
export function readRoom(): Promise<string> {
  roomMd ??= readFile(join(process.cwd(), 'room.md'), 'utf8').catch(err => { roomMd = null; throw err; });
  return roomMd;
}

// ── the store ────────────────────────────────────────────────────────────────────────────────────
let redisClient: Redis | null | undefined;
export function redis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  // Short timeouts and one retry: a slow or dead store must cost a tool call seconds, never a hang.
  redisClient = url && token ? new Redis({ url, token, automaticDeserialization: false, signal: () => AbortSignal.timeout(3500), retry: { retries: 1, backoff: () => 200 } }) : null;
  return redisClient;
}
// A hard cap on any store call: after `ms` the fallback wins and the tool answers anyway.
export function within<T>(ms: number, p: Promise<T>, fallback: T): Promise<T> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(fallback), ms);
    p.then(v => { clearTimeout(timer); resolve(v); }, () => { clearTimeout(timer); resolve(fallback); });
  });
}

// ── who is calling ───────────────────────────────────────────────────────────────────────────────
export type Caller = { ip: string; clientName: string; clientVersion: string; label: string; identity: string };

// Client names are attacker-controlled text. Only a known name is ever shown; the rest are "an unknown client".
const KNOWN: [RegExp, string][] = [
  [/claude[-_ ]?code/i, 'claude code'], [/claude[-_ ]?desktop/i, 'claude desktop'], [/claude/i, 'claude'],
  [/anthropic/i, 'anthropic api'], [/cursor/i, 'cursor'], [/windsurf/i, 'windsurf'], [/copilot|vscode|visual studio/i, 'vs code'],
  [/zed/i, 'zed'], [/cline/i, 'cline'], [/openai|chatgpt/i, 'chatgpt'], [/gemini/i, 'gemini'], [/goose/i, 'goose'],
  [/inspector/i, 'mcp inspector'], [/n8n/i, 'n8n'], [/langchain|langgraph/i, 'langchain'], [/mcp-cli|mcp cli/i, 'mcp cli']
];
export function displayClient(name: string): string {
  for (const [re, label] of KNOWN) if (re.test(name)) return label;
  return 'an unknown client';
}
export const clean = (s: unknown, max: number, keepNewlines = false): string =>
  String(s ?? '').replace(keepNewlines ? /[^\P{C}\n]/gu : /\p{C}/gu, '').replace(/[ \t]+/g, ' ').trim().slice(0, max);
const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

export type ClientInfo = { name?: string; version?: string };
export const ipOf = (req: Request | undefined): string => {
  const h = req?.headers;
  return (h?.get('x-forwarded-for') ?? '').split(',')[0].trim() || h?.get('x-real-ip') || 'unknown';
};
// In stateless Streamable HTTP the client's name travels only on `initialize` (2025-era clients) or in each request's
// `_meta` (2026-era). A tool call from a 2025-era client lands on a different invocation, so the name is remembered by
// address for an hour: in this instance's memory first, in the store second.
const CLIENT_META_KEY = 'io.modelcontextprotocol/clientInfo';
const recent = new Map<string, { client: ClientInfo; at: number }>();
// One look at the body: the client's name if it is there (clamped at the source, it is attacker text) and how many
// JSON-RPC messages the request carries (legacy batches are allowed by the SDK; the door caps them).
export async function peekRequest(req: Request): Promise<{ client?: ClientInfo; count: number }> {
  if (req.method !== 'POST') return { count: 0 };
  try {
    const body = await req.clone().json();
    const msgs = Array.isArray(body) ? body : [body];
    let client: ClientInfo | undefined;
    for (const m of msgs) {
      const c = m?.params?._meta?.[CLIENT_META_KEY] ?? (m?.method === 'initialize' ? m?.params?.clientInfo : undefined);
      if (!client && c && typeof c === 'object' && typeof c.name === 'string') client = { name: c.name.slice(0, 80), version: typeof c.version === 'string' ? c.version.slice(0, 40) : undefined };
    }
    return { client, count: msgs.length };
  } catch { return { count: 1 }; }   // not JSON, or no body: the SDK will say so
}
export function rememberClient(ip: string, client: ClientInfo): void {
  recent.set(ip, { client, at: Date.now() });
  if (recent.size > 500) { const oldest = [...recent.entries()].sort((a, b) => a[1].at - b[1].at)[0]; if (oldest) recent.delete(oldest[0]); }
  const r = redis(); if (r) void within(2000, r.set(`theroom:client:${hash(ip)}`, JSON.stringify(client), { ex: 3600 }), null);
}
export async function recallClient(ip: string): Promise<ClientInfo | undefined> {
  const m = recent.get(ip); if (m && Date.now() - m.at < 3_600_000) return m.client;
  const r = redis(); if (!r) return undefined;
  const raw = await within(1500, r.get<string>(`theroom:client:${hash(ip)}`), null);
  if (!raw) return undefined;
  try { const c = JSON.parse(raw); if (c && typeof c.name === 'string') { recent.set(ip, { client: c, at: Date.now() }); return c; } } catch { /* a bad row */ }
  return undefined;
}

export function callerFrom(req: Request | undefined, client: ClientInfo | undefined): Caller {
  const h = req?.headers;
  const ip = ipOf(req);
  const clientName = clean(client?.name, 40) || clean(h?.get('user-agent'), 40) || 'unknown';
  const clientVersion = clean(client?.version, 20);
  const label = displayClient(clientName);
  // identity = displayed label + address: cycling made-up client names collapses into one visitor
  return { ip, clientName, clientVersion, label, identity: hash(`${label}|${ip}`) };
}

// ── rate limits: real when the store is there, absent otherwise (the README says so) ─────────────
// Keys are hashed addresses, never raw IPs. Calls: generous per address, since claude.ai sessions share egress
// addresses. Messages: three a day per visitor (label + address) and a dozen a day per address, so cycling client
// names cannot turn one address into a spam pipe.
let limiters: { calls: Ratelimit; perVisitor: Ratelimit; perAddress: Ratelimit } | null = null;
function limitersFor(r: Redis) {
  return (limiters ??= {
    calls: new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(300, '10 m'), prefix: 'theroom:rl:calls', timeout: 3000 }),
    perVisitor: new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(3, '1 d'), prefix: 'theroom:rl:messages', timeout: 3000 }),
    perAddress: new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(12, '1 d'), prefix: 'theroom:rl:address', timeout: 3000 })
  });
}
// All limits fail open: a store that errors or times out lets the call through (the README says the limits are soft).
export async function allowCall(caller: Caller): Promise<boolean> {
  const r = redis(); if (!r) return true;
  return within(4000, limitersFor(r).calls.limit(hash(caller.ip)).then(x => x.success), true);
}
export async function allowMessage(caller: Caller): Promise<boolean> {
  const r = redis(); if (!r) return true;
  const L = limitersFor(r);
  const [visitor, address] = await Promise.all([
    within(4000, L.perVisitor.limit(caller.identity).then(x => x.success), true),
    within(4000, L.perAddress.limit(hash(caller.ip)).then(x => x.success), true)
  ]);
  return visitor && address;
}

// ── the visitor book ─────────────────────────────────────────────────────────────────────────────
export type Visit = { t: string; client: string; tool: string };
type StoredVisit = Visit & { raw: string };

// A visit is one client from one address within an hour; the first tool it calls names the visit.
export async function recordVisit(caller: Caller, tool: string): Promise<{ n: number; fresh: boolean } | null> {
  const r = redis(); if (!r) return null;
  const hour = Math.floor(Date.now() / 3_600_000);
  const fresh = (await r.set(`${KEYS.seen}:${caller.identity}:${hour}`, '1', { nx: true, ex: 3600 })) === 'OK';
  if (!fresh) return { n: Number(await r.get<string>(KEYS.total)) || 0, fresh: false };
  const entry: StoredVisit = { t: new Date().toISOString(), client: caller.label, tool, raw: `${caller.clientName}${caller.clientVersion ? '/' + caller.clientVersion : ''}` };
  const p = r.pipeline();
  p.lpush(KEYS.visits, JSON.stringify(entry)); p.ltrim(KEYS.visits, 0, VISITS_KEPT - 1); p.incr(KEYS.total);
  const out = await p.exec<[number, string, number]>();
  forgetBook();
  return { n: Number(out[2]) || 0, fresh: true };
}
// The whole book (50 rows) is read at once and kept for ten seconds in this instance, so a loop of reads with cache-busting
// query strings costs the store nothing after the first.
let bookMemo: { at: number; book: { total: number; visits: Visit[] } } | null = null;
export async function listVisits(n = 20): Promise<{ total: number; visits: Visit[] } | null> {
  const r = redis(); if (!r) return null;
  if (!bookMemo || Date.now() - bookMemo.at > 10_000) {
    const [rows, total] = await Promise.all([r.lrange<string>(KEYS.visits, 0, VISITS_KEPT - 1), r.get<string>(KEYS.total)]);
    const visits: Visit[] = [];
    for (const row of rows) {
      try { const v = typeof row === 'string' ? JSON.parse(row) : row; visits.push({ t: String(v.t), client: String(v.client), tool: String(v.tool) }); } catch { /* a bad row stays out */ }
    }
    bookMemo = { at: Date.now(), book: { total: Number(total) || 0, visits } };
  }
  return { total: bookMemo.book.total, visits: bookMemo.book.visits.slice(0, Math.max(1, n)) };
}
export const forgetBook = () => { bookMemo = null; };
export const when = (iso: string) => iso.replace('T', ' ').slice(0, 16) + ' UTC';

// ── the message tray ─────────────────────────────────────────────────────────────────────────────
export type Message = { t: string; name: string; contact: string; message: string; client: string; raw: string };
export async function storeMessage(m: Message): Promise<boolean> {
  const r = redis(); if (!r) return false;
  const p = r.pipeline(); p.lpush(KEYS.messages, JSON.stringify(m)); p.ltrim(KEYS.messages, 0, MESSAGES_KEPT - 1); await p.exec();
  return true;
}
// Forwarding is optional: a webhook (n8n, anything that takes JSON) and/or a Telegram bot. Both fail quietly; the tray keeps the note.
export async function forwardMessage(m: Message): Promise<boolean> {
  const jobs: Promise<Response>[] = [];
  const hook = process.env.MESSAGE_WEBHOOK_URL;
  if (hook) jobs.push(fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.MESSAGE_WEBHOOK_SECRET ? { 'x-theroom-secret': process.env.MESSAGE_WEBHOOK_SECRET } : {}) }, body: JSON.stringify(m) }));
  const bot = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (bot && chat) jobs.push(fetch(`https://api.telegram.org/bot${bot}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: `theRoom · a note on the desk\nfrom: ${m.name} (${m.contact})\nvia: ${m.client}\n\n${m.message}` }) }));
  if (!jobs.length) return false;
  const results = await Promise.allSettled(jobs);
  return results.some(x => x.status === 'fulfilled' && x.value.ok);
}
