// Public API address, never a credential. The Worker binds D1 server-side.
export const API_URL = "https://bezeqta-scores.bezeqta-noamisback.workers.dev/marks";
export type SharedMark = { matchId: number; played: boolean; score: string };
export type Snapshot = SharedMark[] & { version: number };
export function decodeSnapshot(body: { version: number; marks: SharedMark[] }): Snapshot {
  if (!Number.isSafeInteger(body.version) || !Array.isArray(body.marks)) throw new Error("Invalid server response");
  return Object.assign(body.marks, { version: body.version });
}
export async function listMarks(): Promise<Snapshot> {
  const response = await fetch(API_URL, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Sync unavailable");
  return decodeSnapshot(await response.json());
}
// Serialize writes in this tab so an earlier edit cannot arrive after a newer one.
let writes: Promise<unknown> = Promise.resolve();
export function saveMark({ data }: { data: SharedMark }): Promise<Snapshot> {
  const operation = writes.catch(() => undefined).then(async () => {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Save unavailable");
    return decodeSnapshot(await response.json());
  });
  writes = operation;
  return operation;
}
