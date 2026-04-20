/**
 * Search bar — with loading state support.
 * Disables the Search button and shows a spinner while the API call is in flight.
 */

import { useState } from "react";
import { Search, RotateCcw, Loader2 } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  onReset,
  loading = false,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Allow search via Enter key (only when not already loading)
    if (e.key === "Enter" && !loading) onSearch();
  }

  return (
    <div className="w-full" data-testid="search-bar">
      {/* Input field */}
      <div
        className={`flex items-center gap-3 bg-card border rounded-xl px-5 py-3.5 transition-all duration-150 ${
          focused
            ? "ring-2 ring-primary/25 border-primary shadow-md"
            : "border-border shadow-sm"
        }`}
      >
        <Search
          className={`w-5 h-5 shrink-0 transition-colors duration-150 ${
            focused ? "text-primary" : "text-muted-foreground"
          }`}
          aria-hidden="true"
        />

        <input
          type="search"
          placeholder="Search by keyword, author, title, or journal…"
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={loading}
          data-testid="input-search-keyword"
          aria-label="Search keyword"
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 mt-4">
        {/* Search button — shows spinner while loading */}
        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all"
          data-testid="button-search"
          aria-label={loading ? "Searching…" : "Search"}
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

        {/* Reset button */}
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
