/**
 * Main search page — Perpustakaan Universitas Murni Teguh discovery portal.
 */

import { useState, useCallback, useMemo, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SearchBar }         from "../components/SearchBar";
import { FilterSidebar }     from "../components/FilterSidebar";
import { ResultsArea }       from "../components/ResultsArea";
import { searchJournals }     from "../lib/journalsApi";
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

const DEFAULT_BOOK_SOURCES = BOOK_SOURCES.filter((s) => s.active).map((s) => s.id);

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: Omit<SearchFilters, "query"> = {
  yearFrom:        "",
  yearTo:          "",
  language:        [],
  license:         [],
  bookSources:     DEFAULT_BOOK_SOURCES,
  journalSubjects: [],
  journalRanking:  [],
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
    arraysEqual(a.language,        b.language)        &&
    arraysEqual(a.license,         b.license)         &&
    arraysEqual(a.bookSources,     b.bookSources)     &&
    arraysEqual(a.journalSubjects, b.journalSubjects) &&
    arraysEqual(
      Array.isArray(a.journalRanking) ? a.journalRanking : [],
      Array.isArray(b.journalRanking) ? b.journalRanking : [],
    )
  );
}

/** Count non-default active filters for the badge on the mobile Filters button. */
function countActiveFilters(f: Omit<SearchFilters, "query">): number {
  let n = 0;
  if (f.yearFrom !== "")               n++;
  if (f.yearTo   !== "")               n++;
  if (f.language.length > 0)           n += f.language.length;
  if (f.license.length > 0)            n += f.license.length;
  if (f.journalSubjects.length > 0)    n += f.journalSubjects.length;
  if ((f.journalRanking ?? []).length > 0) n += (f.journalRanking ?? []).length;
  return n;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchPage() {
  const [searchType, setSearchType] = useState<SearchType>("articles");
  const [inputQuery, setInputQuery] = useState("");

  const [pendingFilters, setPendingFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);

  const [rawResults, setRawResults]   = useState<Article[]>([]);
  const [apiTotal, setApiTotal]       = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [sort, setSort] = useState<SortOrder>("relevance");

  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Mobile sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lastQueryRef   = useRef<string>("");
  const lastTypeRef    = useRef<SearchType>("articles");
  const lastSourcesRef = useRef<string[]>(DEFAULT_BOOK_SOURCES);
  const contentDivRef  = useRef<HTMLDivElement>(null);

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
          ({ articles, total } = await searchJournals(query, PAGE_SIZE, page));
        } else if (type === "books") {
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

  const handleSearch = useCallback(async () => {
    const trimmed = inputQuery.trim();
    if (!trimmed) { setError("Please enter a search term."); return; }
    setSort("relevance");
    await runSearch(searchType, trimmed, 1, appliedFilters.bookSources);
  }, [inputQuery, searchType, appliedFilters.bookSources, runSearch]);

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

  const handleSortChange = useCallback((newSort: SortOrder) => setSort(newSort), []);

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

  const handleFilterChange = useCallback(
    (updated: Partial<Omit<SearchFilters, "query">>) =>
      setPendingFilters((prev) => ({ ...prev, ...updated })),
    []
  );

  const handleApplyFilters = useCallback(async () => {
    setAppliedFilters({ ...pendingFilters });

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

  const filtersDirty = !filtersAreEqual(pendingFilters, appliedFilters);

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

  const activeFilterCount = countActiveFilters(appliedFilters);

  return (
    <main className="flex-1 flex min-h-0" data-testid="search-page">
      {/* Sidebar — always visible on desktop, drawer on mobile */}
      <FilterSidebar
        searchType={searchType}
        filters={{ ...pendingFilters, query: inputQuery }}
        dirty={filtersDirty}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content column */}
      <div
        ref={contentDivRef}
        className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background"
      >
        {/* Sticky search area */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 sm:px-8 py-4 sm:py-6">
          {/* Mobile filter toggle */}
          <div className="flex items-center gap-3 mb-3 md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/6 border border-primary/20 hover:bg-primary/10 active:scale-[0.97] rounded-lg px-4 py-2 transition-all"
              aria-label="Open search filters"
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {filtersDirty && (
              <span className="text-[11px] text-amber-600">Filters not yet applied</span>
            )}
          </div>

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
        <div className="px-4 sm:px-8 py-6 sm:py-8">
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
