// Public API address, never a credential. The Worker binds D1 server-side.
export const WORKER_MARKS_URL = "https://bezeqta-scores.bezeqta-noamisback.workers.dev/marks";

export function resolveMarksUrl(): string {
  if (typeof location !== "undefined" && /\.workers\.dev$/i.test(location.hostname)) {
    return "/marks";
  }
  return WORKER_MARKS_URL;
}

export const API_URL = WORKER_MARKS_URL;
export type SharedMark = { matchId: number; played: boolean; score: string };
export type Snapshot = SharedMark[] & { version: number };

function abortAfter(ms: number): AbortSignal {
  // Prefer AbortController everywhere — some WebViews mishandle AbortSignal.timeout.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  // Attach timer clear if abort happens early is unnecessary for short page life.
  void timer;
  return controller.signal;
}

export function decodeSnapshot(body: { version: number; marks: SharedMark[] }): Snapshot {
  const version = Number(body?.version);
  if (!Number.isSafeInteger(version) || !Array.isArray(body?.marks)) throw new Error("Invalid server response");
  return Object.assign(body.marks, { version });
}
export async function listMarks(): Promise<Snapshot> {
  const response = await fetch(resolveMarksUrl(), { cache: "no-store", signal: abortAfter(15000) });
  if (!response.ok) throw new Error("Sync unavailable");
  return decodeSnapshot(await response.json());
}
let writes: Promise<unknown> = Promise.resolve();
export function saveMark({ data }: { data: SharedMark }): Promise<Snapshot> {
  const operation = writes.catch(() => undefined).then(async () => {
    const response = await fetch(resolveMarksUrl(), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), signal: abortAfter(15000),
    });
    if (!response.ok) throw new Error("Save unavailable");
    return decodeSnapshot(await response.json());
  });
  writes = operation;
  return operation;
}
