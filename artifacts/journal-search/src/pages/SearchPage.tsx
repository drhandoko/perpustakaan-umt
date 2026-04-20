/**
 * Main search page — Universitas Murni Teguh library portal.
 *
 * State model:
 *   pending*      — what the user sees / edits in the sidebar right now
 *   applied*      — last committed snapshot; drives API calls and filtering
 *   sort          — client-side sort order applied after filtering (instant, no API call)
 *   currentPage   — 1-based page index; changes trigger a new API fetch
 *   doajTotal /   — per-source total counts, used to derive totalPages
 *   crossrefTotal
 *
 * New results only appear when the user:
 *   (a) submits a keyword search → resets to page 1
 *   (b) clicks Apply Filters → re-fetches with new sources if they changed, else re-filters
 *   (c) clicks Previous / Next → fetches the adjacent page
 */

import { useState, useCallback, useMemo, useRef } from "react";
import { SearchBar } from "../components/SearchBar";
import { FilterSidebar } from "../components/FilterSidebar";
import { ResultsArea } from "../components/ResultsArea";
import { searchDoaj } from "../lib/doajApi";
import { searchCrossref } from "../lib/crossrefApi";
import {
  applyFilters,
  applySortOrder,
  mergeAndDeduplicate,
  sourcesAreEqual,
} from "../lib/search";
import type { SearchFilters, SourceSelection, SortOrder } from "../lib/search";
import type { Article } from "../data/mockArticles";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

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
  // ── Input & filters ────────────────────────────────────────────────────────
  const [inputQuery, setInputQuery] = useState("");

  const [pendingFilters, setPendingFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<Omit<SearchFilters, "query">>(DEFAULT_FILTERS);

  const [pendingSources, setPendingSources] = useState<SourceSelection>(DEFAULT_SOURCES);
  const [appliedSources, setAppliedSources] = useState<SourceSelection>(DEFAULT_SOURCES);

  // ── Results ────────────────────────────────────────────────────────────────
  const [rawResults, setRawResults] = useState<Article[]>([]);

  // Per-source totals — needed to compute totalPages across two independent APIs
  const [doajTotal, setDoajTotal]         = useState(0);
  const [crossrefTotal, setCrossrefTotal] = useState(0);

  // ── Sort (client-side, instant) ────────────────────────────────────────────
  const [sort, setSort] = useState<SortOrder>("relevance");

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Refs
  const lastQueryRef    = useRef<string>("");
  const contentDivRef   = useRef<HTMLDivElement>(null); // for scroll-to-top on page change

  // ── Core search executor ───────────────────────────────────────────────────
  const runSearch = useCallback(
    async (query: string, sources: SourceSelection, page: number) => {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      setCurrentPage(page);
      lastQueryRef.current = query;

      // Scroll results column back to top on every page change
      contentDivRef.current?.scrollTo({ top: 0, behavior: "smooth" });

      try {
        const calls: Promise<{ articles: Article[]; total: number }>[] = [];
        if (sources.doaj)     calls.push(searchDoaj(query, PAGE_SIZE, page));
        if (sources.crossref) calls.push(searchCrossref(query, PAGE_SIZE, page));

        const settled = await Promise.allSettled(calls);

        let doajArticles: Article[]     = [];
        let crossrefArticles: Article[] = [];
        const errors: string[]          = [];

        let callIndex = 0;

        if (sources.doaj) {
          const result = settled[callIndex++];
          if (result.status === "fulfilled") {
            doajArticles = result.value.articles;
            setDoajTotal(result.value.total);
          } else {
            errors.push(`DOAJ: ${(result.reason as Error).message}`);
            setDoajTotal(0);
          }
        } else {
          setDoajTotal(0);
        }

        if (sources.crossref) {
          const result = settled[callIndex++];
          if (result.status === "fulfilled") {
            crossrefArticles = result.value.articles;
            setCrossrefTotal(result.value.total);
          } else {
            errors.push(`Crossref: ${(result.reason as Error).message}`);
            setCrossrefTotal(0);
          }
        } else {
          setCrossrefTotal(0);
        }

        if (errors.length > 0 && doajArticles.length === 0 && crossrefArticles.length === 0) {
          throw new Error(errors.join(" | "));
        }

        setRawResults(mergeAndDeduplicate(doajArticles, crossrefArticles));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        setRawResults([]);
        setDoajTotal(0);
        setCrossrefTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ── Keyword search from SearchBar — always resets to page 1 ───────────────
  const handleSearch = useCallback(async () => {
    const trimmed = inputQuery.trim();
    if (!trimmed) {
      setError("Please enter a search term.");
      return;
    }
    setSort("relevance"); // reset sort on new search
    await runSearch(trimmed, appliedSources, 1);
  }, [inputQuery, appliedSources, runSearch]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const handlePageChange = useCallback(
    async (page: number) => {
      if (!lastQueryRef.current) return;
      await runSearch(lastQueryRef.current, appliedSources, page);
    },
    [appliedSources, runSearch]
  );

  // ── Sort (client-side, no API call) ───────────────────────────────────────
  const handleSortChange = useCallback((newSort: SortOrder) => {
    setSort(newSort);
  }, []);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setInputQuery("");
    setPendingFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPendingSources(DEFAULT_SOURCES);
    setAppliedSources(DEFAULT_SOURCES);
    setRawResults([]);
    setDoajTotal(0);
    setCrossrefTotal(0);
    setSort("relevance");
    setCurrentPage(1);
    setHasSearched(false);
    setLoading(false);
    setError(null);
    lastQueryRef.current = "";
  }, []);

  // ── Sidebar filter edits (updates pending only) ───────────────────────────
  const handleFilterChange = useCallback(
    (updated: Partial<Omit<SearchFilters, "query">>) =>
      setPendingFilters((prev) => ({ ...prev, ...updated })),
    []
  );

  const handleSourceChange = useCallback(
    (updated: Partial<SourceSelection>) =>
      setPendingSources((prev) => ({ ...prev, ...updated })),
    []
  );

  // ── Apply Filters — commit pending → applied ──────────────────────────────
  const handleApplyFilters = useCallback(async () => {
    const sourcesChanged = !sourcesAreEqual(pendingSources, appliedSources);

    setAppliedFilters({ ...pendingFilters });
    setAppliedSources({ ...pendingSources });

    // If sources changed and an active search exists, re-run from page 1
    if (sourcesChanged && hasSearched && lastQueryRef.current) {
      await runSearch(lastQueryRef.current, pendingSources, 1);
    }
  }, [pendingFilters, pendingSources, appliedSources, hasSearched, runSearch]);

  // ── Dirty flag ────────────────────────────────────────────────────────────
  const filtersDirty =
    !filtersAreEqual(pendingFilters, appliedFilters) ||
    !sourcesAreEqual(pendingSources, appliedSources);

  // ── Derived results: filter → sort ────────────────────────────────────────
  const filteredResults = useMemo(
    () => applyFilters(rawResults, { query: inputQuery, ...appliedFilters }),
    [rawResults, appliedFilters, inputQuery]
  );

  const displayedResults = useMemo(
    () => applySortOrder(filteredResults, sort),
    [filteredResults, sort]
  );

  // ── Total pages — largest per-source total drives the page count ──────────
  const totalPages = useMemo(() => {
    const maxTotal = Math.max(
      appliedSources.doaj     ? doajTotal     : 0,
      appliedSources.crossref ? crossrefTotal : 0
    );
    return Math.max(1, Math.ceil(maxTotal / PAGE_SIZE));
  }, [doajTotal, crossrefTotal, appliedSources]);

  // Combined raw total (for the "X of Y fetched" label in ResultsArea)
  const apiTotal =
    (appliedSources.doaj     ? doajTotal     : 0) +
    (appliedSources.crossref ? crossrefTotal : 0);

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
      <div
        ref={contentDivRef}
        className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background"
      >
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
            articles={displayedResults}
            hasSearched={hasSearched}
            loading={loading}
            error={error}
            apiTotal={apiTotal}
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
