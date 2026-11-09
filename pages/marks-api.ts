// Public API addresses, never credentials. D1 is bound server-side on Pages/Worker.
export const PAGES_MARKS_URL = "https://bezeqta-scores-api.pages.dev/marks";
export const WORKER_MARKS_URL = "https://bezeqta-scores.bezeqta-noamisback.workers.dev/marks";
/** Ordered fallback: Pages (pages.dev) first, then workers.dev. */
export const MARKS_URLS = [PAGES_MARKS_URL, WORKER_MARKS_URL] as const;

export function resolveMarksUrls(): string[] {
  if (typeof location !== "undefined") {
    const host = location.hostname;
    if (/\.pages\.dev$/i.test(host) || /\.workers\.dev$/i.test(host)) {
      return ["/marks"];
    }
  }
  return [...MARKS_URLS];
}

export const API_URL = PAGES_MARKS_URL;
export type SharedMark = { matchId: number; played: boolean; score: string };
export type Snapshot = SharedMark[] & { version: number };

function abortAfter(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export function decodeSnapshot(body: { version: number; marks: SharedMark[] }): Snapshot {
  const version = Number(body?.version);
  if (!Number.isSafeInteger(version) || !Array.isArray(body?.marks)) throw new Error("Invalid server response");
  return Object.assign(body.marks, { version });
}

async function fetchMarks(init?: RequestInit): Promise<Response> {
  const urls = resolveMarksUrls();
  let lastError: unknown;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: abortAfter(15000),
        ...init,
        headers: { ...(init?.headers || {}) },
      });
      // Try next host on gateway/network-ish failures; keep 4xx as authoritative.
      if (response.status >= 500 || response.status === 408 || response.status === 429) {
        lastError = new Error(`Sync unavailable (${response.status})`);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Sync unavailable");
}

export async function listMarks(): Promise<Snapshot> {
  const response = await fetchMarks();
  if (!response.ok) throw new Error("Sync unavailable");
  return decodeSnapshot(await response.json());
}

let writes: Promise<unknown> = Promise.resolve();
export function saveMark({ data }: { data: SharedMark }): Promise<Snapshot> {
  const operation = writes.catch(() => undefined).then(async () => {
    const response = await fetchMarks({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Save unavailable");
    return decodeSnapshot(await response.json());
  });
  writes = operation;
  return operation;
}
