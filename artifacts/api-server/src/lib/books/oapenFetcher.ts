/**
 * OAPEN (Open Access Publishing in European Networks) fetcher.
 *
 * Calls the OAPEN DSpace 5 REST API server-side and maps each item to
 * the canonical BookRecord shape.
 *
 * API base : https://library.oapen.org/rest/
 * No authentication required.
 *
 * OAPEN-specific metadata keys used here:
 *   dc.title                  — book title
 *   dc.contributor.author     — author names
 *   dc.contributor.editor     — editor names (fallback)
 *   dc.date.issued            — publication year
 *   publisher.name            — publisher display name
 *   dc.language               — ISO 639-1/639-2 language code
 *   dc.rights                 — license string (if present)
 *   dc.identifier             — may contain ISBN-13
 *   dc.identifier.uri         — canonical handle URL
 *   dc.description.abstract   — abstract
 *   dc.subject.other          — subject terms
 *   dc.subject.classification — subject classification
 *   oapen.identifier.doi      — DOI (shared namespace with DOAB)
 *   oapen.imprint             — imprint / series publisher
 */

import type { BookRecord, DSpaceItem } from "./types.js";
import {
  metaFirst, metaValues,
  normalizeLanguage, normalizeLicense, normalizeDoi, normalizeIsbn,
} from "./types.js";

const OAPEN_REST = "https://library.oapen.org/rest";

// ─── Raw response type ────────────────────────────────────────────────────────

export interface OapenFetchResult {
  records: BookRecord[];
  /** Estimated total (OAPEN also returns no total field). */
  total: number;
  error: string | null;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapOapenItem(item: DSpaceItem): BookRecord {
  const m = item.metadata ?? [];

  const title = metaFirst(m, "dc.title") ?? item.name ?? "Not available";

  // Authors → editors fallback
  const authors =
    metaValues(m, "dc.contributor.author").length > 0
      ? metaValues(m, "dc.contributor.author")
      : metaValues(m, "dc.contributor.editor");

  // Year
  const issuedRaw = metaFirst(m, "dc.date.issued");
  const year = issuedRaw ? parseInt(issuedRaw.slice(0, 4), 10) || 0 : 0;

  // Publisher: OAPEN uses publisher.name (and sometimes oapen.imprint)
  const publisher =
    metaFirst(m, "publisher.name") ??
    metaFirst(m, "oapen.imprint") ??
    "Not available";

  // Language
  const language = normalizeLanguage(metaFirst(m, "dc.language"));

  // License: OAPEN may have dc.rights; many books are CC BY without an explicit field
  const license = normalizeLicense(metaFirst(m, "dc.rights"));

  // DOI
  const doi = normalizeDoi(
    metaFirst(m, "oapen.identifier.doi") ?? metaFirst(m, "dc.identifier.doi")
  );

  // ISBN — dc.identifier values, filter by ISBN-13 pattern
  const isbnRaw = metaValues(m, "dc.identifier").find(
    (v) => /^(978|979)\d{10}$/.test(v.replace(/[- ]/g, ""))
  );
  const isbn = normalizeIsbn(isbnRaw);

  // Source URL: handle page on library.oapen.org, then DOI
  const handleUrl = item.handle
    ? `https://library.oapen.org/handle/${item.handle}`
    : null;
  const sourceUrl =
    handleUrl ?? (doi ? `https://doi.org/${doi}` : "https://library.oapen.org");

  // Abstract
  const abstract = metaFirst(m, "dc.description.abstract");

  // Subjects
  const subjects = [
    ...metaValues(m, "dc.subject.classification"),
    ...metaValues(m, "dc.subject.other"),
  ].slice(0, 5);

  return {
    id: `oapen-${item.uuid}`,
    contentType: "book",
    title,
    authors: authors.length > 0 ? authors : ["Not available"],
    journal: publisher,
    publisher,
    year,
    doi,
    isbn,
    sourceUrl,
    pdfUrl: null,
    source: "OAPEN",
    license,
    language,
    abstract,
    subjects: subjects.length > 0 ? subjects : undefined,
  };
}

// ─── Public fetch function ────────────────────────────────────────────────────

/**
 * Search OAPEN for open-access books.
 *
 * @param query    Free-text keyword(s).
 * @param limit    Results per page.
 * @param offset   Zero-based result offset.
 */
export async function fetchOapen(
  query: string,
  limit: number,
  offset: number
): Promise<OapenFetchResult> {
  const url = new URL(`${OAPEN_REST}/search`);
  url.searchParams.set("query",  query);
  url.searchParams.set("expand", "metadata");
  url.searchParams.set("limit",  String(limit));
  url.searchParams.set("offset", String(offset));

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return {
      records: [],
      total: 0,
      error: "Could not reach the OAPEN server.",
    };
  }

  if (!response.ok) {
    return {
      records: [],
      total: 0,
      error: `OAPEN returned HTTP ${response.status}.`,
    };
  }

  let items: DSpaceItem[];
  try {
    items = (await response.json()) as DSpaceItem[];
  } catch {
    return { records: [], total: 0, error: "Invalid JSON from OAPEN." };
  }

  const active  = items.filter((i) => i.withdrawn !== "true");
  const records = active.map(mapOapenItem);
  const total   =
    records.length < limit
      ? offset + records.length
      : offset + records.length + limit;

  return { records, total, error: null };
}
