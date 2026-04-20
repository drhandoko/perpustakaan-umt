/**
 * Main search page — Perpustakaan Universitas Murni Teguh discovery portal.
 *
 * Search type routing:
 *   journals → DOAJ journals API (direct, CORS-OK)
 *   books    → /api/books-search backend proxy (DOAB + OAPEN aggregated)
 *   articles → Crossref (journal-article type only, direct, CORS-OK)
 *
 * Filter model (pending vs applied):
 *   Pending filters live in sidebar while user edits them.
 *   Applied filters are committed on "Apply Filters" and drive client-side
 *   filtering of the fetched result set.
 *   bookSources is special: it also drives which backend sources are queried,
 *   so a search is re-run when a source checkbox changes and the user applies.
 */

import { useState, useCallback, useMemo, useRef } from "react";
import { SearchBar }         from "../components/SearchBar";
import { FilterSidebar }     from "../components/FilterSidebar";
import { ResultsArea }       from "../components/ResultsArea";
import { searchDoajJournals } from "../lib/doajApi";
import { searchBooks }        from "../lib/booksApi";
import { searchCrossref }     from "../lib/crossrefApi";
import {
  applyFilters,
  applySortOrder,
} from "../lib/search";
import type { SearchFilters, SearchType, SortOrder } from "../lib/search";
import type { Article } from "../data/mockArticles";
import { BOOK_SOURCES } from "../data/mockArticles";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

/** Default active book source IDs (only implemented sources). */
const DEFAULT_BOOK_SOURCES = BOOK_SOURCES.filter((s) => s.active).map((s) => s.id);

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: Omit<SearchFilters, "query"> = {
  yearFrom:    "",
  yearTo:      "",
  language:    [],
  license:     [],
  bookSources: DEFAULT_BOOK_SOURCES,
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
    arraysEqual(a.language,    b.language)    &&
    arraysEqual(a.license,     b.license)     &&
    arraysEqual(a.bookSources, b.bookSources)
  );
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
  const [rawResults, setRawResults]   = useState<Article[]>([]);
  const [apiTotal, setApiTotal]       = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Sort ─────────────────────────────────────────────────────────────────────
  const [sort, setSort] = useState<SortOrder>("relevance");

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Refs to preserve state across pagination
  const lastQueryRef  = useRef<string>("");
  const lastTypeRef   = useRef<SearchType>("articles");
  const lastSourcesRef = useRef<string[]>(DEFAULT_BOOK_SOURCES);
  const contentDivRef = useRef<HTMLDivElement>(null);

  // ── Core search executor ──────────────────────────────────────────────────────
  const runSearch = useCallback(
    async (
      type: SearchType,
      query: string,
      page: number,
      activeSources: string[],
    ) => {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      setCurrentPage(page);
      lastQueryRef.current   = query;
      lastTypeRef.current    = type;
      lastSourcesRef.current = activeSources;

      contentDivRef.current?.scrollTo({ top: 0, behavior: "smooth" });

      try {
        let articles: Article[];
        let total: number;

        if (type === "journals") {
          ({ articles, total } = await searchDoajJournals(query, PAGE_SIZE, page));
        } else if (type === "books") {
          // Only pass active (implemented) sources to the backend
          const activeIds = activeSources.filter((id) =>
            BOOK_SOURCES.some((s) => s.id === id && s.active)
          );
          ({ articles, total } = await searchBooks(query, activeIds, PAGE_SIZE, page));
        } else {
          ({ articles, total } = await searchCrossref(query, PAGE_SIZE, page));
        }

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
    if (!trimmed) { setError("Please enter a search term."); return; }
    setSort("relevance");
    // Use the currently applied (not pending) filters for the search
    await runSearch(searchType, trimmed, 1, appliedFilters.bookSources);
  }, [inputQuery, searchType, appliedFilters.bookSources, runSearch]);

  // ── Search type change — full reset ──────────────────────────────────────────
  const handleSearchTypeChange = useCallback((type: SearchType) => {
    setSearchType(type);
    setRawResults([]);
    setApiTotal(0);
    setCurrentPage(1);
    setHasSearched(false);
    setError(null);
    setPendingFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSort("relevance");
    lastQueryRef.current   = "";
    lastTypeRef.current    = type;
    lastSourcesRef.current = DEFAULT_BOOK_SOURCES;
  }, []);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const handlePageChange = useCallback(
    async (page: number) => {
      if (!lastQueryRef.current) return;
      await runSearch(
        lastTypeRef.current,
        lastQueryRef.current,
        page,
        lastSourcesRef.current,
      );
    },
    [runSearch]
  );

  // ── Sort (client-side, instant) ───────────────────────────────────────────────
  const handleSortChange = useCallback((newSort: SortOrder) => setSort(newSort), []);

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

  // ── Apply Filters — commit pending → applied, re-run if sources changed ───────
  const handleApplyFilters = useCallback(async () => {
    setAppliedFilters({ ...pendingFilters });

    // If the bookSources changed AND we already have results, re-run the search
    if (
      searchType === "books" &&
      lastQueryRef.current &&
      !arraysEqual(pendingFilters.bookSources, appliedFilters.bookSources)
    ) {
      await runSearch(
        "books",
        lastQueryRef.current,
        1,
        pendingFilters.bookSources,
      );
    }
  }, [pendingFilters, appliedFilters.bookSources, searchType, runSearch]);

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
