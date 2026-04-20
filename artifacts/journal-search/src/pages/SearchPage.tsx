/**
 * Main search page — Universitas Murni Teguh library portal.
 *
 * Search flow:
 *  1. User types a keyword and clicks Search (or presses Enter).
 *  2. searchDoaj() calls the DOAJ public API (no key required).
 *  3. The returned Article[] is stored in state.
 *  4. applyFilters() runs client-side on those results using the sidebar values.
 *  5. The filtered list is passed to ResultsArea for display.
 */

import { useState, useCallback, useMemo } from "react";
import { SearchBar } from "../components/SearchBar";
import { FilterSidebar } from "../components/FilterSidebar";
import { ResultsArea } from "../components/ResultsArea";
import { searchDoaj } from "../lib/doajApi";
import { applyFilters } from "../lib/search";
import type { SearchFilters } from "../lib/search";
import type { Article } from "../data/mockArticles";

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  source: "All",
  yearFrom: "",
  yearTo: "",
  language: "All",
  license: "All",
};

export function SearchPage() {
  // Keyword currently typed in the search box
  const [inputQuery, setInputQuery] = useState("");

  // Sidebar filter state (applied client-side after results arrive)
  const [sidebarFilters, setSidebarFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);

  // Raw articles returned by the last API call (unfiltered)
  const [rawResults, setRawResults] = useState<Article[]>([]);

  // Total count from the DOAJ API (before client-side filtering)
  const [apiTotal, setApiTotal] = useState(0);

  // Whether the user has triggered at least one search
  const [hasSearched, setHasSearched] = useState(false);

  // Loading and error states for the API call
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Trigger DOAJ search ────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const trimmed = inputQuery.trim();

    // Require at least one character before calling the API
    if (!trimmed) {
      setError("Please enter a search term.");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const { articles, total } = await searchDoaj(trimmed);
      setRawResults(articles);
      setApiTotal(total);
    } catch (err) {
      // Show the error message from the API client
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setRawResults([]);
      setApiTotal(0);
    } finally {
      setLoading(false);
    }
  }, [inputQuery]);

  // ── Reset everything ───────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setInputQuery("");
    setSidebarFilters(DEFAULT_FILTERS);
    setRawResults([]);
    setApiTotal(0);
    setHasSearched(false);
    setLoading(false);
    setError(null);
  }, []);

  // ── Update sidebar filters ─────────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (updated: Partial<Omit<SearchFilters, "query">>) => {
      setSidebarFilters((prev) => ({ ...prev, ...updated }));
    },
    []
  );

  // ── Apply client-side filters to the API results ──────────────────────────
  // Memoised so it only recalculates when rawResults or sidebarFilters change.
  const filteredResults = useMemo(
    () => applyFilters(rawResults, { query: inputQuery, ...sidebarFilters }),
    [rawResults, sidebarFilters, inputQuery]
  );

  return (
    <main className="flex-1 flex min-h-0" data-testid="search-page">
      {/* Left sidebar filters */}
      <FilterSidebar
        filters={{ ...sidebarFilters, query: inputQuery }}
        onChange={handleFilterChange}
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

          {/* Disclaimer */}
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
