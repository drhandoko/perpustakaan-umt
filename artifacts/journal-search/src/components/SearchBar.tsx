/**
 * Search bar — polished university library portal style.
 */

import { useState } from "react";
import { Search, X, RotateCcw } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export function SearchBar({ value, onChange, onSearch, onReset }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSearch();
  }

  return (
    <div className="w-full" data-testid="search-bar">
      {/* Input row */}
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
          data-testid="input-search-keyword"
          aria-label="Search keyword"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
            data-testid="button-clear-query"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Button row */}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all"
          data-testid="button-search"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          Search
        </button>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 bg-card text-foreground/70 hover:text-foreground hover:bg-muted border border-border text-sm font-medium px-5 py-2.5 rounded-lg transition-all"
          data-testid="button-reset"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>
  );
}
