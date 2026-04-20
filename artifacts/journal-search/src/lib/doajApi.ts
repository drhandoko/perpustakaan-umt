/**
 * DOAJ (Directory of Open Access Journals) API client.
 *
 * Docs: https://doaj.org/api/v3/docs
 * No API key required for public search.
 *
 * Endpoint used:
 *   GET https://doaj.org/api/v3/search/articles/{query}?pageSize=25
 *
 * The function fetches results, normalises them into the shared Article shape,
 * and returns them alongside a totalCount.
 */

import type { Article } from "../data/mockArticles";

// ─── Raw DOAJ response types ──────────────────────────────────────────────────

interface DoajIdentifier {
  type: string; // "doi" | "eissn" | "pissn"
  id: string;
}

interface DoajLink {
  type: string; // "fulltext"
  url: string;
  content_type?: string;
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

// ─── Language code → display name ────────────────────────────────────────────

const LANG_CODE_MAP: Record<string, string> = {
  EN: "English",
  ES: "Spanish",
  FR: "French",
  DE: "German",
  PT: "Portuguese",
  ZH: "Chinese",
  AR: "Arabic",
  IT: "Italian",
  JA: "Japanese",
  RU: "Russian",
};

function resolveLanguage(codes: string[] | undefined): string {
  if (!codes || codes.length === 0) return "Not available";
  const label = LANG_CODE_MAP[codes[0].toUpperCase()];
  return label ?? codes[0]; // fall back to raw code if unmapped
}

// ─── License normalisation ────────────────────────────────────────────────────

function resolveLicense(licenses: DoajLicense[] | undefined): string | null {
  if (!licenses || licenses.length === 0) return null;
  const raw = licenses[0].type ?? "";
  // Normalise common variants to a consistent label
  if (/cc[\s-]by[\s-]nc[\s-]nd/i.test(raw)) return "CC BY-NC-ND 4.0";
  if (/cc[\s-]by[\s-]nc[\s-]sa/i.test(raw)) return "CC BY-NC-SA 4.0";
  if (/cc[\s-]by[\s-]nc/i.test(raw)) return "CC BY-NC 4.0";
  if (/cc[\s-]by[\s-]sa/i.test(raw)) return "CC BY-SA 4.0";
  if (/cc[\s-]by[\s-]nd/i.test(raw)) return "CC BY-ND 4.0";
  if (/cc[\s-]by/i.test(raw)) return "CC BY 4.0";
  return raw || null;
}

// ─── Map one DOAJ article to the shared Article shape ────────────────────────

function mapArticle(raw: DoajArticle, index: number): Article {
  const bib = raw.bibjson ?? {};

  // DOI — look for identifier with type "doi"
  const doiEntry = bib.identifier?.find((i) => i.type === "doi");
  const doi = doiEntry?.id ?? null;

  // Links — DOAJ may return multiple links with different content_types
  const links = bib.link ?? [];

  // PDF link — look for content_type "PDF" (case-insensitive)
  const pdfLink = links.find(
    (l) => l.content_type?.toUpperCase() === "PDF" && l.url
  );
  const pdfUrl = pdfLink?.url ?? null;

  // Source URL — prefer HTML fulltext; fall back to DOI resolver or DOAJ root
  const htmlLink = links.find(
    (l) => l.content_type?.toUpperCase() === "HTML" && l.url
  );
  const anyFulltext = links.find((l) => l.type === "fulltext" && l.url);
  const sourceUrl =
    htmlLink?.url ??
    anyFulltext?.url ??
    (doi ? `https://doi.org/${doi}` : "https://doaj.org");

  // Author names
  const authors = bib.author?.map((a) => a.name).filter(Boolean) ?? [];

  return {
    id: raw.id ?? `doaj-${index}`,
    title: bib.title ?? "Not available",
    authors: authors.length > 0 ? authors : ["Not available"],
    journal: bib.journal?.title ?? "Not available",
    year: bib.year ? parseInt(bib.year, 10) : 0,
    doi,
    sourceUrl,
    pdfUrl,
    source: "DOAJ",
    license: resolveLicense(bib.license),
    language: resolveLanguage(bib.journal?.language),
    abstract: bib.abstract,
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
    response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
  } catch (err) {
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
