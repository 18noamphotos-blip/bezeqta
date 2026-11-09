// Shared /marks handler for Cloudflare Pages Functions (same D1 as the Worker).
export const ORIGIN = 'https://18noamphotos-blip.github.io';

export function allowedOrigin(origin, pagesHost) {
  if (!origin) return ORIGIN;
  const allowed = new Set([
    ORIGIN,
    'https://bezeqta-scores.bezeqta-noamisback.workers.dev',
  ]);
  if (pagesHost) allowed.add(`https://${pagesHost}`);
  if (allowed.has(origin)) return origin;
  if (/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return origin;
  return null;
}

export function validMark(data) {
  return (
    data &&
    Number.isInteger(data.matchId) &&
    data.matchId >= 1 &&
    data.matchId <= 12 &&
    typeof data.played === 'boolean' &&
    typeof data.score === 'string' &&
    data.score.length <= 8 &&
    /^[\d\s:–\-]*$/.test(data.score)
  );
}

const select = 'SELECT match_id, played, score FROM match_marks ORDER BY match_id';
const revision = 'SELECT version FROM board_revision WHERE id = 1';

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin || ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

const json = (body, status, origin) => Response.json(body, { status, headers: cors(origin) });

function snapshot(results) {
  const [rows, version] = results.slice(-2);
  return {
    version: Number(version.results[0].version),
    marks: rows.results.map((row) => ({
      matchId: row.match_id,
      played: Boolean(row.played),
      score: row.score,
    })),
  };
}

export async function handleMarks(request, env, pagesHost) {
  const requestOrigin = request.headers.get('Origin');
  const origin = allowedOrigin(requestOrigin, pagesHost);
  if (requestOrigin && !origin) return json({ error: 'Origin not allowed' }, 403, ORIGIN);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405, origin);
  console.log(JSON.stringify({ event: 'marks_hit', method: request.method, host: 'pages' }));
  let data;
  if (request.method === 'POST') {
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
      return json({ error: 'JSON required' }, 415, origin);
    }
    const reader = request.body?.getReader();
    let text = '', bytes = 0;
    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 1024) {
          await reader.cancel();
          return json({ error: 'Too large' }, 413, origin);
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    }
    try {
      data = JSON.parse(text);
    } catch {
      return json({ error: 'Invalid JSON' }, 400, origin);
    }
    if (!validMark(data)) {
      console.log(JSON.stringify({ event: 'invalid_mark' }));
      return json({ error: 'Invalid match edit' }, 400, origin);
    }
  }
  try {
    const statements = [];
    if (data) {
      statements.push(
        env.DB.prepare(
          'UPDATE match_marks SET played = ?, score = ?, updated_at = CURRENT_TIMESTAMP WHERE match_id = ?',
        ).bind(data.played ? 1 : 0, data.score.trim(), data.matchId),
      );
      statements.push(env.DB.prepare('UPDATE board_revision SET version = version + 1 WHERE id = 1'));
      console.log(JSON.stringify({ event: 'mark_saved', matchId: data.matchId, host: 'pages' }));
    }
    statements.push(env.DB.prepare(select), env.DB.prepare(revision));
    return json(snapshot(await env.DB.batch(statements)), 200, origin);
  } catch {
    console.error(JSON.stringify({ event: 'scores_database_unavailable' }));
    return json({ error: 'Sync unavailable' }, 503, origin);
  }
}
