// The page's "leave a message" form: name, email, message. The same tray the MCP's leave_message fills, and the same forwarders
// (email, webhook, Telegram). Three a day per visitor and a dozen per address, shared with the agents; a filled honeypot is thanked and dropped.
import { allowMessage, clean, EMAIL_RE, forwardMessage, redis, storeMessage, webCaller, within } from '../lib/room.ts';

const MAX = { name: 80, email: 120, message: 1000 };
const reply = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

export async function POST(req: Request): Promise<Response> {
  // the page's own fetch only: a form posted from another site is turned away (a browser always names its origin on a cross-site POST)
  const origin = req.headers.get('origin');
  if (origin) { try { if (new URL(origin).host !== new URL(req.url).host) return reply({ ok: false, error: 'not from this room.' }, 403); } catch { return reply({ ok: false, error: 'not from this room.' }, 403); } }
  if (!/^application\/json\b/i.test((req.headers.get('content-type') || '').trim())) return reply({ ok: false, error: 'the desk takes JSON.' }, 415);
  if (Number(req.headers.get('content-length') || 0) > 8192) return reply({ ok: false, error: 'that note is too long.' }, 413);
  let body: Record<string, unknown>;
  try { const raw = await req.text(); if (raw.length > 8192) return reply({ ok: false, error: 'that note is too long.' }, 413); body = JSON.parse(raw); } catch { return reply({ ok: false, error: 'that was not a note.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ ok: false, error: 'that was not a note.' }, 400);
  if (typeof body.website === 'string' && body.website.trim()) return reply({ ok: true });   // the honeypot: only a bot fills a field nobody can see

  if (![body.name, body.email, body.message].every(v => typeof v === 'string')) return reply({ ok: false, error: 'that was not a note.' }, 400);
  const name = clean(body.name, MAX.name), email = clean(body.email, MAX.email), message = clean(body.message, MAX.message, true);
  if (!name) return reply({ ok: false, field: 'name', error: 'the name is empty.' }, 400);
  if (!EMAIL_RE.test(email)) return reply({ ok: false, field: 'email', error: 'that email does not look like one.' }, 400);
  if (!message) return reply({ ok: false, field: 'message', error: 'the message is empty.' }, 400);

  // no store, no count: without one every post would be an email, so the form waits for the tray (an agent's leave_message says the same)
  if (!redis()) return reply({ ok: false, error: 'the desk has no tray right now, so nothing was saved. try again later.' }, 503);
  const caller = webCaller(req);
  if (!(await allowMessage(caller))) return reply({ ok: false, error: 'the tray is full for today from where you are. try tomorrow.' }, 429);
  const note = { t: new Date().toISOString(), name, contact: email, message, client: caller.label, raw: clean(req.headers.get('user-agent'), 120) };
  const [stored, forwarded] = await Promise.all([within(5000, storeMessage(note), false), within(6000, forwardMessage(note), false)]);
  if (!stored && !forwarded) return reply({ ok: false, error: 'the desk has no tray right now, so nothing was saved. try again later.' }, 503);
  return reply({ ok: true, forwarded });
}
