/**
 * Search bar with an integrated Search Type selector.
 *
 * The search type (Journals / Books / Articles) is shown as a styled
 * pill dropdown to the left of the text input, so users immediately see
 * what kind of content they are searching before they type.
 */

import { useState } from "react";
import { Search, RotateCcw, Loader2, ChevronDown } from "lucide-react";
import type { SearchType } from "../lib/search";
import { SEARCH_TYPE_OPTIONS } from "../lib/search";

interface SearchBarProps {
  value: string;
  searchType: SearchType;
  onChange: (value: string) => void;
  onSearchTypeChange: (type: SearchType) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}

export function SearchBar({
  value,
  searchType,
  onChange,
  onSearchTypeChange,
  onSearch,
  onReset,
  loading = false,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !loading) onSearch();
  }

  const currentLabel =
    SEARCH_TYPE_OPTIONS.find((o) => o.value === searchType)?.label ?? "Articles";

  // Placeholder adapts to selected type
  const placeholders: Record<SearchType, string> = {
    journals: "Search journals by keyword, title, or subject…",
    books:    "Search books by keyword, author, or title…",
    articles: "Search articles by keyword, author, or title…",
  };

  return (
    <div className="w-full" data-testid="search-bar">
      {/* Input row with embedded type selector */}
      <div
        className={`flex items-center gap-0 bg-card border rounded-xl transition-all duration-150 overflow-hidden ${
          focused
            ? "ring-2 ring-primary/25 border-primary shadow-md"
            : "border-border shadow-sm"
        }`}
      >
        {/* Search type dropdown — pill inside the input box */}
        <div className="relative shrink-0 border-r border-border">
          <select
            value={searchType}
            onChange={(e) => onSearchTypeChange(e.target.value as SearchType)}
            disabled={loading}
            className="appearance-none bg-muted text-foreground/80 text-sm font-semibold pl-4 pr-7 py-3.5 focus:outline-none cursor-pointer hover:text-primary transition-colors disabled:opacity-50"
            data-testid="select-search-type"
            aria-label="Search type"
          >
            {SEARCH_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom chevron icon */}
          <ChevronDown
            className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Search icon */}
        <Search
          className={`w-4 h-4 shrink-0 ml-4 transition-colors duration-150 ${
            focused ? "text-primary" : "text-muted-foreground"
          }`}
          aria-hidden="true"
        />

        {/* Text input */}
        <input
          type="search"
          placeholder={placeholders[searchType]}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none px-3 py-3.5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={loading}
          data-testid="input-search-keyword"
          aria-label={`Search ${currentLabel.toLowerCase()}`}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all"
          data-testid="button-search"
          aria-label={loading ? "Searching…" : `Search ${currentLabel}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Searching…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" aria-hidden="true" />
              Search
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-card text-foreground/70 hover:text-foreground hover:bg-muted border border-border disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium px-5 py-2.5 rounded-lg transition-all"
          data-testid="button-reset"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>
  );
}
