/**
 * DOAJ (Directory of Open Access Journals) API client.
 *
 * Docs: https://doaj.org/api/v3/docs
 * No API key required for public search.
 *
 * Endpoint used:
 *   GET https://doaj.org/api/v3/search/articles/{query}?pageSize=25
 *
 * Raw DOAJ records are passed through the shared normalizers in
 * src/lib/normalize.ts before being returned as Article values.
 */

import type { Article } from "../data/mockArticles";
import {
  normalizeLanguageCode,
  normalizeLicense,
  normalizeDoi,
  doiToUrl,
  NOT_AVAILABLE,
} from "./normalize";

// ─── Raw DOAJ response types ──────────────────────────────────────────────────

interface DoajIdentifier {
  type: string; // "doi" | "eissn" | "pissn"
  id: string;
}

interface DoajLink {
  type: string;       // "fulltext"
  url: string;
  content_type?: string; // "PDF" | "HTML" | "FullText" | …
}

interface DoajAuthor {
  name: string;
  affiliation?: string;
}

interface DoajLicense {
  type: string; // e.g. "CC BY"
  url?: string;
}

interface DoajBibjson {
  title?: string;
  author?: DoajAuthor[];
  abstract?: string;
  year?: string;
  journal?: {
    title?: string;
    language?: string[]; // e.g. ["EN"]
    publisher?: string;
  };
  identifier?: DoajIdentifier[];
  link?: DoajLink[];
  license?: DoajLicense[];
}

interface DoajArticle {
  id: string;
  bibjson: DoajBibjson;
}

interface DoajResponse {
  total: number;
  page: number;
  pageSize: number;
  results: DoajArticle[];
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapArticle(raw: DoajArticle, index: number): Article {
  const bib = raw.bibjson ?? {};

  // DOI — look for identifier with type "doi"; normalise any prefix variants
  const doiEntry = bib.identifier?.find((i) => i.type === "doi");
  const doi = normalizeDoi(doiEntry?.id);

  // Links
  const links = bib.link ?? [];
  const pdfLink  = links.find((l) => l.content_type?.toUpperCase() === "PDF" && l.url);
  const htmlLink = links.find((l) => l.content_type?.toUpperCase() === "HTML" && l.url);
  const anyLink  = links.find((l) => l.type === "fulltext" && l.url);

  const pdfUrl   = pdfLink?.url ?? null;
  const sourceUrl = htmlLink?.url ?? anyLink?.url ?? doiToUrl(doi) ?? "https://doaj.org";

  // Authors — DOAJ supplies plain name strings
  const authors = (bib.author ?? []).map((a) => a.name).filter(Boolean);

  // License — DOAJ supplies a type string ("CC BY", "CC BY-NC-ND", …)
  const licenseRaw = bib.license?.[0]?.type;

  return {
    id: raw.id ?? `doaj-${index}`,
    title: bib.title || NOT_AVAILABLE,
    authors: authors.length > 0 ? authors : [NOT_AVAILABLE],
    journal: bib.journal?.title || NOT_AVAILABLE,
    year: bib.year ? parseInt(bib.year, 10) : 0,
    doi,
    sourceUrl,
    pdfUrl,
    source: "DOAJ",
    license: normalizeLicense(licenseRaw),
    language: normalizeLanguageCode(bib.journal?.language?.[0]),
    abstract: bib.abstract || undefined,
  };
}

// ─── Public search function ───────────────────────────────────────────────────

export interface DoajSearchResult {
  articles: Article[];
  total: number;
}

/**
 * Search DOAJ for open-access articles matching `query`.
 *
 * @param query     Free-text keyword(s)
 * @param pageSize  Max results to return (default 25, DOAJ max 100)
 * @param page      1-based page number (default 1)
 *
 * Throws a descriptive Error on network failure or non-200 response.
 */
export async function searchDoaj(
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
    throw new Error(
      "Could not reach the DOAJ server. Please check your connection and try again."
    );
  }

  if (!response.ok) {
    throw new Error(
      `DOAJ returned an error (HTTP ${response.status}). Please try again shortly.`
    );
  }

  const json: DoajResponse = await response.json();
  const articles = (json.results ?? []).map((item, i) => mapArticle(item, i));

  return { articles, total: json.total ?? 0 };
}
