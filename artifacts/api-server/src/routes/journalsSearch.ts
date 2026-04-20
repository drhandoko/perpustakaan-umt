/**
 * Journals search route.
 *
 * Fetches open-access journals from DOAJ, then enriches each result with a
 * citation impact tier derived from OpenAlex via a single batch request.
 *
 * ENDPOINT
 *   GET /api/journals-search
 *
 * QUERY PARAMETERS
 *   q        {string}   Required. Free-text search term(s).
 *   page     {number}   Page number (default 1, min 1).
 *   pageSize {number}   Results per page (default 25, max 50).
 *
 * RESPONSE
 *   { articles: JournalResult[]; total: number }
 *
 * RANKING SOURCE
 *   OpenAlex (https://openalex.org) — free scholarly metadata index.
 *   Metric: summary_stats.2yr_mean_citedness (≈ 2-year Journal Impact Factor).
 *   SJR (scimagojr.com) blocks all automated access; OpenAlex JIF is the
 *   closest freely available proxy and is clearly labelled in every result.
 */

import { Router, type Request, type Response } from "express";
import { logger }              from "../lib/logger.js";
import { batchLookupIssns, normaliseIssn } from "../lib/ranking/openAlexEnricher.js";
import { mapJifToTier }        from "../lib/ranking/quartileMapper.js";

const router = Router();

// ─── DOAJ types ───────────────────────────────────────────────────────────────

interface DoajSubject    { term?: string; scheme?: string; code?: string }
interface DoajLicense   { type?: string }
interface DoajPublisher { name?: string; country?: string }
interface DoajRef       { journal?: string }

interface DoajBibjson {
  title?:     string;
  publisher?: DoajPublisher;
  subject?:   DoajSubject[];
  language?:  string[];
  eissn?:     string;
  pissn?:     string;
  ref?:       DoajRef;
  article?:   { license?: DoajLicense[] };
  editorial?: { country?: string };
}

interface DoajRecord   { id: string; bibjson: DoajBibjson }
interface DoajResponse { total: number; page: number; pageSize: number; results: DoajRecord[] }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  EN: "English", ID: "Indonesian", ES: "Spanish", FR: "French",
  DE: "German",  PT: "Portuguese", ZH: "Chinese",  AR: "Arabic",
  IT: "Italian", JA: "Japanese",   RU: "Russian",
};

function normLang(raw: string | undefined): string {
  if (!raw) return "Not available";
  return LANG_MAP[raw.toUpperCase()] ?? raw;
}

function normLicense(raw: string | undefined): string | null {
  if (!raw) return null;
  const u = raw.toUpperCase();
  if (u.includes("CC BY-NC-ND")) return "CC BY-NC-ND 4.0";
  if (u.includes("CC BY-NC-SA")) return "CC BY-NC-SA 4.0";
  if (u.includes("CC BY-NC"))    return "CC BY-NC 4.0";
  if (u.includes("CC BY-SA"))    return "CC BY-SA 4.0";
  if (u.includes("CC BY-ND"))    return "CC BY-ND 4.0";
  if (u.includes("CC BY"))       return "CC BY 4.0";
  return null;
}

// ─── Route handler ────────────────────────────────────────────────────────────

router.get("/journals-search", async (req: Request, res: Response) => {
  const query = (req.query["q"] as string | undefined)?.trim();
  if (!query) {
    res.status(400).json({ error: "Missing required query parameter: q" });
    return;
  }

  const page     = Math.max(Number(req.query["page"]     ?? 1),  1);
  const pageSize = Math.min(Number(req.query["pageSize"] ?? 25), 50);

  logger.info({ query, page, pageSize }, "Journals-search request");

  // ── 1. Fetch from DOAJ ──────────────────────────────────────────────────────

  const doajUrl =
    `https://doaj.org/api/v3/search/journals/${encodeURIComponent(query)}` +
    `?pageSize=${pageSize}&page=${page}`;

  let doajData: DoajResponse;
  try {
    const resp = await fetch(doajUrl, { headers: { Accept: "application/json" } });
    if (!resp.ok) throw new Error(`DOAJ HTTP ${resp.status}`);
    doajData = (await resp.json()) as DoajResponse;
  } catch (err) {
    logger.error({ err }, "DOAJ fetch failed");
    res.status(502).json({ error: "Could not reach DOAJ. Please try again." });
    return;
  }

  const records = Array.isArray(doajData.results) ? doajData.results : [];

  // ── 2. Collect ISSNs and run one OpenAlex batch request ─────────────────────

  const issnList: string[] = [];
  for (const rec of records) {
    if (rec.bibjson.eissn) issnList.push(rec.bibjson.eissn);
    if (rec.bibjson.pissn) issnList.push(rec.bibjson.pissn);
  }
  const impactMap = await batchLookupIssns(issnList);

  // ── 3. Normalise records and attach quartile ─────────────────────────────────

  const articles = records.map((rec, idx) => {
    const bib = rec.bibjson;

    // Prefer eissn for OpenAlex lookup, fall back to pissn
    const eKey   = bib.eissn ? normaliseIssn(bib.eissn) : null;
    const pKey   = bib.pissn ? normaliseIssn(bib.pissn) : null;
    const impact =
      (eKey && impactMap.get(eKey)) ??
      (pKey && impactMap.get(pKey)) ??
      null;

    const tier          = impact ? mapJifToTier(impact.jif) : null;
    const journalQuartile = tier ?? "Unranked";
    const rankingSource   = impact ? "OpenAlex" : "None";

    const subjects = (bib.subject ?? [])
      .map((s) => s.term)
      .filter((t): t is string => !!t);

    const publisherName = bib.publisher?.name ?? "Not available";
    const country       = bib.publisher?.country ?? bib.editorial?.country;
    const language      = normLang(bib.language?.[0]);
    const license       = normLicense(bib.article?.license?.[0]?.type);
    const sourceUrl     =
      bib.ref?.journal ??
      (rec.id ? `https://doaj.org/toc/${rec.id}` : "https://doaj.org");

    return {
      id:             rec.id || `doaj-${idx}`,
      contentType:    "journal" as const,
      title:          bib.title ?? "Not available",
      authors:        [] as string[],
      journal:        publisherName,
      year:           0,
      doi:            null,
      sourceUrl,
      pdfUrl:         null,
      source:         "DOAJ",
      license,
      language,
      publisher:      publisherName,
      subjects:       subjects.length > 0 ? subjects : undefined,
      country,
      issn:           bib.pissn ?? undefined,
      eissn:          bib.eissn ?? undefined,
      journalQuartile,
      rankingSource,
    };
  });

  logger.info(
    {
      total:    doajData.total,
      returned: articles.length,
      enriched: articles.filter((a) => a.rankingSource === "OpenAlex").length,
    },
    "Journals-search complete"
  );

  res.json({ articles, total: doajData.total });
});

export default router;
