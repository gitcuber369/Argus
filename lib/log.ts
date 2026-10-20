export function log(entry: {
  runId: string;
  userId: string;
  stage: string;
  model?: string;
  durationMs: number;
  outcome: "ok" | "error";
}): void {
  console.error(JSON.stringify({ ts: Date.now(), ...entry }));
}
