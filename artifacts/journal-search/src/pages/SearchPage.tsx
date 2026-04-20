/**
 * Main search page — Universitas Murni Teguh library portal.
 *
 * Filter state is split in two:
 *   pendingFilters  — what the user sees / edits in the sidebar right now
 *   appliedFilters  — the last committed snapshot; drives applyFilters()
 *
 * Results only change when the user clicks "Apply Filters" in the sidebar.
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

/** Returns true when two filter objects have different values */
function filtersAreEqual(a: SearchFilters, b: SearchFilters): boolean {
  return (
    a.yearFrom === b.yearFrom &&
    a.yearTo   === b.yearTo   &&
    a.language === b.language &&
    a.license  === b.license
  );
}

export function SearchPage() {
  // Keyword typed in the search box
  const [inputQuery, setInputQuery] = useState("");

  // Sidebar filter values — updated as the user changes selections
  const [pendingFilters, setPendingFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);

  // Last committed snapshot — only updated on "Apply Filters" click
  const [appliedFilters, setAppliedFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);

  // Raw articles returned by the last API call
  const [rawResults, setRawResults] = useState<Article[]>([]);
  const [apiTotal, setApiTotal] = useState(0);

  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Trigger DOAJ search ────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const trimmed = inputQuery.trim();
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
    setPendingFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setRawResults([]);
    setApiTotal(0);
    setHasSearched(false);
    setLoading(false);
    setError(null);
  }, []);

  // ── Sidebar edits pending values only ─────────────────────────────────────
  const handleFilterChange = useCallback(
    (updated: Partial<Omit<SearchFilters, "query">>) => {
      setPendingFilters((prev) => ({ ...prev, ...updated }));
    },
    []
  );

  // ── Apply Filters — commit pending → applied ───────────────────────────────
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...pendingFilters });
  }, [pendingFilters]);

  // True when the sidebar has uncommitted edits vs the applied snapshot
  const filtersDirty = !filtersAreEqual(
    { ...pendingFilters, query: inputQuery },
    { ...appliedFilters, query: inputQuery }
  );

  // ── Client-side filter applied to raw API results ─────────────────────────
  const filteredResults = useMemo(
    () => applyFilters(rawResults, { query: inputQuery, ...appliedFilters }),
    [rawResults, appliedFilters, inputQuery]
  );

  return (
    <main className="flex-1 flex min-h-0" data-testid="search-page">
      {/* Left sidebar — pending filter state + Apply button */}
      <FilterSidebar
        filters={{ ...pendingFilters, query: inputQuery }}
        dirty={filtersDirty}
        onChange={handleFilterChange}
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
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed" data-testid="text-disclaimer">
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
