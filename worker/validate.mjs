// Shared with api tests. Keep out of the Worker entry so Wrangler sees one default export.
export const ORIGIN = 'https://18noamphotos-blip.github.io';
export const ALLOWED_ORIGINS = new Set([
  ORIGIN,
  'https://bezeqta-scores.bezeqta-noamisback.workers.dev',
]);

export function allowedOrigin(origin) {
  if (!origin) return ORIGIN;
  if (ALLOWED_ORIGINS.has(origin)) return origin;
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
