/**
 * Results area — handles all display states:
 *   loading → skeleton cards
 *   error   → error banner
 *   initial → welcome / suggested searches (adapts to SearchType)
 *   empty   → no results after filtering
 *   results → cards + sort control + pagination
 */

import {
  SearchX, BookOpen, Book, FileText, AlertCircle, Loader2,
  ChevronLeft, ChevronRight, ArrowUpDown,
} from "lucide-react";
import type { Article } from "../data/mockArticles";
import type { SortOrder, SearchType } from "../lib/search";
import { SORT_OPTIONS } from "../lib/search";
import { ArticleCard } from "./ArticleCard";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ResultsAreaProps {
  articles: Article[];
  hasSearched: boolean;
  loading: boolean;
  error: string | null;
  apiTotal: number;
  searchType: SearchType;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// ─── Static config per search type ───────────────────────────────────────────

const TYPE_CONFIG: Record<SearchType, {
  icon: React.FC<{ className?: string }>;
  heading: string;
  description: string;
  sourceNote: string;
  suggestions: string[];
}> = {
  journals: {
    icon: BookOpen,
    heading: "Search open-access journals",
    description:
      "Enter a keyword, journal name, or subject area. Results come from DOAJ — a curated index of peer-reviewed open-access journals.",
    sourceNote: "DOAJ",
    suggestions: ["linguistics", "public health", "sustainability", "education", "mathematics"],
  },
  books: {
    icon: Book,
    heading: "Search open-access books",
    description:
      "Enter a keyword, title, or author name. Results come from Crossref — filtered to academic books, monographs, and edited volumes.",
    sourceNote: "Crossref",
    suggestions: ["history", "philosophy", "economics", "chemistry", "law"],
  },
  articles: {
    icon: FileText,
    heading: "Search open-access articles",
    description:
      "Enter a keyword, author name, or title. Results come from Crossref — filtered to peer-reviewed journal articles.",
    sourceNote: "Crossref",
    suggestions: ["genomics", "climate change", "machine learning", "CRISPR", "antibiotic resistance"],
  },
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

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

// ─── Pagination ───────────────────────────────────────────────────────────────

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

  const btnBase    = "inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border transition-all";
  const btnActive  = "border-primary/20 text-primary bg-primary/6 hover:bg-primary hover:text-primary-foreground";
  const btnDisabled = "border-border text-muted-foreground bg-muted cursor-default opacity-50";

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border" data-testid="pagination-bar">
      <button
        type="button"
        onClick={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev || loading}
        className={`${btnBase} ${canGoPrev && !loading ? btnActive : btnDisabled}`}
        data-testid="button-prev-page"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Previous
      </button>

      <span className="text-sm text-muted-foreground tabular-nums" data-testid="text-page-indicator" aria-live="polite">
        Page{" "}
        <span className="font-semibold text-foreground">{currentPage}</span>
        {" "}of{" "}
        <span className="font-semibold text-foreground">{totalPages.toLocaleString()}</span>
      </span>

      <button
        type="button"
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext || loading}
        className={`${btnBase} ${canGoNext && !loading ? btnActive : btnDisabled}`}
        data-testid="button-next-page"
        aria-label="Next page"
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
  searchType,
  sort,
  onSortChange,
  currentPage,
  totalPages,
  onPageChange,
}: ResultsAreaProps) {
  const config = TYPE_CONFIG[searchType];
  const Icon   = config.icon;

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

  if (error) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 px-6 text-center" data-testid="state-error">
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

  if (!hasSearched) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-24 px-6 text-center" data-testid="state-initial">
        <div className="w-20 h-20 rounded-2xl bg-primary/8 border border-primary/12 flex items-center justify-center mb-6">
          <Icon className="w-9 h-9 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
          {config.heading}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          {config.description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {config.suggestions.map((term) => (
            <span
              key={term}
              className="text-xs bg-muted text-muted-foreground border border-border rounded-full px-3 py-1.5"
            >
              {term}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground/60">Suggested search terms</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-24 px-6 text-center" data-testid="state-no-results">
        <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6">
          <SearchX className="w-9 h-9 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-serif font-semibold text-foreground mb-2">No results found</h2>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          {apiTotal > 0
            ? `${apiTotal.toLocaleString()} results were fetched but your filters excluded all of them. Try relaxing the filters.`
            : "Try different keywords or broaden your search terms."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full" data-testid="results-area">
      {/* Results header */}
      <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <p className="text-lg font-serif font-semibold text-foreground" data-testid="text-result-count">
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
            Source: {config.sourceNote}
          </p>
        </div>
        <SortControl sort={sort} onSortChange={onSortChange} />
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-5" data-testid="list-articles">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
