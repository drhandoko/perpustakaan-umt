/**
 * Client-side filtering, sorting, and source management applied on top of API results.
 *
 * Both DOAJ and Crossref results are fetched server-side by keyword.
 * This module handles:
 *   1. Sidebar filters (year, language, license) — applied locally after fetch
 *   2. Sort order — applied after filtering, purely client-side
 *   3. Source selection — determines which APIs are called in SearchPage
 */

import type { Article } from "../data/mockArticles";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchFilters {
  query: string;
  yearFrom: number | "";
  yearTo: number | "";
  language: string[];
  license: string[];
}

/** Which APIs to query. At least one must be true. */
export interface SourceSelection {
  doaj: boolean;
  crossref: boolean;
}

/**
 * Client-side sort order applied to the filtered result list.
 *   relevance — preserve the merged API order (DOAJ first, then Crossref)
 *   newest    — descending by year; year-unavailable articles sorted to the end
 *   oldest    — ascending by year; year-unavailable articles sorted to the end
 */
export type SortOrder = "relevance" | "newest" | "oldest";

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest",    label: "Newest first" },
  { value: "oldest",    label: "Oldest first" },
];

// ─── Source helpers ───────────────────────────────────────────────────────────

export function sourcesAreEqual(a: SourceSelection, b: SourceSelection): boolean {
  return a.doaj === b.doaj && a.crossref === b.crossref;
}

/**
 * Merge two Article arrays, deduplicating by DOI.
 * Items earlier in the list take precedence (DOAJ results first, then Crossref).
 */
export function mergeAndDeduplicate(
  doajArticles: Article[],
  crossrefArticles: Article[]
): Article[] {
  const seen = new Set<string>();
  const merged: Article[] = [];

  for (const article of [...doajArticles, ...crossrefArticles]) {
    const key = article.doi
      ? `doi:${article.doi.toLowerCase()}`
      : `id:${article.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(article);
    }
  }

  return merged;
}

// ─── Filtering ────────────────────────────────────────────────────────────────

/**
 * Apply sidebar filters to an Article array already returned by the API(s).
 * Year-0 articles (year not available) pass the year filter automatically.
 */
export function applyFilters(
  articles: Article[],
  filters: SearchFilters
): Article[] {
  const { yearFrom, yearTo, language, license } = filters;

  return articles.filter((article) => {
    // Year range — articles with year=0 (unavailable) always pass
    if (article.year !== 0) {
      if (yearFrom !== "" && article.year < yearFrom) return false;
      if (yearTo   !== "" && article.year > yearTo)   return false;
    }

    // Language filter — empty array means "all languages"
    if (language.length > 0 && !language.includes(article.language))
      return false;

    // License filter — empty array means "all licenses"
    if (license.length > 0) {
      if (!article.license || !license.includes(article.license)) return false;
    }

    return true;
  });
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

/**
 * Sort an Article array by the requested order.
 * Returns a new array; the input is never mutated.
 * Articles with year=0 (unavailable) are always placed at the end.
 */
export function applySortOrder(
  articles: Article[],
  sort: SortOrder
): Article[] {
  if (sort === "relevance") return articles;

  return [...articles].sort((a, b) => {
    // Push year-unavailable articles to the bottom regardless of sort direction
    if (a.year === 0 && b.year === 0) return 0;
    if (a.year === 0) return 1;
    if (b.year === 0) return -1;

    return sort === "newest" ? b.year - a.year : a.year - b.year;
  });
}
