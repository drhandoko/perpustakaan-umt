/**
 * Shared data types and static filter constants for the discovery portal.
 *
 * `mockArticles` is intentionally empty — the live app populates results from
 * DOAJ (journals), DOAB (books), and Crossref (articles) APIs at runtime.
 */

/**
 * Content type determines which API produced this record and how it is rendered.
 *   article — a scholarly article (Crossref)
 *   journal — a journal venue   (DOAJ journals endpoint)
 *   book    — a monograph       (DOAB)
 */
export type ContentType = "article" | "journal" | "book";

export interface Article {
  id: string;
  contentType: ContentType;
  title: string;
  /** Authors (articles/books) — empty array for journals */
  authors: string[];
  /** Container / venue: journal name for articles, publisher name for books/journals */
  journal: string;
  year: number;
  doi: string | null;
  sourceUrl: string;
  pdfUrl: string | null;
  /** API source label shown in badge: "DOAJ", "DOAB", "Crossref" */
  source: string;
  license: string | null;
  language: string;
  abstract?: string;
  /** Publisher display name (journals + books) */
  publisher?: string;
  /** Subject/discipline terms (journals) */
  subjects?: string[];
  /** Country of the publisher (journals) */
  country?: string;
}

/** Kept for backwards-compatibility with any import that references this. */
export const mockArticles: Article[] = [];

// ─── Static filter option lists ───────────────────────────────────────────────

/** Languages shown in the Language filter panel. */
export const LANGUAGES = [
  "English",
  "Indonesian",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Chinese",
  "Arabic",
  "Italian",
  "Japanese",
  "Russian",
];

/** CC license labels used for the article License filter. */
export const LICENSES = [
  "CC BY 4.0",
  "CC BY-NC 4.0",
  "CC BY-NC-ND 4.0",
  "CC BY-SA 4.0",
  "CC BY-ND 4.0",
];

export const YEAR_MIN = 2000;
export const YEAR_MAX = 2026;
