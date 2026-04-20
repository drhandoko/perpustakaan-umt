/**
 * DOAB (Directory of Open Access Books) fetcher.
 *
 * Calls the DOAB DSpace 5 REST API server-side and maps each item to
 * the canonical BookRecord shape.
 *
 * API base : https://directory.doabooks.org/rest/
 * No authentication required.
 *
 * DOAB-specific metadata keys used here:
 *   dc.title                 — book title
 *   dc.contributor.author    — author names
 *   dc.contributor.editor    — editor names (fallback)
 *   dc.date.issued           — publication year
 *   dc.publisher             — publisher name (sometimes missing, use publisher.name)
 *   dc.language              — ISO language code
 *   dc.rights                — license string / CC URL
 *   dc.identifier            — may contain ISBN
 *   dc.identifier.uri        — canonical handle URL
 *   dc.description.abstract  — abstract
 *   dc.subject.classification, dc.subject.other — subject terms
 *   oapen.identifier.doi     — DOI (shared key with OAPEN)
 *   publisher.name           — publisher name (preferred over dc.publisher)
 */

import type { BookRecord, DSpaceItem } from "./types.js";
import {
  metaFirst, metaValues,
  normalizeLanguage, normalizeLicense, normalizeDoi, normalizeIsbn,
} from "./types.js";

const DOAB_REST = "https://directory.doabooks.org/rest";

// ─── Raw response type ────────────────────────────────────────────────────────

export interface DoabFetchResult {
  records: BookRecord[];
  /** Estimated total. DOAB returns no total field — we approximate from page fill. */
  total: number;
  error: string | null;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapDoabItem(item: DSpaceItem): BookRecord {
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

  // Publisher: prefer publisher.name, then dc.publisher
  const publisher =
    metaFirst(m, "publisher.name") ??
    metaFirst(m, "dc.publisher") ??
    "Not available";

  // Language
  const language = normalizeLanguage(
    metaFirst(m, "dc.language") ?? metaFirst(m, "dc.language.iso")
  );

  // License
  const license = normalizeLicense(
    metaFirst(m, "dc.rights") ??
    metaFirst(m, "publisher.oalicense")
  );

  // DOI
  const doi = normalizeDoi(metaFirst(m, "oapen.identifier.doi") ?? metaFirst(m, "dc.identifier.doi"));

  // ISBN — dc.identifier can hold ISBN or other identifiers; filter by format
  const isbnRaw = metaValues(m, "dc.identifier").find(
    (v) => /^(978|979)\d{10}$/.test(v.replace(/[- ]/g, ""))
  );
  const isbn = normalizeIsbn(isbnRaw);

  // Source URL: prefer canonical handle page, then DOI
  const handleUrl = item.handle
    ? `https://directory.doabooks.org/handle/${item.handle}`
    : null;
  const sourceUrl =
    handleUrl ?? (doi ? `https://doi.org/${doi}` : "https://directory.doabooks.org");

  // Abstract
  const abstract = metaFirst(m, "dc.description.abstract");

  // Subjects
  const subjects = [
    ...metaValues(m, "dc.subject.classification"),
    ...metaValues(m, "dc.subject.other"),
  ].slice(0, 5);

  return {
    id: `doab-${item.uuid}`,
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
    source: "DOAB",
    license,
    language,
    abstract,
    subjects: subjects.length > 0 ? subjects : undefined,
  };
}

// ─── Public fetch function ────────────────────────────────────────────────────

/**
 * Search DOAB for open-access books.
 *
 * @param query    Free-text keyword(s).
 * @param limit    Results per page.
 * @param offset   Zero-based result offset.
 */
export async function fetchDoab(
  query: string,
  limit: number,
  offset: number
): Promise<DoabFetchResult> {
  const url = new URL(`${DOAB_REST}/search`);
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
  } catch (err) {
    return {
      records: [],
      total: 0,
      error: "Could not reach the DOAB server.",
    };
  }

  if (!response.ok) {
    return {
      records: [],
      total: 0,
      error: `DOAB returned HTTP ${response.status}.`,
    };
  }

  let items: DSpaceItem[];
  try {
    items = (await response.json()) as DSpaceItem[];
  } catch {
    return { records: [], total: 0, error: "Invalid JSON from DOAB." };
  }

  const active  = items.filter((i) => i.withdrawn !== "true");
  const records = active.map(mapDoabItem);
  const total   =
    records.length < limit
      ? offset + records.length
      : offset + records.length + limit;

  return { records, total, error: null };
}
