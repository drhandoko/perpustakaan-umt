/**
 * DOAJ (Directory of Open Access Journals) API client.
 *
 * Docs: https://doaj.org/api/v3/docs
 * No API key required for public search.
 *
 * Two search modes:
 *   searchDoajArticles — articles endpoint (used when SearchType === "articles" + DOAJ)
 *   searchDoajJournals — journals endpoint (used when SearchType === "journals")
 */

import type { Article } from "../data/mockArticles";
import {
  normalizeLanguageCode,
  normalizeLicense,
  normalizeDoi,
  doiToUrl,
  NOT_AVAILABLE,
} from "./normalize";

// ─── Shared result type ───────────────────────────────────────────────────────

export interface DoajSearchResult {
  articles: Article[];
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARTICLES
// ═══════════════════════════════════════════════════════════════════════════════

interface DoajIdentifier { type: string; id: string; }
interface DoajLink { type: string; url: string; content_type?: string; }
interface DoajAuthor { name: string; affiliation?: string; }
interface DoajLicense { type: string; url?: string; }
interface DoajArticleBibjson {
  title?: string;
  author?: DoajAuthor[];
  abstract?: string;
  year?: string;
  journal?: { title?: string; language?: string[]; publisher?: string; };
  identifier?: DoajIdentifier[];
  link?: DoajLink[];
  license?: DoajLicense[];
}
interface DoajArticleRecord { id: string; bibjson: DoajArticleBibjson; }
interface DoajArticleResponse {
  total: number; page: number; pageSize: number;
  results: DoajArticleRecord[];
}

function mapDoajArticle(raw: DoajArticleRecord, index: number): Article {
  const bib = raw.bibjson ?? {};
  const doiEntry = bib.identifier?.find((i) => i.type === "doi");
  const doi = normalizeDoi(doiEntry?.id);

  const links   = bib.link ?? [];
  const pdfLink  = links.find((l) => l.content_type?.toUpperCase() === "PDF" && l.url);
  const htmlLink = links.find((l) => l.content_type?.toUpperCase() === "HTML" && l.url);
  const anyLink  = links.find((l) => l.type === "fulltext" && l.url);

  const pdfUrl    = pdfLink?.url ?? null;
  const sourceUrl = htmlLink?.url ?? anyLink?.url ?? doiToUrl(doi) ?? "https://doaj.org";
  const authors   = (bib.author ?? []).map((a) => a.name).filter(Boolean);

  return {
    id: raw.id ?? `doaj-article-${index}`,
    contentType: "article",
    title: bib.title || NOT_AVAILABLE,
    authors: authors.length > 0 ? authors : [NOT_AVAILABLE],
    journal: bib.journal?.title || NOT_AVAILABLE,
    year: bib.year ? parseInt(bib.year, 10) : 0,
    doi,
    sourceUrl,
    pdfUrl,
    source: "DOAJ",
    license: normalizeLicense(bib.license?.[0]?.type),
    language: normalizeLanguageCode(bib.journal?.language?.[0]),
    abstract: bib.abstract || undefined,
  };
}

/**
 * Search DOAJ for open-access **articles** matching `query`.
 */
export async function searchDoajArticles(
  query: string,
  pageSize = 25,
  page = 1
): Promise<DoajSearchResult> {
  const encoded = encodeURIComponent(query.trim());
  const url = `https://doaj.org/api/v3/search/articles/${encoded}?pageSize=${pageSize}&page=${page}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Could not reach the DOAJ server. Please check your connection.");
  }
  if (!response.ok) {
    throw new Error(`DOAJ returned an error (HTTP ${response.status}).`);
  }

  const json: DoajArticleResponse = await response.json();
  return {
    articles: (json.results ?? []).map((item, i) => mapDoajArticle(item, i)),
    total: json.total ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOURNALS
// ═══════════════════════════════════════════════════════════════════════════════

interface DoajJournalBibjson {
  title?: string;
  publisher?: { name?: string; country?: string; };
  subject?: { term?: string; scheme?: string; code?: string }[];
  language?: string[];
  editorial?: { country?: string; };
  eissn?: string;
  pissn?: string;
  ref?: { journal?: string };
  article?: { license?: DoajLicense[] };
  apc?: { has_apc?: boolean };
}
interface DoajJournalRecord { id: string; bibjson: DoajJournalBibjson; }
interface DoajJournalResponse {
  total: number; page: number; pageSize: number;
  results: DoajJournalRecord[];
}

function mapDoajJournal(raw: DoajJournalRecord, index: number): Article {
  const bib = raw.bibjson ?? {};

  const publisherName = bib.publisher?.name || NOT_AVAILABLE;
  const country = bib.publisher?.country || bib.editorial?.country || undefined;

  const subjects = (bib.subject ?? [])
    .map((s) => s.term)
    .filter((t): t is string => !!t);

  const language = normalizeLanguageCode(bib.language?.[0]);

  const sourceUrl =
    bib.ref?.journal ||
    (raw.id ? `https://doaj.org/toc/${raw.id}` : "https://doaj.org");

  const licenseRaw = bib.article?.license?.[0]?.type;

  return {
    id: raw.id ?? `doaj-journal-${index}`,
    contentType: "journal",
    title: bib.title || NOT_AVAILABLE,
    authors: [],
    journal: publisherName,
    year: 0,
    doi: null,
    sourceUrl,
    pdfUrl: null,
    source: "DOAJ",
    license: normalizeLicense(licenseRaw),
    language,
    publisher: publisherName,
    subjects: subjects.length > 0 ? subjects : undefined,
    country,
  };
}

/**
 * Search DOAJ for open-access **journals** matching `query`.
 */
export async function searchDoajJournals(
  query: string,
  pageSize = 25,
  page = 1
): Promise<DoajSearchResult> {
  const encoded = encodeURIComponent(query.trim());
  const url = `https://doaj.org/api/v3/search/journals/${encoded}?pageSize=${pageSize}&page=${page}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Could not reach the DOAJ server. Please check your connection.");
  }
  if (!response.ok) {
    throw new Error(`DOAJ returned an error (HTTP ${response.status}).`);
  }

  const json: DoajJournalResponse = await response.json();
  return {
    articles: (json.results ?? []).map((item, i) => mapDoajJournal(item, i)),
    total: json.total ?? 0,
  };
}
