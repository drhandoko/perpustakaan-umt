/**
 * Main search page — Universitas Murni Teguh library portal.
 *
 * Search type routing:
 *   journals → DOAJ journals endpoint
 *   books    → DOAB REST API
 *   articles → Crossref (journal-article type only)
 *
 * State model:
 *   searchType        — journals | books | articles (drives API selection)
 *   pendingFilters    — what the user sees in the sidebar (uncommitted)
 *   appliedFilters    — committed snapshot; drives client-side filtering
 *   sort              — client-side sort, applied after filtering (instant)
 *   currentPage       — 1-based page index
 *   apiTotal          — raw total returned by the API (for pagination)
 */

import { useState, useCallback, useMemo, useRef } from "react";
import { SearchBar }     from "../components/SearchBar";
import { FilterSidebar } from "../components/FilterSidebar";
import { ResultsArea }   from "../components/ResultsArea";
import { searchDoajJournals } from "../lib/doajApi";
import { searchDoab }         from "../lib/doabApi";
import { searchCrossref }     from "../lib/crossrefApi";
import {
  applyFilters,
  applySortOrder,
} from "../lib/search";
import type { SearchFilters, SearchType, SortOrder } from "../lib/search";
import type { Article } from "../data/mockArticles";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: Omit<SearchFilters, "query"> = {
  yearFrom: "",
  yearTo: "",
  language: [],
  license: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v) => b.includes(v));
}

function filtersAreEqual(
  a: Omit<SearchFilters, "query">,
  b: Omit<SearchFilters, "query">
): boolean {
  return (
    a.yearFrom === b.yearFrom &&
    a.yearTo   === b.yearTo   &&
    arraysEqual(a.language, b.language) &&
    arraysEqual(a.license,  b.license)
  );
}

/** Dispatch to the correct API based on search type. */
async function fetchByType(
  type: SearchType,
  query: string,
  pageSize: number,
  page: number
): Promise<{ articles: Article[]; total: number }> {
  if (type === "journals") return searchDoajJournals(query, pageSize, page);
  if (type === "books")    return searchDoab(query, pageSize, page);
  return searchCrossref(query, pageSize, page);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchPage() {
  // ── Search type ─────────────────────────────────────────────────────────────
  const [searchType, setSearchType] = useState<SearchType>("articles");

  // ── Input ────────────────────────────────────────────────────────────────────
  const [inputQuery, setInputQuery] = useState("");

  // ── Filters (pending vs applied) ─────────────────────────────────────────────
  const [pendingFilters, setPendingFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);

  // ── Results & pagination ─────────────────────────────────────────────────────
  const [rawResults, setRawResults] = useState<Article[]>([]);
  const [apiTotal, setApiTotal]     = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Sort ─────────────────────────────────────────────────────────────────────
  const [sort, setSort] = useState<SortOrder>("relevance");

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Ref to preserve the last query string across pagination / filter applies
  const lastQueryRef  = useRef<string>("");
  const lastTypeRef   = useRef<SearchType>("articles");
  const contentDivRef = useRef<HTMLDivElement>(null);

  // ── Core search executor ──────────────────────────────────────────────────────
  const runSearch = useCallback(
    async (type: SearchType, query: string, page: number) => {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      setCurrentPage(page);
      lastQueryRef.current = query;
      lastTypeRef.current  = type;

      contentDivRef.current?.scrollTo({ top: 0, behavior: "smooth" });

      try {
        const { articles, total } = await fetchByType(type, query, PAGE_SIZE, page);
        setRawResults(articles);
        setApiTotal(total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        setRawResults([]);
        setApiTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ── Keyword search — always resets to page 1 ─────────────────────────────────
  const handleSearch = useCallback(async () => {
    const trimmed = inputQuery.trim();
    if (!trimmed) {
      setError("Please enter a search term.");
      return;
    }
    setSort("relevance");
    await runSearch(searchType, trimmed, 1);
  }, [inputQuery, searchType, runSearch]);

  // ── Search type change — reset everything ─────────────────────────────────────
  const handleSearchTypeChange = useCallback((type: SearchType) => {
    setSearchType(type);
    // Reset results and filters when switching type
    setRawResults([]);
    setApiTotal(0);
    setCurrentPage(1);
    setHasSearched(false);
    setError(null);
    setPendingFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSort("relevance");
    lastQueryRef.current = "";
    lastTypeRef.current  = type;
  }, []);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const handlePageChange = useCallback(
    async (page: number) => {
      if (!lastQueryRef.current) return;
      await runSearch(lastTypeRef.current, lastQueryRef.current, page);
    },
    [runSearch]
  );

  // ── Sort (client-side, instant) ───────────────────────────────────────────────
  const handleSortChange = useCallback((newSort: SortOrder) => {
    setSort(newSort);
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setInputQuery("");
    setPendingFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setRawResults([]);
    setApiTotal(0);
    setSort("relevance");
    setCurrentPage(1);
    setHasSearched(false);
    setLoading(false);
    setError(null);
    lastQueryRef.current = "";
  }, []);

  // ── Sidebar filter edits (pending only) ──────────────────────────────────────
  const handleFilterChange = useCallback(
    (updated: Partial<Omit<SearchFilters, "query">>) =>
      setPendingFilters((prev) => ({ ...prev, ...updated })),
    []
  );

  // ── Apply Filters — commit pending → applied ──────────────────────────────────
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...pendingFilters });
  }, [pendingFilters]);

  // ── Dirty flag ────────────────────────────────────────────────────────────────
  const filtersDirty = !filtersAreEqual(pendingFilters, appliedFilters);

  // ── Derived results: filter → sort ───────────────────────────────────────────
  const filteredResults = useMemo(
    () => applyFilters(rawResults, { query: inputQuery, ...appliedFilters }),
    [rawResults, appliedFilters, inputQuery]
  );

  const displayedResults = useMemo(
    () => applySortOrder(filteredResults, sort),
    [filteredResults, sort]
  );

  // ── Total pages ───────────────────────────────────────────────────────────────
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(apiTotal / PAGE_SIZE)),
    [apiTotal]
  );

  return (
    <main className="flex-1 flex min-h-0" data-testid="search-page">
      {/* Left sidebar */}
      <FilterSidebar
        searchType={searchType}
        filters={{ ...pendingFilters, query: inputQuery }}
        dirty={filtersDirty}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
      />

      {/* Main content column */}
      <div
        ref={contentDivRef}
        className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background"
      >
        {/* Sticky search area */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-8 py-6">
          <SearchBar
            value={inputQuery}
            searchType={searchType}
            onChange={setInputQuery}
            onSearchTypeChange={handleSearchTypeChange}
            onSearch={handleSearch}
            onReset={handleReset}
            loading={loading}
          />
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed" data-testid="text-disclaimer">
            <span className="font-medium text-foreground/60">Disclaimer:</span>{" "}
            Results are indexed from external open-access sources. Full text remains
            hosted by the original publisher or repository.
          </p>
        </div>

        {/* Results */}
        <div className="px-8 py-8">
          <ResultsArea
            articles={displayedResults}
            hasSearched={hasSearched}
            loading={loading}
            error={error}
            apiTotal={apiTotal}
            searchType={searchType}
            sort={sort}
            onSortChange={handleSortChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </main>
  );
}
