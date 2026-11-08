export const ALLOWED_SCORES = ["2-1", "3-0", "0-3", "1-2"] as const;
export type Outcome = "" | "win" | "loss";
export function allowedScore(score: string): boolean {
  return score === "" || ALLOWED_SCORES.some(value => value === score);
}
export function outcomeFromScore(score: string): Outcome {
  if (score === "2-1" || score === "3-0") return "win";
  if (score === "0-3" || score === "1-2") return "loss";
  return "";
}
export function scoreForOutcome(outcome: Outcome, current: string): string {
  if (outcome === "") return "";
  if (outcomeFromScore(current) === outcome) return current;
  return outcome === "win" ? "2-1" : "0-3";
}
export function scoreSelection(score: string): { score: string; played: boolean } | undefined {
  return allowedScore(score) ? { score, played: score !== "" } : undefined;
}
