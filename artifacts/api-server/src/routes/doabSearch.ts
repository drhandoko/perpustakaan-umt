/**
 * DOAB (Directory of Open Access Books) proxy route.
 *
 * WHY A PROXY?
 *   The DOAB DSpace REST API (https://directory.doabooks.org/rest/) does not
 *   return Access-Control-Allow-Origin headers, so browsers block direct fetch
 *   requests (CORS policy).  Running the fetch here on the server avoids that
 *   restriction entirely.
 *
 * ENDPOINT
 *   GET /api/doab-search
 *
 * QUERY PARAMETERS
 *   q       {string}  Required. Free-text search keyword(s).
 *   limit   {number}  Optional. Results per page (default 25, max 100).
 *   offset  {number}  Optional. Zero-based result offset (default 0).
 *
 * RESPONSE (JSON)
 *   {
 *     articles : Article[]   // normalised book records
 *     total    : number      // estimated total (DOAB has no true total field)
 *   }
 *
 * The Article shape matches what the frontend renders for contentType = "book".
 *
 * DOAB API DOCS
 *   https://directory.doabooks.org/rest/  (DSpace 5 REST API)
 */

import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();

// ─── DOAB REST API base URL ───────────────────────────────────────────────────

const DOAB_BASE = "https://directory.doabooks.org/rest";

// ─── Internal DOAB types ──────────────────────────────────────────────────────

/** A single metadata field returned by the DSpace REST API. */
interface DoabMetadataField {
  key: string;
  value: string;
  language: string | null;
  schema: string;
  element: string;
  qualifier: string | null;
}

/** A single item (book record) returned by the DOAB search endpoint. */
interface DoabItem {
  uuid: string;
  name: string;           // Fallback title (same as dc.title usually)
  handle: string;         // e.g. "20.500.12854/146789" — used to build the URL
  type: string;
  withdrawn: string;      // "true" | "false"  (note: string, not boolean)
  archived: string;
  metadata: DoabMetadataField[];
}

// ─── Normalised Article shape (subset sent to frontend) ───────────────────────
//
// The frontend `Article` type lives in journal-search/src/data/mockArticles.ts.
// We replicate the subset we actually fill in; extra fields are optional so
// the compiler is happy on both ends.

interface BookArticle {
  id: string;
  contentType: "book";
  title: string;
  authors: string[];
  journal: string;         // Publisher (reused as journal for display purposes)
  year: number;
  doi: string | null;
  sourceUrl: string;
  pdfUrl: null;
  source: string;
  license: string | null;
  language: string;
  abstract?: string;
  publisher?: string;
  subjects?: string[];
}

// ─── Metadata extraction helpers ──────────────────────────────────────────────

/** Collect all metadata values for a given key. */
function metaValues(fields: DoabMetadataField[], key: string): string[] {
  return fields.filter((f) => f.key === key).map((f) => f.value.trim()).filter(Boolean);
}

/** Return the first metadata value for a given key, or undefined. */
function metaFirst(fields: DoabMetadataField[], key: string): string | undefined {
  return metaValues(fields, key)[0];
}

// ─── Language code → display name ─────────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  en: "English", eng: "English",
  es: "Spanish", spa: "Spanish",
  fr: "French",  fre: "French",  fra: "French",
  de: "German",  ger: "German",  deu: "German",
  pt: "Portuguese", por: "Portuguese",
  zh: "Chinese", chi: "Chinese", zho: "Chinese",
  ar: "Arabic",  ara: "Arabic",
  it: "Italian", ita: "Italian",
  ja: "Japanese", jpn: "Japanese",
  ru: "Russian", rus: "Russian",
  id: "Indonesian", ind: "Indonesian",
  nl: "Dutch",   nld: "Dutch",
  pl: "Polish",  pol: "Polish",
  tr: "Turkish", tur: "Turkish",
};

function normalizeLanguage(code: string | undefined): string {
  if (!code) return "Not available";
  return LANG_MAP[code.toLowerCase()] ?? code;
}

// ─── License URL → display label ──────────────────────────────────────────────

const LICENSE_PATTERNS: Array<[RegExp, string]> = [
  [/by-nc-nd/i, "CC BY-NC-ND 4.0"],
  [/by-nc-sa/i, "CC BY-NC-SA 4.0"],
  [/by-nc/i,    "CC BY-NC 4.0"],
  [/by-sa/i,    "CC BY-SA 4.0"],
  [/by-nd/i,    "CC BY-ND 4.0"],
  [/\bby\b/i,   "CC BY 4.0"],
];

function normalizeLicense(raw: string | undefined): string | null {
  if (!raw) return null;
  for (const [pattern, label] of LICENSE_PATTERNS) {
    if (pattern.test(raw)) return label;
  }
  return raw.trim() || null;
}

// ─── DOI normalisation ────────────────────────────────────────────────────────

function normalizeDoi(raw: string | undefined): string | null {
  if (!raw) return null;
  return raw.trim()
    .replace(/^https?:\/\/doi\.org\//i, "")
    .replace(/^doi:/i, "")
    .trim() || null;
}

// ─── Map one DOAB item to the BookArticle shape ───────────────────────────────

function mapDoabItem(item: DoabItem): BookArticle {
  const m = item.metadata ?? [];

  // Title: prefer dc.title, fall back to the item's name field
  const title = metaFirst(m, "dc.title") ?? item.name ?? "Not available";

  // Authors: try dc.contributor.author, then dc.contributor.editor
  const authorValues = metaValues(m, "dc.contributor.author");
  const editorValues = metaValues(m, "dc.contributor.editor");
  const authors = authorValues.length > 0 ? authorValues : editorValues;

  // Year: dc.date.issued is usually "YYYY" or "YYYY-MM-DD"
  const issuedRaw = metaFirst(m, "dc.date.issued");
  const year = issuedRaw ? parseInt(issuedRaw.slice(0, 4), 10) || 0 : 0;

  // Publisher
  const publisher = metaFirst(m, "dc.publisher");

  // Language (ISO 639-2 or 639-1 code)
  const langCode = metaFirst(m, "dc.language") ?? metaFirst(m, "dc.language.iso");
  const language = normalizeLanguage(langCode);

  // License
  const licenseRaw = metaFirst(m, "dc.rights") ?? metaFirst(m, "dc.rights.license");
  const license = normalizeLicense(licenseRaw);

  // DOI: check dc.identifier.doi or doab.identifier.doi
  const doiRaw =
    metaFirst(m, "dc.identifier.doi") ??
    metaFirst(m, "doab.identifier.doi");
  const doi = normalizeDoi(doiRaw);

  // Source URL: prefer the canonical handle page, then the doi resolver
  const handleUrl = item.handle
    ? `https://directory.doabooks.org/handle/${item.handle}`
    : null;
  const sourceUrl = handleUrl ?? (doi ? `https://doi.org/${doi}` : "https://directory.doabooks.org");

  // Abstract
  const abstract = metaFirst(m, "dc.description.abstract");

  // Subjects
  const subjects = metaValues(m, "dc.subject")
    .concat(metaValues(m, "dc.subject.classification"))
    .slice(0, 5);

  return {
    id: `doab-${item.uuid}`,
    contentType: "book",
    title,
    authors: authors.length > 0 ? authors : ["Not available"],
    journal: publisher ?? "Not available",   // displayed as publisher
    year,
    doi,
    sourceUrl,
    pdfUrl: null,
    source: "DOAB",
    license,
    language,
    abstract,
    publisher,
    subjects: subjects.length > 0 ? subjects : undefined,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

router.get("/doab-search", async (req: Request, res: Response) => {
  const query = (req.query["q"] as string | undefined)?.trim();

  if (!query) {
    res.status(400).json({ error: "Missing required query parameter: q" });
    return;
  }

  const limit  = Math.min(Number(req.query["limit"]  ?? 25),  100);
  const offset = Math.max(Number(req.query["offset"] ?? 0),     0);

  // Build the DOAB search URL (server-side — no CORS issues here)
  const doabUrl = new URL(`${DOAB_BASE}/search`);
  doabUrl.searchParams.set("query",   query);
  doabUrl.searchParams.set("expand",  "metadata");
  doabUrl.searchParams.set("limit",   String(limit));
  doabUrl.searchParams.set("offset",  String(offset));

  logger.info({ query, limit, offset }, "Proxying DOAB search request");

  let doabResponse: Response;
  try {
    doabResponse = await fetch(doabUrl.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000), // 15-second timeout
    });
  } catch (err) {
    logger.error({ err }, "DOAB fetch failed");
    res.status(502).json({
      error: "Could not reach the DOAB server. Please try again later.",
    });
    return;
  }

  if (!doabResponse.ok) {
    logger.warn({ status: doabResponse.status }, "DOAB returned non-200");
    res.status(502).json({
      error: `DOAB server returned HTTP ${doabResponse.status}.`,
    });
    return;
  }

  let items: DoabItem[];
  try {
    items = (await doabResponse.json()) as DoabItem[];
  } catch (err) {
    logger.error({ err }, "Failed to parse DOAB JSON");
    res.status(502).json({ error: "Received an invalid response from DOAB." });
    return;
  }

  // Filter out withdrawn items before mapping
  const activeItems = items.filter((item) => item.withdrawn !== "true");
  const articles    = activeItems.map(mapDoabItem);

  // DOAB has no "total results" field in its response — we estimate:
  //   • If we got fewer items than requested, we're on the last page.
  //   • If we got a full page, there are likely more results; add one full
  //     page to the running total so pagination shows a "Next" button.
  const total =
    articles.length < limit
      ? offset + articles.length          // last page — exact count
      : offset + articles.length + limit; // more pages likely remain

  logger.info({ count: articles.length, total }, "DOAB proxy returning results");

  res.json({ articles, total });
});

export default router;
