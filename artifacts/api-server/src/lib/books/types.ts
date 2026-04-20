/**
 * Shared types and normalisation utilities for all book data sources.
 *
 * Every fetcher (DOAB, OAPEN, …) converts its raw API response into
 * the canonical `BookRecord` shape before the aggregator route
 * deduplicates and returns the combined result to the frontend.
 *
 * The shape mirrors the frontend `Article` interface with one addition:
 * `isbn` — used for robust deduplication across sources.
 */

// ─── Canonical book record ─────────────────────────────────────────────────────

export interface BookRecord {
  /** Unique id composed as "<source>-<uuid>" */
  id: string;
  contentType: "book";
  title: string;
  /** Author or editor display names */
  authors: string[];
  /** Publisher name — also stored in `journal` for UI compatibility */
  journal: string;
  publisher: string;
  year: number;
  /** Normalised DOI without "https://doi.org/" prefix */
  doi: string | null;
  /** ISBN-13 or ISBN-10 digits only (hyphens stripped) */
  isbn: string | null;
  /** Canonical link to the book record in the source directory */
  sourceUrl: string;
  pdfUrl: null;
  /** "DOAB" | "OAPEN" | … */
  source: string;
  license: string | null;
  language: string;
  abstract?: string;
  subjects?: string[];
}

// ─── DSpace metadata field type (shared by DOAB and OAPEN) ────────────────────

/** A single key/value metadata field in a DSpace 5 REST API item. */
export interface DSpaceMetadataField {
  key: string;
  value: string;
  language: string | null;
  schema: string;
  element: string;
  qualifier: string | null;
}

/** A DSpace 5 REST API item as returned by the /rest/search endpoint. */
export interface DSpaceItem {
  uuid: string;
  name: string;       // fallback title
  handle: string;     // e.g. "20.500.12854/146789"
  type: string;
  withdrawn: string;  // "true" | "false"
  archived: string;
  metadata: DSpaceMetadataField[];
}

// ─── Shared normalisation utilities ───────────────────────────────────────────

/** ISO 639-1 / 639-2 → display name. */
const LANG_MAP: Record<string, string> = {
  en: "English",  eng: "English",
  es: "Spanish",  spa: "Spanish",
  fr: "French",   fre: "French",  fra: "French",
  de: "German",   ger: "German",  deu: "German",
  pt: "Portuguese", por: "Portuguese",
  zh: "Chinese",  chi: "Chinese", zho: "Chinese",
  ar: "Arabic",   ara: "Arabic",
  it: "Italian",  ita: "Italian",
  ja: "Japanese", jpn: "Japanese",
  ru: "Russian",  rus: "Russian",
  id: "Indonesian", ind: "Indonesian",
  nl: "Dutch",    nld: "Dutch",
  pl: "Polish",   pol: "Polish",
  tr: "Turkish",  tur: "Turkish",
  fi: "Finnish",  fin: "Finnish",
  sv: "Swedish",  swe: "Swedish",
  no: "Norwegian", nor: "Norwegian",
  da: "Danish",   dan: "Danish",
};

export function normalizeLanguage(code: string | undefined): string {
  if (!code) return "Not available";
  return LANG_MAP[code.toLowerCase()] ?? code;
}

/** CC license URL or type string → canonical "CC XX Y.0" label. */
const LICENSE_PATTERNS: Array<[RegExp, string]> = [
  [/by-nc-nd/i, "CC BY-NC-ND 4.0"],
  [/by-nc-sa/i, "CC BY-NC-SA 4.0"],
  [/by-nc/i,    "CC BY-NC 4.0"],
  [/by-sa/i,    "CC BY-SA 4.0"],
  [/by-nd/i,    "CC BY-ND 4.0"],
  [/\bby\b/i,   "CC BY 4.0"],
];

export function normalizeLicense(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  for (const [pattern, label] of LICENSE_PATTERNS) {
    if (pattern.test(raw)) return label;
  }
  return raw.trim() || null;
}

/** Strip "https://doi.org/" / "doi:" prefix and return bare DOI, or null. */
export function normalizeDoi(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim()
    .replace(/^https?:\/\/doi\.org\//i, "")
    .replace(/^doi:/i, "")
    .trim();
  // Must look like a real DOI
  return cleaned.startsWith("10.") ? cleaned : null;
}

/** Canonicalise ISBN to digits only (no hyphens/spaces). Returns null if invalid. */
export function normalizeIsbn(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9X]/gi, "");
  return digits.length === 10 || digits.length === 13 ? digits.toUpperCase() : null;
}

// ─── DSpace metadata helpers ──────────────────────────────────────────────────

/** Return all values for a metadata key (exact match). */
export function metaValues(fields: DSpaceMetadataField[], key: string): string[] {
  return fields
    .filter((f) => f.key === key)
    .map((f) => f.value?.trim())
    .filter(Boolean) as string[];
}

/** Return the first value for a metadata key, or undefined. */
export function metaFirst(
  fields: DSpaceMetadataField[],
  key: string
): string | undefined {
  return metaValues(fields, key)[0];
}
