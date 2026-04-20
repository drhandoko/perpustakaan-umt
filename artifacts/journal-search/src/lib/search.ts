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
import { JOURNAL_SUBJECT_GROUPS } from "../data/mockArticles";

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
 *  journals : language[], journalSubjects[]
 *  books    : yearFrom, yearTo, language[], bookSources[]
 *  articles : yearFrom, yearTo, language[], license[]
 */
export interface SearchFilters {
  query: string;
  yearFrom: number | "";
  yearTo: number | "";
  language: string[];
  license: string[];
  /**
   * Active book sources (Books mode only).
   * Values match BookSourceOption.id: "doab", "oapen", …
   * Only active (implemented) sources should be sent to the backend.
   */
  bookSources: string[];
  /**
   * Selected journal subject group labels (Journals mode only).
   * Values are JournalSubjectGroup.label strings, e.g. "Health & Medicine".
   * Empty array = show all subjects.
   */
  journalSubjects: string[];
  /**
   * SJR quartile ranking filter (Journals mode only).
   * Empty array = no filter (show all).
   * Values: "Q1" | "Q2" | "Q3" | "Q4" | "unranked"
   * Multiple values = OR logic (journal must match any selected tier).
   */
  journalRanking: string[];
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
 * Empty arrays for language / license / journalSubjects mean "show all".
 */
export function applyFilters(
  articles: Article[],
  filters: SearchFilters
): Article[] {
  const { yearFrom, yearTo, language, license } = filters;
  // Guards against stale HMR state that predates these fields being added.
  const journalSubjects: string[] = filters.journalSubjects ?? [];
  const journalRanking: string[]  = Array.isArray(filters.journalRanking)
    ? filters.journalRanking
    : [];

  // Pre-compute the selected subject groups' match terms for O(1) lookups.
  const selectedMatchTerms: string[] =
    journalSubjects.length > 0
      ? JOURNAL_SUBJECT_GROUPS
          .filter((g) => journalSubjects.includes(g.label))
          .flatMap((g) => g.matchTerms)
          .map((t) => t.toLowerCase())
      : [];

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

    // Journal subject filter — only applied when the article is a journal and
    // at least one subject group is selected.
    if (
      article.contentType === "journal" &&
      selectedMatchTerms.length > 0
    ) {
      const articleSubjects = (article.subjects ?? []).map((s) =>
        s.toLowerCase()
      );
      const matches = selectedMatchTerms.some((term) =>
        articleSubjects.some((subj) => subj.includes(term))
      );
      if (!matches) return false;
    }

    // Journal ranking filter — only applied when the article is a journal and
    // at least one ranking tier is selected. Multiple tiers are OR-combined.
    if (article.contentType === "journal" && journalRanking.length > 0) {
      const wantsUnranked = journalRanking.includes("unranked");
      const wantedTiers   = journalRanking.filter((r) => r !== "unranked");

      const matchesTier     = wantedTiers.length > 0 && article.journalQuartile
        ? wantedTiers.includes(article.journalQuartile)
        : false;
      const matchesUnranked = wantsUnranked && !article.journalQuartile;

      if (!matchesTier && !matchesUnranked) return false;
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
