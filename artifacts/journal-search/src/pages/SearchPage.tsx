/**
 * Main search page.
 * Orchestrates the search bar, sidebar filters, and results area.
 * State is kept local — no backend needed for the mock-data phase.
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
  /* Live query string shown in the input */
  const [inputQuery, setInputQuery] = useState("");

  /* Committed filters — only applied when Search is clicked */
  const [activeFilters, setActiveFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  /* Sidebar filter values (pending until Search is clicked) */
  const [pendingFilters, setPendingFilters] = useState<Omit<SearchFilters, "query">>(
    DEFAULT_FILTERS
  );

  /* Whether the user has triggered at least one search */
  const [hasSearched, setHasSearched] = useState(false);

  /* Current result set */
  const [results, setResults] = useState<Article[]>([]);

  /** Run the search with current query + pending filters */
  const handleSearch = useCallback(() => {
    const filters: SearchFilters = { query: inputQuery, ...pendingFilters };
    setActiveFilters(filters);
    setResults(searchArticles(filters));
    setHasSearched(true);
  }, [inputQuery, pendingFilters]);

  /** Reset everything back to defaults */
  const handleReset = useCallback(() => {
    setInputQuery("");
    setPendingFilters(DEFAULT_FILTERS);
    setActiveFilters(DEFAULT_FILTERS);
    setResults([]);
    setHasSearched(false);
  }, []);

  /** Update a subset of sidebar filters */
  const handleFilterChange = useCallback(
    (updated: Partial<Omit<SearchFilters, "query">>) => {
      setPendingFilters((prev) => ({ ...prev, ...updated }));
    },
    []
  );

  return (
    <main className="flex-1 flex min-h-0" data-testid="search-page">
      {/* Left sidebar filters */}
      <FilterSidebar
        filters={{ ...pendingFilters, query: inputQuery }}
        onChange={handleFilterChange}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Search bar area — sticky at top of content column */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-5 shadow-sm">
          <SearchBar
            value={inputQuery}
            onChange={setInputQuery}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </div>

        {/* Results */}
        <div className="px-6 py-6 flex">
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
