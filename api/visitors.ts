// The visitor book for the page: the last agents that connected over MCP, newest first. Never message contents, never people.
// Cached at the edge for a few seconds so an open tab costs nothing.
import { listVisits, within } from '../lib/room.ts';

export async function GET(): Promise<Response> {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, s-maxage=10, stale-while-revalidate=60' };
  try {
    const book = await within(4000, listVisits(20), null);
    if (!book) return Response.json({ open: false, total: 0, visits: [] }, { headers });
    return Response.json({ open: true, total: book.total, visits: book.visits }, { headers });
  } catch {
    return Response.json({ open: false, total: 0, visits: [], error: 'the visitor book did not answer' }, { status: 503, headers: { ...headers, 'cache-control': 'no-store' } });
  }
}
