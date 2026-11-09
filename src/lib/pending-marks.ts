import type { Entries } from "./tennis";
import type { SharedMark } from "./marks.functions";

/** Durable unsynced edits. Separate from display cache so a blank GET cannot erase them. */
export const OUTBOX_KEY = "bezeq_tennis_outbox_v1";

export type OutboxMark = { played: boolean; score: string; updatedAt: number };
export type Outbox = Record<string, OutboxMark>;

export function loadOutbox(): Outbox {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Outbox = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!/^\d+$/.test(key)) continue;
      const id = Number(key);
      if (!Number.isInteger(id) || id < 1 || id > 12) continue;
      if (!value || typeof value !== "object") continue;
      const row = value as Record<string, unknown>;
      if (typeof row.played !== "boolean" || typeof row.score !== "string") continue;
      out[key] = {
        played: row.played,
        score: row.score.slice(0, 8),
        updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : Date.now(),
      };
    }
    return out;
  } catch {
    return {};
  }
}

export function saveOutbox(outbox: Outbox) {
  if (Object.keys(outbox).length === 0) localStorage.removeItem(OUTBOX_KEY);
  else localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
}

export function upsertOutbox(outbox: Outbox, matchId: number, entry: { played?: boolean; score?: string }): Outbox {
  const next = {
    ...outbox,
    [String(matchId)]: {
      played: Boolean(entry.played),
      score: (entry.score ?? "").trim().slice(0, 8),
      updatedAt: Date.now(),
    },
  };
  saveOutbox(next);
  return next;
}

export function clearOutboxMark(outbox: Outbox, matchId: number): Outbox {
  if (!(String(matchId) in outbox)) return outbox;
  const next = { ...outbox };
  delete next[String(matchId)];
  saveOutbox(next);
  return next;
}

export function outboxIds(outbox: Outbox): number[] {
  return Object.keys(outbox).map(Number);
}

export function markFromOutbox(entry: OutboxMark): Pick<SharedMark, "played" | "score"> {
  return { played: entry.played, score: entry.score };
}

export function sameMark(
  local: { played?: boolean; score?: string } | undefined,
  remote: { played: boolean; score: string } | undefined,
): boolean {
  return (
    Boolean(local?.played) === Boolean(remote?.played) &&
    (local?.score ?? "").trim().slice(0, 8) === (remote?.score ?? "").trim().slice(0, 8)
  );
}

/** Overlay durable outbox on a server-derived board for display + merge pending. */
export function entriesWithOutbox(base: Entries, outbox: Outbox): Entries {
  const entries = { ...base };
  for (const [key, entry] of Object.entries(outbox)) {
    entries[key] = { played: entry.played, score: entry.score };
  }
  return entries;
}

/** Drop outbox rows the server already matches (after a successful snapshot). */
export function reconcileOutbox(outbox: Outbox, marks: SharedMark[]): Outbox {
  const byId = new Map(marks.map((mark) => [mark.matchId, mark]));
  let next = outbox;
  for (const [key, entry] of Object.entries(outbox)) {
    const remote = byId.get(Number(key));
    if (remote && sameMark(entry, remote)) next = clearOutboxMark(next, Number(key));
  }
  return next;
}
