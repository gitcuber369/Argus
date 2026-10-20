export type SearchResult = {
  url: string;
  title: string;
  snippet: string;
};

type SearxngResult = {
  url: string;
  title: string;
  content?: string;
};

const SEARXNG_URL = process.env.SEARXNG_URL ?? "http://localhost:8787";
const MAX_RESULTS = 5;
const MAX_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function search(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const url = `${SEARXNG_URL}/search?${new URLSearchParams({
    q: query,
    format: "json",
  })}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    signal?.throwIfAborted();
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) {
        throw new Error(`SearXNG returned ${res.status}`);
      }
      const data = (await res.json()) as { results: SearxngResult[] };
      return data.results.slice(0, MAX_RESULTS).map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.content ?? "",
      }));
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      await sleep(500 * 2 ** (attempt - 1));
    }
  }
  return [];
}
