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
 * Results are normalised into the shared Article shape.
 */

import type { Article } from "../data/mockArticles";

// ─── Raw Crossref response types ──────────────────────────────────────────────

interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string; // corporate/organisation author
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

// ─── Language code → display name ────────────────────────────────────────────

const LANG_CODE_MAP: Record<string, string> = {
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
};

function resolveLanguage(code: string | undefined): string {
  if (!code) return "Not available";
  return LANG_CODE_MAP[code.toLowerCase()] ?? code;
}

// ─── License URL → CC label ───────────────────────────────────────────────────

function resolveLicense(licenses: CrossrefLicense[] | undefined): string | null {
  if (!licenses || licenses.length === 0) return null;
  // Prefer the vor (version of record) or any license
  const lic = licenses.find((l) => l["content-version"] === "vor") ?? licenses[0];
  const url = lic.URL ?? "";
  if (/by-nc-nd/i.test(url)) return "CC BY-NC-ND 4.0";
  if (/by-nc-sa/i.test(url)) return "CC BY-NC-SA 4.0";
  if (/by-nc/i.test(url))    return "CC BY-NC 4.0";
  if (/by-sa/i.test(url))    return "CC BY-SA 4.0";
  if (/by-nd/i.test(url))    return "CC BY-ND 4.0";
  if (/by/i.test(url))       return "CC BY 4.0";
  return null;
}

// ─── Strip JATS XML tags from Crossref abstracts ─────────────────────────────

function stripJats(text: string | undefined): string | undefined {
  if (!text) return undefined;
  return text
    .replace(/<\/?jats:[^>]*>/gi, "")
    .replace(/<\/?[^>]+>/g, "")
    .trim();
}

// ─── Resolve year from one of several date fields ─────────────────────────────

function resolveYear(work: CrossrefWork): number {
  const parts =
    work.published?.["date-parts"] ??
    work["published-print"]?.["date-parts"] ??
    work["published-online"]?.["date-parts"] ??
    [];
  const year = parts?.[0]?.[0];
  return typeof year === "number" && year > 1000 ? year : 0;
}

// ─── Map one Crossref work to the shared Article shape ────────────────────────

function mapWork(work: CrossrefWork, index: number): Article {
  const doi = work.DOI ?? null;

  // Source URL — prefer DOI resolver
  const sourceUrl = doi
    ? `https://doi.org/${doi}`
    : (work.URL ?? "https://search.crossref.org");

  // PDF link — look for links with PDF content type
  const links = work.link ?? [];
  const pdfLink = links.find(
    (l) =>
      l["content-type"]?.toLowerCase() === "application/pdf" &&
      l.URL
  );
  const pdfUrl = pdfLink?.URL ?? null;

  // Author display names
  const authors: string[] =
    (work.author ?? [])
      .map((a) => {
        if (a.family && a.given) return `${a.family}, ${a.given.charAt(0)}.`;
        if (a.family) return a.family;
        if (a.name) return a.name;
        return null;
      })
      .filter((n): n is string => n !== null);

  return {
    id: doi ? `crossref-${doi}` : `crossref-${index}`,
    title: work.title?.[0] ?? "Not available",
    authors: authors.length > 0 ? authors : ["Not available"],
    journal: work["container-title"]?.[0] ?? "Not available",
    year: resolveYear(work),
    doi,
    sourceUrl,
    pdfUrl,
    source: "Crossref",
    license: resolveLicense(work.license),
    language: resolveLanguage(work.language),
    abstract: stripJats(work.abstract),
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
 * @param page      1-based page offset (default 1)
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
    response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
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
  const items = json.message?.items ?? [];
  const total = json.message?.["total-results"] ?? 0;

  const articles = items.map((item, i) => mapWork(item, i));

  return { articles, total };
}
