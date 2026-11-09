// Shared with api tests. Keep out of the Worker entry so Wrangler sees one default export.
export const ORIGIN = 'https://18noamphotos-blip.github.io';
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
