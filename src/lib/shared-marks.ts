import type { Entries } from './tennis';
import type { SharedMark } from './marks.functions';

// Reject late snapshots and preserve edits not yet acknowledged by the server.
export function mergeSharedSnapshot(
  rows: SharedMark[] & { version?: number }, currentVersion: number,
  local: Entries, pending: Iterable<number>,
): { entries: Entries; version: number } | undefined {
  const version = rows.version ?? currentVersion;
  if (version < currentVersion) return undefined;
  const entries: Entries = {};
  for (const row of rows) {
    if (row.played || row.score) entries[row.matchId] = { played: row.played, score: row.score };
  }
  for (const id of pending) {
    if (local[id]) entries[id] = local[id];
    else delete entries[id];
  }
  return { entries, version };
}
