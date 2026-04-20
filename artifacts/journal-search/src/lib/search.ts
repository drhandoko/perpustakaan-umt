/**
 * Client-side filtering applied on top of API results.
 *
 * DOAJ already filters by keyword server-side. After the results arrive,
 * this function applies the sidebar filter values (year, language, license)
 * locally on the returned Article array.
 *
 * ─── Swapping APIs ──────────────────────────────────────────────────────────
 * The actual API call lives in src/lib/doajApi.ts.
 * To add another provider (OpenAlex, CORE, EuropePMC), create a parallel
 * file (e.g. src/lib/openalexApi.ts) that returns Article[] and call it
 * from SearchPage.tsx alongside or instead of searchDoaj().
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Article } from "../data/mockArticles";

export interface SearchFilters {
  query: string;
  source: string;      // kept for future multi-source support; ignored for DOAJ (all results are "DOAJ")
  yearFrom: number | "";
  yearTo: number | "";
  language: string;
  license: string;
}

/**
 * Apply sidebar filters to an array of Articles already returned by the API.
 * Year-0 articles (year not available from DOAJ) are treated as passing the year filter.
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
