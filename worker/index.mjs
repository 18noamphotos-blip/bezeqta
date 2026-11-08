// Intentionally public editing, matching the exported application. CORS is NOT auth.
const ORIGIN = 'https://18noamphotos-blip.github.io';
const headers = { 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
const select = 'SELECT match_id, played, score FROM match_marks ORDER BY match_id';
const revision = 'SELECT version FROM board_revision WHERE id = 1';
const json = (body, status = 200) => Response.json(body, { status, headers });
function validMark(data) {
  return data && Number.isInteger(data.matchId) && data.matchId >= 1 && data.matchId <= 12 && typeof data.played === 'boolean' && typeof data.score === 'string' && data.score.length <= 8 && /^[\d\s:–\-]*$/.test(data.score);
}
function snapshot(results) {
  const [rows, version] = results.slice(-2);
  return { version: Number(version.results[0].version), marks: rows.results.map(row => ({ matchId: row.match_id, played: Boolean(row.played), score: row.score })) };
}
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/marks') return json({ error: 'Not found' }, 404);
    const origin = request.headers.get('Origin');
    if (origin && origin !== ORIGIN) return json({ error: 'Origin not allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
    let data;
    if (request.method === 'POST') {
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'JSON required' }, 415);
      // Bound memory use even for chunked bodies; 1KiB is far above a match edit.
      const reader = request.body?.getReader();
      let text = '', bytes = 0;
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > 1024) { await reader.cancel(); return json({ error: 'Too large' }, 413); }
          text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
      }
      try { data = JSON.parse(text); } catch { return json({ error: 'Invalid JSON' }, 400); }
      if (!validMark(data)) return json({ error: 'Invalid match edit' }, 400);
    }
    try {
      const statements = [];
      if (data) {
        statements.push(env.DB.prepare('UPDATE match_marks SET played = ?, score = ?, updated_at = CURRENT_TIMESTAMP WHERE match_id = ?').bind(data.played ? 1 : 0, data.score.trim(), data.matchId));
        statements.push(env.DB.prepare('UPDATE board_revision SET version = version + 1 WHERE id = 1'));
      }
      statements.push(env.DB.prepare(select), env.DB.prepare(revision));
      return json(snapshot(await env.DB.batch(statements)));
    } catch {
      console.error(JSON.stringify({ event: 'scores_database_unavailable' }));
      return json({ error: 'Sync unavailable' }, 503);
    }
  },
};
