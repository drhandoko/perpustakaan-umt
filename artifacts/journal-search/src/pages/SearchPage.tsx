/**
 * Main search page — Universitas Murni Teguh library portal.
 */

import { useState, useCallback } from "react";
import { SearchBar } from "../components/SearchBar";
import { FilterSidebar } from "../components/FilterSidebar";
import { ResultsArea } from "../components/ResultsArea";
import { searchArticles } from "../lib/search";
import type { SearchFilters } from "../lib/search";
import type { Article } from "../data/mockArticles";
import { mockArticles } from "../data/mockArticles";

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  source: "All",
  yearFrom: "",
  yearTo: "",
  language: "All",
  license: "All",
};

export function SearchPage() {
  const [inputQuery, setInputQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Article[]>([]);

  const handleSearch = useCallback(() => {
    const filters: SearchFilters = { query: inputQuery, ...pendingFilters };
    setActiveFilters(filters);
    setResults(searchArticles(filters));
    setHasSearched(true);
  }, [inputQuery, pendingFilters]);

  const handleReset = useCallback(() => {
    setInputQuery("");
    setPendingFilters(DEFAULT_FILTERS);
    setActiveFilters(DEFAULT_FILTERS);
    setResults([]);
    setHasSearched(false);
  }, []);

  const handleFilterChange = useCallback(
    (updated: Partial<Omit<SearchFilters, "query">>) => {
      setPendingFilters((prev) => ({ ...prev, ...updated }));
    },
    []
  );

  return (
    <main className="flex-1 flex min-h-0" data-testid="search-page">
      {/* Left sidebar */}
      <FilterSidebar
        filters={{ ...pendingFilters, query: inputQuery }}
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
            articles={results}
            hasSearched={hasSearched}
            totalCount={mockArticles.length}
          />
        </div>
      </div>
    </main>
  );
}
