/**
 * Results area — polished count header, article list, and empty/initial states.
 */

import { SearchX, BookOpen } from "lucide-react";
import type { Article } from "../data/mockArticles";
import { ArticleCard } from "./ArticleCard";

interface ResultsAreaProps {
  articles: Article[];
  hasSearched: boolean;
  totalCount: number;
}

export function ResultsArea({ articles, hasSearched, totalCount }: ResultsAreaProps) {
  /* ── Initial: no search yet ── */
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
          Enter a keyword, author name, or journal title above, then use the
          sidebar filters to narrow your results by source, year, language, or
          license. All results link directly to the original open-access source.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
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

  /* ── Empty: search returned nothing ── */
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
          Try broadening your search terms, adjusting the year range, or
          selecting a different source in the sidebar.
        </p>
      </div>
    );
  }

  /* ── Results ── */
  return (
    <div className="flex-1 w-full" data-testid="results-area">
      {/* Result count header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <p
            className="text-lg font-serif font-semibold text-foreground"
            data-testid="text-result-count"
          >
            {articles.length === totalCount ? (
              <>
                {articles.length}{" "}
                <span className="font-normal text-muted-foreground">
                  result{articles.length === 1 ? "" : "s"}
                </span>
              </>
            ) : (
              <>
                {articles.length}{" "}
                <span className="font-normal text-muted-foreground">
                  of {totalCount} result{totalCount === 1 ? "" : "s"}
                </span>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 italic hidden sm:block">
            Sorted by relevance &middot; Open-access titles only
          </p>
        </div>

        <span className="text-xs text-muted-foreground hidden md:block">
          Links open at the original publisher or repository
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-5" data-testid="list-articles">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
