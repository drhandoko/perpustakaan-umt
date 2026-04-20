/**
 * OpenAlex journal impact enricher.
 *
 * Batch-fetches citation impact data from OpenAlex for a list of ISSNs.
 * A single API request covers all ISSNs from one DOAJ search page (≤ 50),
 * keeping added latency to one extra HTTP round-trip per search.
 *
 * OpenAlex API reference: https://docs.openalex.org/api-entities/sources
 * Free for < 100k requests/day; no API key required.
 *
 * The field used is `summary_stats.2yr_mean_citedness`, which is OpenAlex's
 * implementation of the 2-year Journal Impact Factor (JIF).  It is the closest
 * freely accessible proxy for SJR quartile, which is not available via a
 * public API (scimagojr.com blocks automated access).
 */

export interface OpenAlexImpact {
  /** 2-year mean citedness ≈ Journal Impact Factor */
  jif: number;
  hIndex: number;
}

/** Normalise ISSN to lowercase digits only — used as map key. */
export function normaliseIssn(raw: string): string {
  return raw.toLowerCase().replace(/[^0-9x]/g, "");
}

/**
 * Looks up citation impact for each ISSN in a single batched OpenAlex call.
 *
 * @param issns  Raw ISSN strings (with or without hyphens) from DOAJ records.
 * @returns      Map of normalised-ISSN → impact.  Missing ISSNs are absent.
 */
export async function batchLookupIssns(
  issns: string[]
): Promise<Map<string, OpenAlexImpact>> {
  const uniqueRaw = [...new Set(issns.filter(Boolean))];
  if (uniqueRaw.length === 0) return new Map();

  // OpenAlex OR filter: issn:X|Y|Z  (not issn:X|issn:Y — that is cross-field OR)
  const filter = `issn:${uniqueRaw.join("|")}`;
  const url =
    `https://api.openalex.org/sources` +
    `?filter=${encodeURIComponent(filter)}` +
    `&select=issn,summary_stats` +
    `&per_page=100`;

  try {
    const resp = await fetch(url, {
      headers: {
        Accept: "application/json",
        // OpenAlex "polite pool" — faster response when an email is provided.
        "User-Agent": "LibrarySearchPortal/1.0 (mailto:admin@perpustakaan.example)",
      },
    });
    if (!resp.ok) return new Map();

    const json = (await resp.json()) as {
      results: {
        issn: string[];
        summary_stats: { "2yr_mean_citedness": number; h_index: number };
      }[];
    };

    const result = new Map<string, OpenAlexImpact>();
    for (const source of json.results ?? []) {
      const stats = source.summary_stats;
      if (!stats) continue;
      const impact: OpenAlexImpact = {
        jif:    stats["2yr_mean_citedness"] ?? 0,
        hIndex: stats.h_index              ?? 0,
      };
      for (const issn of source.issn ?? []) {
        result.set(normaliseIssn(issn), impact);
      }
    }
    return result;
  } catch {
    // Network error or unparseable response — silently return empty so the
    // search still works, just without quartile enrichment.
    return new Map();
  }
}
