/**
 * Results area component.
 * Shows result count, sort/display options, and the list of ArticleCards.
 * Handles empty states and the initial landing state.
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
  /* ── Initial state: user has not searched yet ── */
  if (!hasSearched) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center"
        data-testid="state-initial"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
          Discover open-access scholarship
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Enter a keyword, author name, or journal title above, then apply filters
          on the left to narrow your results. All results link to the original
          open-access source.
        </p>
      </div>
    );
  }

  /* ── Empty state: search returned no results ── */
  if (articles.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center"
        data-testid="state-no-results"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <SearchX className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">No results found</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try broadening your search terms or adjusting the filters in the sidebar.
        </p>
      </div>
    );
  }

  /* ── Results list ── */
  return (
    <div className="flex-1 min-w-0" data-testid="results-area">
      {/* Result count header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground" data-testid="text-result-count">
          Showing{" "}
          <strong className="text-foreground">{articles.length}</strong>{" "}
          {articles.length === totalCount
            ? `result${articles.length === 1 ? "" : "s"}`
            : `of ${totalCount} result${totalCount === 1 ? "" : "s"}`}
        </p>
        <p className="text-xs text-muted-foreground italic hidden sm:block">
          Results link to original open-access sources only
        </p>
      </div>

      {/* Article cards */}
      <div className="flex flex-col gap-4" data-testid="list-articles">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
