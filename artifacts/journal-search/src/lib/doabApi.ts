/**
 * DOAB (Directory of Open Access Books) API client.
 *
 * Uses the DSpace REST API exposed by DOAB:
 *   GET https://directory.doabooks.org/rest/search
 *       ?query={q}&expand=metadata&limit={n}&offset={n}
 *
 * No API key required.
 * Response: array of DSpace Item objects, each with a `metadata` array of
 * { key, value, language } objects.
 *
 * Total count: DSpace's search endpoint does not return a total, so we
 * derive a conservative estimate from the results length.
 */

import type { Article } from "../data/mockArticles";
import {
  normalizeLanguageCode,
  normalizeLicense,
  normalizeDoi,
  doiToUrl,
  NOT_AVAILABLE,
} from "./normalize";

// ─── Raw DSpace types ─────────────────────────────────────────────────────────

interface DSpaceMetadataEntry {
  key: string;
  value: string;
  language?: string | null;
}

interface DSpaceItem {
  id?: number;
  name?: string;
  handle?: string;
  type?: string;
  metadata?: DSpaceMetadataEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return the first metadata value for `key`, or undefined. */
function getMeta(metadata: DSpaceMetadataEntry[], key: string): string | undefined {
  return metadata.find((m) => m.key === key)?.value || undefined;
}

/** Return all metadata values for `key`. */
function getAllMeta(metadata: DSpaceMetadataEntry[], key: string): string[] {
  return metadata
    .filter((m) => m.key === key && m.value)
    .map((m) => m.value);
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapDoabBook(raw: DSpaceItem, index: number): Article {
  const meta = raw.metadata ?? [];

  const title = getMeta(meta, "dc.title") || raw.name || NOT_AVAILABLE;

  // Authors: prefer dc.contributor.author, fall back to dc.contributor.editor
  const authorValues = getAllMeta(meta, "dc.contributor.author");
  const editorValues = getAllMeta(meta, "dc.contributor.editor");
  const contributors = authorValues.length > 0 ? authorValues : editorValues;
  const authors = contributors.length > 0 ? contributors : [NOT_AVAILABLE];

  const publisherName = getMeta(meta, "dc.publisher") || NOT_AVAILABLE;

  // Year — dc.date.issued or dc.date
  const dateRaw = getMeta(meta, "dc.date.issued") || getMeta(meta, "dc.date");
  const year = dateRaw ? parseInt(dateRaw.slice(0, 4), 10) || 0 : 0;

  // Language — DOAB stores full names ("English") or codes
  const langRaw = getMeta(meta, "dc.language") || getMeta(meta, "dc.language.iso");
  const language = langRaw
    ? (normalizeLanguageCode(langRaw) !== NOT_AVAILABLE
        ? normalizeLanguageCode(langRaw)
        : langRaw)
    : NOT_AVAILABLE;

  // License
  const licenseRaw =
    getMeta(meta, "dc.rights") ||
    getMeta(meta, "dc.rights.license") ||
    getMeta(meta, "dc.license");

  // DOI — may be stored as full URL or bare DOI
  const doiRaw =
    getMeta(meta, "dc.identifier.doi") ||
    getAllMeta(meta, "dc.identifier").find((v) => v.includes("doi"));
  const doi = normalizeDoi(doiRaw);

  // Source URL: doi.org link preferred, else DOAB handle page
  const handle = raw.handle;
  const sourceUrl =
    doiToUrl(doi) ||
    (handle ? `https://directory.doabooks.org/handle/${handle}` : "https://directory.doabooks.org");

  const abstract = getMeta(meta, "dc.description.abstract") || undefined;

  return {
    id: raw.id != null ? `doab-${raw.id}` : `doab-${index}`,
    contentType: "book",
    title,
    authors,
    journal: publisherName,
    year,
    doi,
    sourceUrl,
    pdfUrl: null,
    source: "DOAB",
    license: normalizeLicense(licenseRaw),
    language,
    abstract,
    publisher: publisherName,
  };
}

// ─── Public search function ───────────────────────────────────────────────────

export interface DoabSearchResult {
  articles: Article[];
  total: number;
}

/**
 * Search DOAB for open-access **books** matching `query`.
 *
 * @param query     Free-text keyword(s)
 * @param pageSize  Max results per page (DOAB allows up to 100)
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
    expand: "metadata",
    limit: String(pageSize),
    offset: String(offset),
  });
  const url = `https://directory.doabooks.org/rest/search?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Could not reach the DOAB server. Please check your connection.");
  }

  if (!response.ok) {
    throw new Error(`DOAB returned an error (HTTP ${response.status}).`);
  }

  const json: DSpaceItem[] | { items?: DSpaceItem[] } = await response.json();

  // DSpace can return either a bare array or an object with an items field
  const items: DSpaceItem[] = Array.isArray(json)
    ? json
    : (json as { items?: DSpaceItem[] }).items ?? [];

  const articles = items.map((item, i) => mapDoabBook(item, i));

  // DSpace search doesn't return a total — estimate conservatively so the
  // pagination UI shows a "Next" button when a full page was returned.
  const hasMore = items.length === pageSize;
  const total   = offset + items.length + (hasMore ? pageSize : 0);

  return { articles, total };
}
