/**
 * Client-side filtering applied on top of API results.
 *
 * Both DOAJ and Crossref results are fetched server-side by keyword.
 * This module handles:
 *   1. Sidebar filters (year, language, license) — applied locally after fetch
 *   2. Source selection — determines which APIs are called in SearchPage
 */

import type { Article } from "../data/mockArticles";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchFilters {
  query: string;
  yearFrom: number | "";
  yearTo: number | "";
  language: string;
  license: string;
}

/** Which APIs to query. At least one must be true. */
export interface SourceSelection {
  doaj: boolean;
  crossref: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function sourcesAreEqual(a: SourceSelection, b: SourceSelection): boolean {
  return a.doaj === b.doaj && a.crossref === b.crossref;
}

/**
 * Merge two Article arrays, deduplicating by DOI.
 * Items earlier in the list take precedence (DOAJ results first, then Crossref).
 */
export function mergeAndDeduplicate(doajArticles: Article[], crossrefArticles: Article[]): Article[] {
  const seen = new Set<string>();
  const merged: Article[] = [];

  for (const article of [...doajArticles, ...crossrefArticles]) {
    const key = article.doi ? `doi:${article.doi.toLowerCase()}` : `id:${article.id}`;
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
export function applyFilters(articles: Article[], filters: SearchFilters): Article[] {
  const { yearFrom, yearTo, language, license } = filters;

  return articles.filter((article) => {
    // Year range — skip articles with year=0 (unavailable)
    if (article.year !== 0) {
      if (yearFrom !== "" && article.year < yearFrom) return false;
      if (yearTo !== "" && article.year > yearTo) return false;
    }

    // Language filter
    if (language && language !== "All" && article.language !== language) return false;

    // License filter
    if (license && license !== "All") {
      if (!article.license || article.license !== license) return false;
    }

    return true;
  });
}
