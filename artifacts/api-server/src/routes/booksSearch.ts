/**
 * Books search aggregator route.
 *
 * Orchestrates parallel fetches from all requested book sources, normalises
 * each result through the source-specific fetcher, deduplicates the combined
 * set, and returns a single JSON response to the frontend.
 *
 * ENDPOINT
 *   GET /api/books-search
 *
 * QUERY PARAMETERS
 *   q        {string}   Required. Free-text search keyword(s).
 *   sources  {string}   Comma-separated list of active sources (default: "doab,oapen").
 *                       Supported: "doab", "oapen".
 *                       Unknown source tokens are silently ignored.
 *   limit    {number}   Results per page per source (default 25, max 50).
 *   offset   {number}   Zero-based offset per source (default 0).
 *
 * RESPONSE (JSON)
 *   {
 *     articles : BookRecord[]              // normalised, deduplicated books
 *     total    : number                    // estimated combined total
 *     sourceStatus : {                     // per-source fetch outcome
 *       [source: string]: { count: number; error: string | null }
 *     }
 *   }
 *
 * PLANNED SOURCES (not yet implemented — return empty with status)
 *   "orl"   — Open Research Library
 *   "muse"  — Project MUSE Open Access Books
 *
 * Each source is fetched server-side to avoid browser CORS restrictions.
 */

import { Router, type Request, type Response } from "express";
import { logger }             from "../lib/logger.js";
import { fetchDoab }          from "../lib/books/doabFetcher.js";
import { fetchOapen }         from "../lib/books/oapenFetcher.js";
import { deduplicateBooks }   from "../lib/books/deduplicate.js";
import type { BookRecord }    from "../lib/books/types.js";

const router = Router();

// ─── Supported sources ────────────────────────────────────────────────────────

type SourceKey = "doab" | "oapen";

const ACTIVE_SOURCES   = new Set<SourceKey>(["doab", "oapen"]);
const PLANNED_SOURCES  = new Set<string>(["orl", "muse"]);  // stubs

// ─── Per-source status in the response ───────────────────────────────────────

interface SourceStatus {
  count: number;
  error: string | null;
}

// ─── Route handler ────────────────────────────────────────────────────────────

router.get("/books-search", async (req: Request, res: Response) => {
  const query = (req.query["q"] as string | undefined)?.trim();

  if (!query) {
    res.status(400).json({ error: "Missing required query parameter: q" });
    return;
  }

  // Parse and validate requested sources
  const rawSources = (req.query["sources"] as string | undefined) ?? "doab,oapen";
  const requestedSources = rawSources
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  const activeSources = requestedSources.filter((s): s is SourceKey =>
    ACTIVE_SOURCES.has(s as SourceKey)
  );
  const plannedSources = requestedSources.filter((s) => PLANNED_SOURCES.has(s));

  // Per-source pagination: each source gets its own offset
  const limitPerSource = Math.min(Number(req.query["limit"] ?? 25), 50);
  const offset         = Math.max(Number(req.query["offset"] ?? 0), 0);

  logger.info({ query, activeSources, limitPerSource, offset }, "Books-search request");

  // ── Fetch all active sources in parallel ────────────────────────────────────
  const fetches = await Promise.all(
    activeSources.map(async (source) => {
      if (source === "doab")  return { source, result: await fetchDoab(query, limitPerSource, offset) };
      if (source === "oapen") return { source, result: await fetchOapen(query, limitPerSource, offset) };
      // This should never be reached given the filter above
      return { source, result: { records: [] as BookRecord[], total: 0, error: "Unknown source." } };
    })
  );

  // ── Collect results and build status map ────────────────────────────────────
  const allRecords: BookRecord[]                          = [];
  const sourceStatus: Record<string, SourceStatus> = {};
  let combinedTotal = 0;

  for (const { source, result } of fetches) {
    sourceStatus[source] = { count: result.records.length, error: result.error };
    allRecords.push(...result.records);
    combinedTotal += result.total;
  }

  // Planned sources appear in status with a clear indicator
  for (const s of plannedSources) {
    sourceStatus[s] = { count: 0, error: "Source not yet implemented." };
  }

  // ── Interleave results from different sources before deduplication ──────────
  // Interleaving gives a balanced mix (DOAB[0], OAPEN[0], DOAB[1], OAPEN[1], …)
  // rather than all DOAB records followed by all OAPEN records.
  const sourceGroups: Record<string, BookRecord[]> = {};
  for (const record of allRecords) {
    if (!sourceGroups[record.source]) sourceGroups[record.source] = [];
    sourceGroups[record.source].push(record);
  }

  const interleaved: BookRecord[] = [];
  const groups = Object.values(sourceGroups);
  const maxLen  = Math.max(...groups.map((g) => g.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const group of groups) {
      if (i < group.length) interleaved.push(group[i]);
    }
  }

  // ── Deduplicate ─────────────────────────────────────────────────────────────
  const deduplicated = deduplicateBooks(interleaved);

  logger.info(
    { total: combinedTotal, beforeDedup: interleaved.length, afterDedup: deduplicated.length },
    "Books-search results"
  );

  res.json({
    articles:     deduplicated,
    total:        combinedTotal,
    sourceStatus,
  });
});

export default router;
