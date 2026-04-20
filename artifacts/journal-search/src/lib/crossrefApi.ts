/**
 * Crossref API client.
 *
 * Docs: https://api.crossref.org/swagger-ui/index.html
 * No API key required. We include a `mailto` parameter per the
 * Crossref "polite pool" recommendation so queries are routed
 * to the higher-priority pool.
 *
 * Endpoint used:
 *   GET https://api.crossref.org/works?query={query}&rows=25&mailto=library@murniteguh.ac.id
 *
 * Raw Crossref works are passed through the shared normalizers in
 * src/lib/normalize.ts before being returned as Article values.
 */

import type { Article } from "../data/mockArticles";
import {
  normalizeLanguageCode,
  normalizeLicense,
  normalizeDoi,
  doiToUrl,
  stripMarkup,
  formatAuthorName,
  NOT_AVAILABLE,
} from "./normalize";

// ─── Raw Crossref response types ──────────────────────────────────────────────

interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;     // corporate / organisation author
  sequence?: string;
}

interface CrossrefLink {
  URL: string;
  "content-type"?: string;
  "intended-application"?: string;
}

interface CrossrefLicense {
  URL: string;
  "content-version"?: string;
  "delay-in-days"?: number;
}

interface CrossrefDateParts {
  "date-parts": number[][];
}

interface CrossrefWork {
  DOI?: string;
  title?: string[];
  author?: CrossrefAuthor[];
  "container-title"?: string[];
  published?: CrossrefDateParts;
  "published-print"?: CrossrefDateParts;
  "published-online"?: CrossrefDateParts;
  abstract?: string;
  language?: string;
  license?: CrossrefLicense[];
  link?: CrossrefLink[];
  URL?: string;
}

interface CrossrefResponse {
  status: string;
  message: {
    "total-results": number;
    items: CrossrefWork[];
  };
}

// ─── Helpers specific to Crossref's data shape ────────────────────────────────

/** Extract the publication year from whichever date field is present. */
function resolveYear(work: CrossrefWork): number {
  const parts =
    work.published?.["date-parts"] ??
    work["published-print"]?.["date-parts"] ??
    work["published-online"]?.["date-parts"] ??
    [];
  const year = parts?.[0]?.[0];
  return typeof year === "number" && year > 1000 ? year : 0;
}

/**
 * Pick the best license from Crossref's license array.
 * Prefers the VOR (version of record) over AM (accepted manuscript).
 */
function pickLicenseUrl(licenses: CrossrefLicense[] | undefined): string | null {
  if (!licenses || licenses.length === 0) return null;
  const vor = licenses.find((l) => l["content-version"] === "vor");
  return (vor ?? licenses[0]).URL ?? null;
}

/**
 * Find a direct PDF link in Crossref's link array.
 * Prefers `text-mining` application since those are the most reliable
 * machine-readable links; falls back to any PDF content-type link.
 */
function pickPdfUrl(links: CrossrefLink[]): string | null {
  const textMiningPdf = links.find(
    (l) =>
      l["intended-application"] === "text-mining" &&
      l["content-type"]?.toLowerCase() === "application/pdf"
  );
  if (textMiningPdf) return textMiningPdf.URL;

  const anyPdf = links.find(
    (l) => l["content-type"]?.toLowerCase() === "application/pdf"
  );
  return anyPdf?.URL ?? null;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapWork(work: CrossrefWork, index: number): Article {
  const doi = normalizeDoi(work.DOI);

  const sourceUrl = doiToUrl(doi) ?? work.URL ?? "https://search.crossref.org";

  const links  = work.link ?? [];
  const pdfUrl = pickPdfUrl(links);

  const authors = (work.author ?? [])
    .map(formatAuthorName)
    .filter((n): n is string => n !== null);

  return {
    id: doi ? `crossref-${doi}` : `crossref-${index}`,
    title: work.title?.[0] || NOT_AVAILABLE,
    authors: authors.length > 0 ? authors : [NOT_AVAILABLE],
    journal: work["container-title"]?.[0] || NOT_AVAILABLE,
    year: resolveYear(work),
    doi,
    sourceUrl,
    pdfUrl,
    source: "Crossref",
    license: normalizeLicense(pickLicenseUrl(work.license)),
    language: normalizeLanguageCode(work.language),
    abstract: stripMarkup(work.abstract),
  };
}

// ─── Public search function ───────────────────────────────────────────────────

export interface CrossrefSearchResult {
  articles: Article[];
  total: number;
}

/**
 * Search Crossref for works matching `query`.
 *
 * @param query     Free-text keyword(s)
 * @param pageSize  Max results to return (default 25)
 * @param page      1-based page number (default 1)
 *
 * Throws a descriptive Error on network failure or non-200 response.
 */
export async function searchCrossref(
  query: string,
  pageSize = 25,
  page = 1
): Promise<CrossrefSearchResult> {
  const offset = (page - 1) * pageSize;
  const params = new URLSearchParams({
    query: query.trim(),
    rows: String(pageSize),
    offset: String(offset),
    mailto: "library@murniteguh.ac.id",
  });
  const url = `https://api.crossref.org/works?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error(
      "Could not reach the Crossref server. Please check your connection and try again."
    );
  }

  if (!response.ok) {
    throw new Error(
      `Crossref returned an error (HTTP ${response.status}). Please try again shortly.`
    );
  }

  const json: CrossrefResponse = await response.json();
  const items   = json.message?.items ?? [];
  const total   = json.message?.["total-results"] ?? 0;
  const articles = items.map((item, i) => mapWork(item, i));

  return { articles, total };
}
