/**
 * Journals search client — calls the backend /api/journals-search route.
 *
 * The backend:
 *   1. Fetches journals from DOAJ (main source).
 *   2. Collects all ISSNs and runs one batch request to OpenAlex.
 *   3. Maps 2yr_mean_citedness → Q1/Q2/Q3/Q4 tier (or "Unranked" when absent).
 *   4. Returns enriched Article objects to the frontend.
 *
 * This client never calls DOAJ or OpenAlex directly — all enrichment is
 * performed server-side.  The fetch URL is always relative so it resolves
 * against the page origin (works in both Replit dev and production).
 */

import type { Article } from "../data/mockArticles";

export interface JournalsSearchResult {
  articles: Article[];
  total: number;
}

/**
 * Search for open-access journals via the backend proxy.
 *
 * @param query    Free-text search term(s).
 * @param pageSize Results per page (default 25).
 * @param page     1-based page number (default 1).
 */
export async function searchJournals(
  query: string,
  pageSize = 25,
  page = 1
): Promise<JournalsSearchResult> {
  const params = new URLSearchParams({
    q:        query.trim(),
    page:     String(page),
    pageSize: String(pageSize),
  });

  let response: Response;
  try {
    response = await fetch(`/api/journals-search?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error(
      "Could not reach the journal search server. Please check your connection."
    );
  }

  if (!response.ok) {
    let message = `Server error (HTTP ${response.status}).`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const json = (await response.json()) as { articles: Article[]; total: number };
  return {
    articles: Array.isArray(json.articles) ? json.articles : [],
    total:    typeof json.total === "number" ? json.total : 0,
  };
}
