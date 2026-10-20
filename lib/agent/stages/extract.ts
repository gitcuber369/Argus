import type { Evidence } from "../../types.ts";
import type { SearchResult } from "./search.ts";

export async function extract(
  results: SearchResult[],
  subQuestionId: string,
  userId: string,
  _signal?: AbortSignal,
): Promise<Evidence[]> {
  return results.map((r, i) => ({
    id: `ev_${subQuestionId}_${i}`,
    userId,
    claim: `Stub claim derived from ${r.title}`,
    sourceUrl: r.url,
    sourceTitle: r.title,
    quote: r.snippet,
    confidence: "low",
    subQuestionId,
  }));
}
