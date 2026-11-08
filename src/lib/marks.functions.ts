import { createServerFn } from "@tanstack/react-start";
import { MATCHES } from "@/data/matches";

export type SharedMark = { matchId: number; played: boolean; score: string };

const MATCH_IDS = new Set(MATCHES.map((match) => match.id));

function parseMark(input: unknown): SharedMark {
  if (!input || typeof input !== "object") throw new Error("סימון לא תקין");
  const raw = input as Record<string, unknown>;
  const matchId = raw.matchId;
  if (typeof matchId !== "number" || !Number.isInteger(matchId) || !MATCH_IDS.has(matchId)) {
    throw new Error("משחק לא מוכר");
  }
  if (typeof raw.played !== "boolean") throw new Error("סימון לא תקין");
  if (typeof raw.score !== "string" || raw.score.length > 8 || !/^[\d\s:–\-]*$/.test(raw.score)) {
    throw new Error("תוצאה לא תקינה");
  }
  return { matchId, played: raw.played, score: raw.score.trim() };
}

async function readMarks(): Promise<SharedMark[]> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ match_id: number; played: boolean; score: string }>`
    select match_id, played, score from match_marks order by match_id
  `;
  return rows.map((row) => ({
    matchId: Number(row.match_id),
    played: Boolean(row.played),
    score: row.score ?? "",
  }));
}

export const listMarks = createServerFn({ method: "POST" }).handler(readMarks);

export const saveMark = createServerFn({ method: "POST" })
  .validator(parseMark)
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into match_marks (match_id, played, score, updated_at)
      values (${data.matchId}, ${data.played}, ${data.score}, now())
      on conflict (match_id) do update
      set played = excluded.played,
          score = excluded.score,
          updated_at = now()
    `;
    return readMarks();
  });
