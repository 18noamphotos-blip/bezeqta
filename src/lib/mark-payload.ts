import type { SharedMark } from "./marks.functions";

/** Exact body the Pages client POSTs; keep in lockstep with worker/validate.mjs. */
export function buildMarkPayload(
  matchId: number,
  entry: { played?: boolean; score?: string },
): SharedMark {
  const payload: SharedMark = {
    matchId,
    played: Boolean(entry.played),
    score: (entry.score ?? "").trim().slice(0, 8),
  };
  if (!/^[\d\s:–\-]*$/.test(payload.score)) payload.score = "";
  return payload;
}
