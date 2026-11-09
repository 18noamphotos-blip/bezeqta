// Public API address, never a credential. The Worker binds D1 server-side.
export const API_URL = "https://bezeqta-scores.bezeqta-noamisback.workers.dev/marks";
export type SharedMark = { matchId: number; played: boolean; score: string };
export type Snapshot = SharedMark[] & { version: number };

function abortAfter(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export function decodeSnapshot(body: { version: number; marks: SharedMark[] }): Snapshot {
  const version = Number(body?.version);
  if (!Number.isSafeInteger(version) || !Array.isArray(body?.marks)) throw new Error("Invalid server response");
  return Object.assign(body.marks, { version });
}
export async function listMarks(): Promise<Snapshot> {
  const response = await fetch(API_URL, { cache: "no-store", signal: abortAfter(15000) });
  if (!response.ok) throw new Error("Sync unavailable");
  return decodeSnapshot(await response.json());
}
// Serialize writes in this tab so an earlier edit cannot arrive after a newer one.
let writes: Promise<unknown> = Promise.resolve();
export function saveMark({ data }: { data: SharedMark }): Promise<Snapshot> {
  const operation = writes.catch(() => undefined).then(async () => {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), signal: abortAfter(15000),
    });
    if (!response.ok) throw new Error("Save unavailable");
    return decodeSnapshot(await response.json());
  });
  writes = operation;
  return operation;
}
