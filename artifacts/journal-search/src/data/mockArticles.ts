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

/**
 * SJR (Scimago Journal Rankings) quartile tier.
 * Undefined means the journal is not indexed in SJR or data is unavailable.
 */
export type JournalQuartile = "Q1" | "Q2" | "Q3" | "Q4";

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
  /** ISBN digits-only (no hyphens). Present for books only. */
  isbn?: string | null;
  sourceUrl: string;
  pdfUrl: string | null;
  /** API source label: "DOAJ", "DOAB", "OAPEN", "Crossref", … */
  source: string;
  license: string | null;
  language: string;
  abstract?: string;
  /** Publisher display name (journals + books) */
  publisher?: string;
  /** Subject/discipline terms */
  subjects?: string[];
  /** Country of the publisher (journals) */
  country?: string;
  /**
   * SJR quartile ranking for journal records.
   * Only present when quartile data is available.
   * Undefined = unranked / not indexed in SJR.
   */
  journalQuartile?: JournalQuartile;
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

/** Book source options shown in the Books Source filter. */
export interface BookSourceOption {
  /** Internal id sent to the backend as the "sources" param. */
  id: string;
  label: string;
  /** true = implemented and queryable; false = coming soon (read-only). */
  active: boolean;
  url: string;
}

export const BOOK_SOURCES: BookSourceOption[] = [
  { id: "doab",  label: "DOAB",                active: true,  url: "https://directory.doabooks.org" },
  { id: "oapen", label: "OAPEN",               active: true,  url: "https://library.oapen.org" },
  { id: "orl",   label: "Open Research Library", active: false, url: "https://openresearchlibrary.org" },
  { id: "muse",  label: "Project MUSE OA",     active: false, url: "https://muse.jhu.edu/open-access-books" },
];

export const YEAR_MIN = 2000;
export const YEAR_MAX = 2026;

// ─── Journal ranking options ──────────────────────────────────────────────────

/**
 * Ranking filter options shown in the sidebar for Journals mode.
 * "any" is the default and shows all results regardless of quartile.
 * "unranked" matches journals where `journalQuartile` is undefined.
 */
export const JOURNAL_RANKING_OPTIONS: { value: string; label: string }[] = [
  { value: "Q1",       label: "Q1 — Top 25%" },
  { value: "Q2",       label: "Q2 — Upper mid" },
  { value: "Q3",       label: "Q3 — Lower mid" },
  { value: "Q4",       label: "Q4 — Bottom 25%" },
  { value: "unranked", label: "Unranked" },
];

// ─── Journal subject groups ───────────────────────────────────────────────────
//
// Each group maps a user-facing label to a list of lowercase LCC (Library of
// Congress Classification) keyword fragments.  A journal passes the filter when
// ANY of its DOAJ subject terms contains ANY of the match fragments
// (case-insensitive substring match).
//
// The groups are ordered from broadest / most-searched to more specialised so
// the sidebar reads naturally from top to bottom.

export interface JournalSubjectGroup {
  /** Label shown in the sidebar checkbox list. */
  label: string;
  /** Lowercase fragments matched against DOAJ bibjson.subject[].term values. */
  matchTerms: string[];
}

export const JOURNAL_SUBJECT_GROUPS: JournalSubjectGroup[] = [
  {
    label: "Health & Medicine",
    matchTerms: [
      "medicine", "medical", "health", "nursing", "pharmacy", "pharmacology",
      "dentistry", "surgery", "oncology", "cardiology", "pathology",
      "psychiatry", "neurology", "ophthalmology", "dermatology", "pediatrics",
      "gynecology", "obstetrics", "immunology", "virology", "epidemiology",
      "radiology", "anesthesiology",
    ],
  },
  {
    label: "Social Sciences",
    matchTerms: [
      "social sciences", "social science", "sociology", "anthropology",
      "demography", "human geography", "gender studies", "social work",
      "communication", "media studies", "cultural studies",
    ],
  },
  {
    label: "Education",
    matchTerms: [
      "education", "teaching", "pedagogy", "curriculum", "learning",
      "special education", "higher education", "educational technology",
      "vocational", "school", "academic",
    ],
  },
  {
    label: "Psychology",
    matchTerms: [
      "psychology", "psychological", "cognitive", "behavioral", "behavior",
      "psychotherapy", "neuroscience", "mental health",
    ],
  },
  {
    label: "Economics",
    matchTerms: [
      "economics", "economic", "macroeconomics", "microeconomics",
      "econometrics", "development economics", "labour economics",
      "industrial relations", "trade",
    ],
  },
  {
    label: "Business & Management",
    matchTerms: [
      "management", "business", "commerce", "marketing", "accounting",
      "finance", "financial", "banking", "logistics", "operations",
      "entrepreneurship", "leadership", "administration", "organizational",
      "supply chain", "human resource",
    ],
  },
  {
    label: "Law & Political Science",
    matchTerms: [
      "law", "political science", "politics", "legislation", "jurisprudence",
      "government", "public administration", "constitutional",
      "international relations", "diplomacy", "criminology", "security studies",
    ],
  },
  {
    label: "Natural Sciences",
    matchTerms: [
      "science", "mathematics", "physics", "chemistry", "biology", "botany",
      "zoology", "ecology", "genetics", "microbiology", "biochemistry",
      "molecular biology", "astronomy", "geology", "geophysics",
      "oceanography", "atmospheric", "statistics",
    ],
  },
  {
    label: "Technology & Engineering",
    matchTerms: [
      "technology", "engineering", "computer science", "information technology",
      "electronics", "manufacturing", "mechanical", "chemical engineering",
      "electrical", "civil engineering", "architecture",
      "artificial intelligence", "robotics", "telecommunications", "materials science",
    ],
  },
  {
    label: "Agriculture & Environment",
    matchTerms: [
      "agriculture", "environmental", "forestry", "veterinary", "fisheries",
      "horticulture", "soil science", "food science", "agronomy",
      "plant science", "animal science", "aquaculture", "sustainability",
      "climate change", "natural resources",
    ],
  },
  {
    label: "Humanities",
    matchTerms: [
      "history", "philosophy", "literature", "linguistics", "language",
      "arts", "music", "performing arts", "religion", "theology",
      "archaeology", "classics", "mythology", "cultural heritage",
      "library science", "information science",
    ],
  },
];
