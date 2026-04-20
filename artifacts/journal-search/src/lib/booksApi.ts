/**
 * Books search client — calls the backend aggregator route.
 *
 * The backend route (/api/books-search) orchestrates parallel fetches from
 * DOAB, OAPEN, and any future sources, normalises all records to a common
 * shape, deduplicates them, and returns a single sorted list.
 *
 * This client never calls any external book API directly — all network traffic
 * to DOAB / OAPEN is routed through the Express server to avoid CORS issues.
 *
 * PORTABILITY
 *   The fetch URL is always relative ("/api/books-search") so it resolves
 *   against the page's origin:
 *     Replit dev   → Vite proxy forwards /api/* → Express on :8080
 *     Replit prod  → Replit path router forwards /api/* → Express
 *     Self-hosted  → nginx / Caddy rule: location /api { proxy_pass express; }
 */

import type { Article } from "../data/mockArticles";

// ─── Response shape from the backend aggregator ───────────────────────────────

export interface BooksSearchResult {
  articles: Article[];
  total: number;
  /** Per-source outcome for UI display (error messages, counts). */
  sourceStatus: Record<string, { count: number; error: string | null }>;
}

// ─── Public search function ───────────────────────────────────────────────────

/**
 * Search for open-access books via the backend aggregator.
 *
 * @param query       Free-text keyword(s).
 * @param sources     Active source IDs to query, e.g. ["doab", "oapen"].
 *                    Only pass active (implemented) sources — unrecognised
 *                    tokens are silently ignored by the backend.
 * @param pageSize    Results per page per source (the backend fetches this
 *                    many from each source before deduplication).
 * @param page        1-based page number.
 *
 * @throws Error with a human-readable message on network or server failure.
 */
export async function searchBooks(
  query: string,
  sources: string[],
  pageSize = 25,
  page = 1,
): Promise<BooksSearchResult> {
  // If no sources selected, return empty without a network call
  if (sources.length === 0) {
    return { articles: [], total: 0, sourceStatus: {} };
  }

  const offset = (page - 1) * pageSize;

  const params = new URLSearchParams({
    q:       query.trim(),
    sources: sources.join(","),
    limit:   String(pageSize),
    offset:  String(offset),
  });

  const url = `/api/books-search?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error(
      "Could not reach the search service. Please check your connection.",
    );
  }

  const json: BooksSearchResult & { error?: string } = await response.json();

  if (!response.ok) {
    throw new Error(json.error ?? `Server returned HTTP ${response.status}.`);
  }

  return {
    articles:     json.articles ?? [],
    total:        json.total ?? 0,
    sourceStatus: json.sourceStatus ?? {},
  };
}
