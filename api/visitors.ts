// The visitor book for the page: the last agents that connected over MCP, newest first, and how many humans walked in. Never message
// contents, never people. GET is cached at the edge for a few seconds so an open tab costs nothing; POST is the page signing it for a human.
import { countHumans, listVisits, recordHuman, webCaller, within } from '../lib/room.ts';

export async function GET(): Promise<Response> {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, s-maxage=10, stale-while-revalidate=60' };
  try {
    const [book, humans] = await Promise.all([within(4000, listVisits(20), null), within(4000, countHumans(), null)]);
    if (!book) return Response.json({ open: false, total: 0, visits: [], humans: null }, { headers });
    return Response.json({ open: true, total: book.total, visits: book.visits, humans }, { headers });
  } catch {
    return Response.json({ open: false, total: 0, visits: [], humans: null, error: 'the visitor book did not answer' }, { status: 503, headers: { ...headers, 'cache-control': 'no-store' } });
  }
}

// a human walked in: counted once a day per address (the page also asks only once a day per browser, and never when automated)
export async function POST(req: Request): Promise<Response> {
  const headers = { 'cache-control': 'no-store' };
  const origin = req.headers.get('origin');
  try { if (!origin || new URL(origin).host !== new URL(req.url).host) return Response.json({ ok: false }, { status: 403, headers }); } catch { return Response.json({ ok: false }, { status: 403, headers }); }
  const humans = await within(4000, recordHuman(webCaller(req)), null);
  return Response.json({ ok: !!humans, humans }, { headers });
}
