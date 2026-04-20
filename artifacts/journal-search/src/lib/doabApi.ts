/**
 * Book search via Crossref API.
 *
 * DOAB's DSpace REST API does not send CORS headers, so it cannot be called
 * directly from a browser. Crossref carries a large catalogue of academic
 * monographs, edited volumes, and reference books with the same reliable
 * open API we use for articles.
 *
 * Filter applied: type:book,type:monograph,type:edited-book,type:reference-book
 *
 * Docs: https://api.crossref.org/swagger-ui/index.html
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

// ─── Raw Crossref types (book subset) ────────────────────────────────────────

interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;
  sequence?: string;
}

interface CrossrefLicense {
  URL: string;
  "content-version"?: string;
}

interface CrossrefDateParts { "date-parts": number[][]; }

interface CrossrefWork {
  DOI?: string;
  title?: string[];
  "short-title"?: string[];
  author?: CrossrefAuthor[];
  editor?: CrossrefAuthor[];
  publisher?: string;
  "container-title"?: string[];
  published?: CrossrefDateParts;
  "published-print"?: CrossrefDateParts;
  "published-online"?: CrossrefDateParts;
  abstract?: string;
  language?: string;
  license?: CrossrefLicense[];
  URL?: string;
  type?: string;
  "number-of-pages"?: number;
  subject?: string[];
}

interface CrossrefResponse {
  status: string;
  message: {
    "total-results": number;
    items: CrossrefWork[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveYear(work: CrossrefWork): number {
  const parts =
    work.published?.["date-parts"] ??
    work["published-print"]?.["date-parts"] ??
    work["published-online"]?.["date-parts"] ??
    [];
  const year = parts?.[0]?.[0];
  return typeof year === "number" && year > 1000 ? year : 0;
}

function pickLicenseUrl(licenses: CrossrefLicense[] | undefined): string | null {
  if (!licenses || licenses.length === 0) return null;
  const vor = licenses.find((l) => l["content-version"] === "vor");
  return (vor ?? licenses[0]).URL ?? null;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapBook(work: CrossrefWork, index: number): Article {
  const doi = normalizeDoi(work.DOI);
  const sourceUrl = doiToUrl(doi) ?? work.URL ?? "https://search.crossref.org";

  // Prefer listed authors; fall back to editors
  const rawContributors = work.author?.length ? work.author : (work.editor ?? []);
  const contributors = rawContributors
    .map(formatAuthorName)
    .filter((n): n is string => n !== null);

  const publisherName = work.publisher || NOT_AVAILABLE;

  return {
    id: doi ? `book-${doi}` : `book-${index}`,
    contentType: "book",
    title: work.title?.[0] || NOT_AVAILABLE,
    authors: contributors.length > 0 ? contributors : [NOT_AVAILABLE],
    journal: publisherName,
    year: resolveYear(work),
    doi,
    sourceUrl,
    pdfUrl: null,
    source: "Crossref",
    license: normalizeLicense(pickLicenseUrl(work.license)),
    language: normalizeLanguageCode(work.language),
    abstract: stripMarkup(work.abstract),
    publisher: publisherName,
    subjects: work.subject?.slice(0, 5),
  };
}

// ─── Public search function ───────────────────────────────────────────────────

export interface DoabSearchResult {
  articles: Article[];
  total: number;
}

/**
 * Search for open-access **books** matching `query`.
 * Sourced from Crossref, filtered to book-type works.
 *
 * @param query     Free-text keyword(s)
 * @param pageSize  Results per page (max 100)
 * @param page      1-based page number
 */
export async function searchDoab(
  query: string,
  pageSize = 25,
  page = 1
): Promise<DoabSearchResult> {
  const offset = (page - 1) * pageSize;
  const params = new URLSearchParams({
    query: query.trim(),
    rows: String(pageSize),
    offset: String(offset),
    filter: "type:book,type:monograph,type:edited-book,type:reference-book",
    mailto: "library@murniteguh.ac.id",
  });
  const url = `https://api.crossref.org/works?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Could not reach the Crossref server. Please check your connection.");
  }

  if (!response.ok) {
    throw new Error(`Book search returned an error (HTTP ${response.status}).`);
  }

  const json: CrossrefResponse = await response.json();
  const items   = json.message?.items ?? [];
  const total   = json.message?.["total-results"] ?? 0;
  const articles = items.map((item, i) => mapBook(item, i));

  return { articles, total };
}
