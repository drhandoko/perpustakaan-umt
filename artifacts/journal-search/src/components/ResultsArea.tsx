/**
 * Results area — handles all display states:
 *   loading → skeleton cards
 *   error   → error banner
 *   initial → welcome / suggested searches
 *   empty   → no results after filtering
 *   results → article cards + sort control + pagination
 */

import { SearchX, BookOpen, AlertCircle, Loader2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import type { Article } from "../data/mockArticles";
import type { SortOrder } from "../lib/search";
import { SORT_OPTIONS } from "../lib/search";
import { ArticleCard } from "./ArticleCard";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ResultsAreaProps {
  articles: Article[];
  hasSearched: boolean;
  loading: boolean;
  error: string | null;
  apiTotal: number;
  // Sort
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  // Pagination
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// ─── Skeleton card — shown while loading ──────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-7 shadow-sm animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-16 bg-muted rounded-full" />
        <div className="h-5 w-20 bg-muted rounded-full" />
      </div>
      <div className="h-5 bg-muted rounded w-3/4 mb-2" />
      <div className="h-4 bg-muted rounded w-1/2 mb-3" />
      <div className="h-3 bg-muted rounded w-full mb-1.5" />
      <div className="h-3 bg-muted rounded w-5/6 mb-5" />
      <div className="border-t border-border my-4" />
      <div className="flex gap-2 mb-5">
        <div className="h-6 w-28 bg-muted rounded-full" />
        <div className="h-6 w-12 bg-muted rounded-full" />
        <div className="h-6 w-24 bg-muted rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 w-40 bg-muted rounded" />
        <div className="h-8 w-32 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

// ─── Sort control ─────────────────────────────────────────────────────────────

function SortControl({
  sort,
  onSortChange,
}: {
  sort: SortOrder;
  onSortChange: (s: SortOrder) => void;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
      <label htmlFor="sort-select" className="text-xs text-muted-foreground whitespace-nowrap">
        Sort by
      </label>
      <select
        id="sort-select"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOrder)}
        className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
        data-testid="select-sort"
        aria-label="Sort results"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Pagination bar ───────────────────────────────────────────────────────────

function PaginationBar({
  currentPage,
  totalPages,
  loading,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const btnBase =
    "inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border transition-all";
  const btnActive =
    "border-primary/20 text-primary bg-primary/6 hover:bg-primary hover:text-primary-foreground";
  const btnDisabled =
    "border-border text-muted-foreground bg-muted cursor-default opacity-50";

  return (
    <div
      className="flex items-center justify-between mt-8 pt-6 border-t border-border"
      data-testid="pagination-bar"
    >
      {/* Previous */}
      <button
        type="button"
        onClick={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev || loading}
        className={`${btnBase} ${canGoPrev && !loading ? btnActive : btnDisabled}`}
        data-testid="button-prev-page"
        aria-label="Go to previous page"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Previous
      </button>

      {/* Page indicator */}
      <span
        className="text-sm text-muted-foreground tabular-nums"
        data-testid="text-page-indicator"
        aria-live="polite"
      >
        Page{" "}
        <span className="font-semibold text-foreground">{currentPage}</span>
        {" "}of{" "}
        <span className="font-semibold text-foreground">{totalPages.toLocaleString()}</span>
      </span>

      {/* Next */}
      <button
        type="button"
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext || loading}
        className={`${btnBase} ${canGoNext && !loading ? btnActive : btnDisabled}`}
        data-testid="button-next-page"
        aria-label="Go to next page"
      >
        Next
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResultsArea({
  articles,
  hasSearched,
  loading,
  error,
  apiTotal,
  sort,
  onSortChange,
  currentPage,
  totalPages,
  onPageChange,
}: ResultsAreaProps) {

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 w-full" data-testid="state-loading">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
          <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Searching — please wait…</span>
        </div>
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="flex-1 w-full flex flex-col items-center justify-center py-20 px-6 text-center"
        data-testid="state-error"
      >
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-5">
          <AlertCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-serif font-semibold text-foreground mb-2">Search failed</h2>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed" data-testid="text-error-message">
          {error}
        </p>
      </div>
    );
  }

  // ── Initial (no search yet) ────────────────────────────────────────────────
  if (!hasSearched) {
    return (
      <div
        className="flex-1 w-full flex flex-col items-center justify-center py-24 px-6 text-center"
        data-testid="state-initial"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/8 border border-primary/12 flex items-center justify-center mb-6">
          <BookOpen className="w-9 h-9 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
          Discover open-access scholarship
        </h2>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          Enter a keyword, author name, or journal title above and click Search.
          Results come from{" "}
          <span className="font-medium text-foreground/70">DOAJ</span> and{" "}
          <span className="font-medium text-foreground/70">Crossref</span> —
          curated, peer-reviewed open-access literature.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {["genomics", "climate change", "machine learning", "CRISPR", "antibiotic resistance"].map(
            (term) => (
              <span
                key={term}
                className="text-xs bg-muted text-muted-foreground border border-border rounded-full px-3 py-1.5"
              >
                {term}
              </span>
            )
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground/60">Suggested search terms</p>
      </div>
    );
  }

  // ── Empty (search ran, filters excluded everything) ────────────────────────
  if (articles.length === 0) {
    return (
      <div
        className="flex-1 w-full flex flex-col items-center justify-center py-24 px-6 text-center"
        data-testid="state-no-results"
      >
        <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6">
          <SearchX className="w-9 h-9 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-serif font-semibold text-foreground mb-2">No results found</h2>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          {apiTotal > 0
            ? `${apiTotal.toLocaleString()} results were fetched but the current filters excluded all of them. Try relaxing the year, language, or license filters.`
            : "Try different keywords or broaden your search terms."}
        </p>
      </div>
    );
  }

  // ── Results list ───────────────────────────────────────────────────────────
  return (
    <div className="flex-1 w-full" data-testid="results-area">
      {/* Results header: count + sort control */}
      <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border">
        {/* Count + source note */}
        <div>
          <p
            className="text-lg font-serif font-semibold text-foreground"
            data-testid="text-result-count"
          >
            {articles.length}{" "}
            <span className="font-normal text-muted-foreground">
              {articles.length === 1 ? "result" : "results"}
            </span>
            {apiTotal > articles.length && (
              <span className="text-sm font-normal text-muted-foreground">
                {" "}(of {apiTotal.toLocaleString()} fetched)
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 italic hidden sm:block">
            Sources: DOAJ &middot; Crossref &middot; Deduplicated by DOI
          </p>
        </div>

        {/* Sort control */}
        <SortControl sort={sort} onSortChange={onSortChange} />
      </div>

      {/* Article cards */}
      <div className="flex flex-col gap-5" data-testid="list-articles">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Pagination */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
