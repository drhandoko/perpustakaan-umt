/**
 * Data normalization utilities shared by all API adapters.
 *
 * Every source (DOAJ, Crossref, or any future provider) calls these
 * functions before producing an Article, so the rendered output is
 * consistent regardless of origin.
 *
 * Rules enforced here:
 *  - Language codes    → canonical display names  (case-insensitive ISO 639-1)
 *  - License strings   → "CC XX Y.0" labels       (type strings OR CC URLs)
 *  - Abstracts         → plain text               (JATS XML and HTML stripped)
 *  - Author names      → "Family, G." format      (structured objects → string)
 *  - Missing values    → NOT_AVAILABLE sentinel   (never null/empty in output)
 */

// ─── Sentinel ────────────────────────────────────────────────────────────────

/** Used in every Article field where the source data is absent. */
export const NOT_AVAILABLE = "Not available";

// ─── Language ─────────────────────────────────────────────────────────────────

/**
 * Map of ISO 639-1 lowercase codes to English display names.
 *
 * Covers languages commonly found in both DOAJ (uppercase "EN") and
 * Crossref (lowercase "en") responses — both are handled by lowercasing
 * before the lookup in `normalizeLanguageCode`.
 */
export const LANGUAGE_CODE_MAP: Readonly<Record<string, string>> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  zh: "Chinese",
  ar: "Arabic",
  it: "Italian",
  ja: "Japanese",
  ru: "Russian",
  id: "Indonesian",
  ko: "Korean",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  uk: "Ukrainian",
  sv: "Swedish",
  cs: "Czech",
  ro: "Romanian",
  hu: "Hungarian",
};

/**
 * Convert any ISO 639-1 language code to a display name.
 *
 * Accepts uppercase (DOAJ: "EN") and lowercase (Crossref: "en").
 * Falls back to the raw code string if it is not in the map, and to
 * NOT_AVAILABLE when no code is supplied.
 */
export function normalizeLanguageCode(code: string | undefined): string {
  if (!code) return NOT_AVAILABLE;
  return LANGUAGE_CODE_MAP[code.toLowerCase()] ?? code;
}

// ─── License ──────────────────────────────────────────────────────────────────

/**
 * Patterns used to identify Creative Commons license variants.
 * Checked in specificity order (most-restrictive first) so that
 * "BY-NC-ND" is matched before "BY-NC" and "BY-NC" before "BY".
 *
 * Works with:
 *   - DOAJ type strings  e.g.  "CC BY"  "CC BY-NC-ND"
 *   - Crossref license URLs  e.g.  "https://creativecommons.org/licenses/by-nc/4.0/"
 *   - Any other concatenation of the variant tokens
 */
const LICENSE_PATTERNS: Array<[RegExp, string]> = [
  [/by-nc-nd/i, "CC BY-NC-ND 4.0"],
  [/by-nc-sa/i, "CC BY-NC-SA 4.0"],
  [/by-nc/i,    "CC BY-NC 4.0"],
  [/by-sa/i,    "CC BY-SA 4.0"],
  [/by-nd/i,    "CC BY-ND 4.0"],
  [/\bby\b/i,   "CC BY 4.0"],   // word-boundary so "by" in URLs doesn't false-match
];

/**
 * Normalise any license representation to a consistent "CC XX Y.0" label.
 *
 * Pass either:
 *   - A DOAJ license type string ("CC BY", "CC BY-NC", …)
 *   - A Crossref license URL ("https://creativecommons.org/licenses/by/4.0/")
 *   - Any other string that encodes a CC variant
 *
 * Returns null when the string is absent, empty, or not a recognised
 * Creative Commons license.  Non-CC strings (e.g. publisher-specific
 * terms) are returned trimmed and as-is.
 */
export function normalizeLicense(raw: string | undefined | null): string | null {
  if (!raw || !raw.trim()) return null;

  for (const [pattern, label] of LICENSE_PATTERNS) {
    if (pattern.test(raw)) return label;
  }

  // Not a CC variant we recognise; preserve the original value (trimmed).
  return raw.trim() || null;
}

// ─── Abstract / markup cleanup ────────────────────────────────────────────────

/**
 * Strip JATS XML tags and any residual HTML from an abstract string.
 *
 * Crossref abstracts are wrapped in JATS markup:
 *   <jats:p>Introduction…</jats:p>
 *   <jats:sec><jats:title>Methods</jats:title>…</jats:sec>
 *
 * After tag removal the text is trimmed.  Returns undefined when the
 * input is absent or collapses to an empty string after stripping.
 */
export function stripMarkup(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const cleaned = text
    .replace(/<\/?jats:[^>]*>/gi, "") // JATS namespace tags
    .replace(/<\/?[^>]+>/g, "")       // any remaining HTML-like tags
    .replace(/\s{2,}/g, " ")          // collapse multiple spaces
    .trim();
  return cleaned || undefined;
}

// ─── Author name formatting ───────────────────────────────────────────────────

/**
 * Format a structured author object into a human-readable display string.
 *
 * Crossref authors carry `{ given, family, name }` fields.
 * DOAJ authors carry a plain `name` string — pass `{ name }` for them too.
 *
 * Output format: "Family, G."  (initial only for given name)
 *
 * Returns null when none of the known fields contain usable data.
 */
export function formatAuthorName(author: {
  given?: string;
  family?: string;
  name?: string;
}): string | null {
  if (author.family && author.given) {
    // "Smith, J."
    return `${author.family}, ${author.given.charAt(0).toUpperCase()}.`;
  }
  if (author.family) return author.family;
  if (author.name)   return author.name.trim() || null;
  return null;
}

// ─── DOI utilities ────────────────────────────────────────────────────────────

/**
 * Build a canonical DOI resolver URL.
 * Returns the DOI as a doi.org URL, or null when no DOI is available.
 */
export function doiToUrl(doi: string | null | undefined): string | null {
  if (!doi) return null;
  return `https://doi.org/${doi.trim()}`;
}

/**
 * Normalise a raw DOI string: trim whitespace, remove any leading
 * "doi:" or "https://doi.org/" prefix that some APIs include.
 */
export function normalizeDoi(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw
    .trim()
    .replace(/^https?:\/\/doi\.org\//i, "")
    .replace(/^doi:/i, "")
    .trim() || null;
}
