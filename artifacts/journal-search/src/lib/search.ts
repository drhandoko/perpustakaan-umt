/**
 * Client-side filtering, sorting, and search-type management.
 *
 * SearchType drives which API is called:
 *   journals → DOAJ journals endpoint
 *   books    → DOAB REST API
 *   articles → Crossref (filtered to journal-article type)
 *
 * Filtering and sorting are applied locally on the results already fetched.
 */

import type { Article } from "../data/mockArticles";

// ─── Search type ──────────────────────────────────────────────────────────────

/** Which kind of content the user is searching for. */
export type SearchType = "journals" | "books" | "articles";

export const SEARCH_TYPE_OPTIONS: { value: SearchType; label: string }[] = [
  { value: "journals", label: "Journals" },
  { value: "books",    label: "Books" },
  { value: "articles", label: "Articles" },
];

// ─── Filters ──────────────────────────────────────────────────────────────────

/**
 * All possible filter fields in one flat structure.
 * Not all fields apply to every SearchType — the sidebar renders only the
 * relevant ones per type.
 *
 *  journals : language[]
 *  books    : yearFrom, yearTo, language[]
 *  articles : yearFrom, yearTo, language[], license[]
 */
export interface SearchFilters {
  query: string;
  yearFrom: number | "";
  yearTo: number | "";
  language: string[];
  license: string[];
}

// ─── Sort order ───────────────────────────────────────────────────────────────

export type SortOrder = "relevance" | "newest" | "oldest";

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest",    label: "Newest first" },
  { value: "oldest",    label: "Oldest first" },
];

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Merge two Article arrays, deduplicating by DOI.
 * Items earlier in the list take precedence.
 */
export function mergeAndDeduplicate(
  primary: Article[],
  secondary: Article[]
): Article[] {
  const seen = new Set<string>();
  const merged: Article[] = [];

  for (const article of [...primary, ...secondary]) {
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
 * Apply sidebar filters to an Article array.
 * Year-0 records (year not available) always pass the year filter.
 * Empty arrays for language / license mean "show all".
 */
export function applyFilters(
  articles: Article[],
  filters: SearchFilters
): Article[] {
  const { yearFrom, yearTo, language, license } = filters;

  return articles.filter((article) => {
    if (article.year !== 0) {
      if (yearFrom !== "" && article.year < yearFrom) return false;
      if (yearTo   !== "" && article.year > yearTo)   return false;
    }

    if (language.length > 0 && !language.includes(article.language))
      return false;

    if (license.length > 0) {
      if (!article.license || !license.includes(article.license)) return false;
    }

    return true;
  });
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

/**
 * Sort an Article array by the requested order.
 * Returns a new array; input is never mutated.
 * Year-0 records are always placed last.
 */
export function applySortOrder(
  articles: Article[],
  sort: SortOrder
): Article[] {
  if (sort === "relevance") return articles;

  return [...articles].sort((a, b) => {
    if (a.year === 0 && b.year === 0) return 0;
    if (a.year === 0) return 1;
    if (b.year === 0) return -1;
    return sort === "newest" ? b.year - a.year : a.year - b.year;
  });
}
