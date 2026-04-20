/**
 * DOAB book search — calls the local backend proxy, NOT the DOAB server directly.
 *
 * WHY A PROXY?
 *   DOAB's DSpace REST API does not include Access-Control-Allow-Origin headers,
 *   so browsers block direct fetch calls.  All DOAB traffic is routed through
 *   the Express API server (/api/doab-search), which performs the server-side
 *   fetch without any CORS restrictions.
 *
 * BACKEND ROUTE
 *   GET /api/doab-search?q=QUERY&limit=N&offset=N
 *   Returns: { articles: Article[], total: number }
 *
 * PORTABILITY
 *   The URL is intentionally relative ("/api/doab-search") so it resolves
 *   against whatever origin serves the frontend:
 *     - Replit dev   → Vite proxy forwards /api/* to the Express server
 *     - Replit prod  → Replit path router forwards /api/* to the Express server
 *     - Self-hosted  → Any reverse proxy (nginx, Caddy) routes /api/* to Express
 */

import type { Article } from "../data/mockArticles";

// ─── Public result type ───────────────────────────────────────────────────────

export interface DoabSearchResult {
  articles: Article[];
  total: number;
}

// ─── Internal proxy response shape ───────────────────────────────────────────

interface ProxyResponse {
  articles: Article[];
  total: number;
  error?: string;
}

// ─── Public search function ───────────────────────────────────────────────────

/**
 * Search DOAB for open-access books via the backend proxy.
 *
 * @param query     Free-text keyword(s).
 * @param pageSize  Number of results to request (default 25, max 100).
 * @param page      1-based page number.
 * @throws          Error with a human-readable message on network or server failure.
 */
export async function searchDoab(
  query: string,
  pageSize = 25,
  page = 1,
): Promise<DoabSearchResult> {
  const offset = (page - 1) * pageSize;

  const params = new URLSearchParams({
    q:      query.trim(),
    limit:  String(pageSize),
    offset: String(offset),
  });

  // Relative URL — works with Vite proxy in dev, Replit router in staging,
  // and any reverse-proxy in production.
  const url = `/api/doab-search?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error(
      "Could not reach the search service. Please check your connection.",
    );
  }

  const json: ProxyResponse = await response.json();

  if (!response.ok) {
    // Backend returns { error: "..." } for 4xx / 5xx
    throw new Error(json.error ?? `Server returned HTTP ${response.status}.`);
  }

  return { articles: json.articles ?? [], total: json.total ?? 0 };
}
