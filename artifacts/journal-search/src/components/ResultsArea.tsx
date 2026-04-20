/**
 * Results area — handles loading skeleton, error banner, empty, initial, and result states.
 */

import { SearchX, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import type { Article } from "../data/mockArticles";
import { ArticleCard } from "./ArticleCard";

interface ResultsAreaProps {
  articles: Article[];
  hasSearched: boolean;
  loading: boolean;
  error: string | null;
  apiTotal: number;
}

// ── Skeleton card — shown while loading ──────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-7 shadow-sm animate-pulse">
      {/* Badge placeholders */}
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-16 bg-muted rounded-full" />
        <div className="h-5 w-20 bg-muted rounded-full" />
      </div>
      {/* Title */}
      <div className="h-5 bg-muted rounded w-3/4 mb-2" />
      <div className="h-4 bg-muted rounded w-1/2 mb-3" />
      {/* Abstract lines */}
      <div className="h-3 bg-muted rounded w-full mb-1.5" />
      <div className="h-3 bg-muted rounded w-5/6 mb-5" />
      <div className="border-t border-border my-4" />
      {/* Meta pills */}
      <div className="flex gap-2 mb-5">
        <div className="h-6 w-28 bg-muted rounded-full" />
        <div className="h-6 w-12 bg-muted rounded-full" />
        <div className="h-6 w-24 bg-muted rounded-full" />
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-40 bg-muted rounded" />
        <div className="h-8 w-32 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

export function ResultsArea({
  articles,
  hasSearched,
  loading,
  error,
  apiTotal,
}: ResultsAreaProps) {
  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 w-full" data-testid="state-loading">
        {/* Loading header */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
          <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">
            Searching — please wait…
          </span>
        </div>
        {/* Skeleton cards */}
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="flex-1 w-full flex flex-col items-center justify-center py-20 px-6 text-center"
        data-testid="state-error"
      >
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-5">
          <AlertCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-serif font-semibold text-foreground mb-2">
          Search failed
        </h2>
        <p
          className="text-sm text-muted-foreground max-w-sm leading-relaxed"
          data-testid="text-error-message"
        >
          {error}
        </p>
      </div>
    );
  }

  // ── Initial state: no search has been run yet ──────────────────────────────
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

        {/* Suggested search chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {[
            "genomics",
            "climate change",
            "machine learning",
            "CRISPR",
            "antibiotic resistance",
          ].map((term) => (
            <span
              key={term}
              className="text-xs bg-muted text-muted-foreground border border-border rounded-full px-3 py-1.5"
            >
              {term}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground/60">
          Suggested search terms
        </p>
      </div>
    );
  }

  // ── Empty state: search ran but returned no results after filtering ─────────
  if (articles.length === 0) {
    return (
      <div
        className="flex-1 w-full flex flex-col items-center justify-center py-24 px-6 text-center"
        data-testid="state-no-results"
      >
        <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6">
          <SearchX className="w-9 h-9 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
          No results found
        </h2>
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
      {/* Result count header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <p
            className="text-lg font-serif font-semibold text-foreground"
            data-testid="text-result-count"
          >
            {articles.length}{" "}
            <span className="font-normal text-muted-foreground">
              {articles.length === 1 ? "result" : "results"}
            </span>
            {/* Show raw total when client-side filters narrow it down */}
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

        <span className="text-xs text-muted-foreground hidden md:block">
          Links open at the original publisher or repository
        </span>
      </div>

      {/* Article cards */}
      <div className="flex flex-col gap-5" data-testid="list-articles">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
