/**
 * Main search page — Universitas Murni Teguh library portal.
 *
 * Source selection & filter state are split in two:
 *   pending*   — what the user sees / edits in the sidebar right now
 *   applied*   — the last committed snapshot; drives the search and filtering
 *
 * Results only change when the user clicks "Apply Filters" in the sidebar,
 * or when they submit a new keyword search.
 *
 * When sources change and there is already an active search, clicking
 * "Apply Filters" re-runs the API calls with the newly selected sources.
 */

import { useState, useCallback, useMemo, useRef } from "react";
import { SearchBar } from "../components/SearchBar";
import { FilterSidebar } from "../components/FilterSidebar";
import { ResultsArea } from "../components/ResultsArea";
import { searchDoaj } from "../lib/doajApi";
import { searchCrossref } from "../lib/crossrefApi";
import {
  applyFilters,
  mergeAndDeduplicate,
  sourcesAreEqual,
} from "../lib/search";
import type { SearchFilters, SourceSelection } from "../lib/search";
import type { Article } from "../data/mockArticles";

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: Omit<SearchFilters, "query"> = {
  yearFrom: "",
  yearTo: "",
  language: "All",
  license: "All",
};

const DEFAULT_SOURCES: SourceSelection = {
  doaj: true,
  crossref: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filtersAreEqual(
  a: Omit<SearchFilters, "query">,
  b: Omit<SearchFilters, "query">
): boolean {
  return (
    a.yearFrom === b.yearFrom &&
    a.yearTo   === b.yearTo   &&
    a.language === b.language &&
    a.license  === b.license
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchPage() {
  const [inputQuery, setInputQuery] = useState("");

  // Sidebar filter values — updated as the user changes selections
  const [pendingFilters, setPendingFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);

  // Last committed snapshot — only updated on "Apply Filters" click
  const [appliedFilters, setAppliedFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);

  // Source selection — which APIs to query
  const [pendingSources, setPendingSources] = useState<SourceSelection>(DEFAULT_SOURCES);
  const [appliedSources, setAppliedSources] = useState<SourceSelection>(DEFAULT_SOURCES);

  // Raw articles returned by the last API call(s)
  const [rawResults, setRawResults] = useState<Article[]>([]);
  const [apiTotal, setApiTotal] = useState(0);

  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest query string for re-searches triggered by Apply Filters
  const lastQueryRef = useRef<string>("");

  // ── Core search executor — runs with specified sources ─────────────────────
  const runSearch = useCallback(
    async (query: string, sources: SourceSelection) => {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      lastQueryRef.current = query;

      try {
        const calls: Promise<{ articles: Article[]; total: number }>[] = [];
        if (sources.doaj)     calls.push(searchDoaj(query));
        if (sources.crossref) calls.push(searchCrossref(query));

        const settled = await Promise.allSettled(calls);

        let doajArticles: Article[] = [];
        let crossrefArticles: Article[] = [];
        const errors: string[] = [];

        // Map settled results back to their source
        let callIndex = 0;
        if (sources.doaj) {
          const result = settled[callIndex++];
          if (result.status === "fulfilled") doajArticles = result.value.articles;
          else errors.push(`DOAJ: ${(result.reason as Error).message}`);
        }
        if (sources.crossref) {
          const result = settled[callIndex++];
          if (result.status === "fulfilled") crossrefArticles = result.value.articles;
          else errors.push(`Crossref: ${(result.reason as Error).message}`);
        }

        // If every call failed, surface the errors
        if (errors.length > 0 && doajArticles.length === 0 && crossrefArticles.length === 0) {
          throw new Error(errors.join(" | "));
        }

        const merged = mergeAndDeduplicate(doajArticles, crossrefArticles);
        const total = doajArticles.length + crossrefArticles.length;

        setRawResults(merged);
        setApiTotal(total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
        setRawResults([]);
        setApiTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ── Keyword search (from SearchBar) ───────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const trimmed = inputQuery.trim();
    if (!trimmed) {
      setError("Please enter a search term.");
      return;
    }
    await runSearch(trimmed, appliedSources);
  }, [inputQuery, appliedSources, runSearch]);

  // ── Reset everything ──────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setInputQuery("");
    setPendingFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPendingSources(DEFAULT_SOURCES);
    setAppliedSources(DEFAULT_SOURCES);
    setRawResults([]);
    setApiTotal(0);
    setHasSearched(false);
    setLoading(false);
    setError(null);
    lastQueryRef.current = "";
  }, []);

  // ── Sidebar filter edits (updates pending only) ───────────────────────────
  const handleFilterChange = useCallback(
    (updated: Partial<Omit<SearchFilters, "query">>) => {
      setPendingFilters((prev) => ({ ...prev, ...updated }));
    },
    []
  );

  // ── Source checkbox edits (updates pending only) ──────────────────────────
  const handleSourceChange = useCallback((updated: Partial<SourceSelection>) => {
    setPendingSources((prev) => ({ ...prev, ...updated }));
  }, []);

  // ── Apply Filters — commit pending → applied ──────────────────────────────
  const handleApplyFilters = useCallback(async () => {
    const sourcesChanged = !sourcesAreEqual(pendingSources, appliedSources);

    // Commit both filter sets
    setAppliedFilters({ ...pendingFilters });
    setAppliedSources({ ...pendingSources });

    // If sources changed and there's an active search, re-run with new sources
    if (sourcesChanged && hasSearched && lastQueryRef.current) {
      await runSearch(lastQueryRef.current, pendingSources);
    }
  }, [pendingFilters, pendingSources, appliedSources, hasSearched, runSearch]);

  // ── Dirty flag — true when any pending value differs from applied ──────────
  const filtersDirty =
    !filtersAreEqual(pendingFilters, appliedFilters) ||
    !sourcesAreEqual(pendingSources, appliedSources);

  // ── Client-side filtering on top of raw API results ───────────────────────
  const filteredResults = useMemo(
    () => applyFilters(rawResults, { query: inputQuery, ...appliedFilters }),
    [rawResults, appliedFilters, inputQuery]
  );

  return (
    <main className="flex-1 flex min-h-0" data-testid="search-page">
      {/* Left sidebar */}
      <FilterSidebar
        filters={{ ...pendingFilters, query: inputQuery }}
        sources={pendingSources}
        dirty={filtersDirty}
        onChange={handleFilterChange}
        onSourceChange={handleSourceChange}
        onApply={handleApplyFilters}
      />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background">
        {/* Sticky search area */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-8 py-6">
          <SearchBar
            value={inputQuery}
            onChange={setInputQuery}
            onSearch={handleSearch}
            onReset={handleReset}
            loading={loading}
          />
          <p
            className="mt-3 text-xs text-muted-foreground leading-relaxed"
            data-testid="text-disclaimer"
          >
            <span className="font-medium text-foreground/60">Disclaimer:</span>{" "}
            Results are indexed from external open-access sources. Full text
            remains hosted by the original publisher or repository.
          </p>
        </div>

        {/* Results */}
        <div className="px-8 py-8">
          <ResultsArea
            articles={filteredResults}
            hasSearched={hasSearched}
            loading={loading}
            error={error}
            apiTotal={apiTotal}
          />
        </div>
      </div>
    </main>
  );
}
