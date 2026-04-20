/**
 * Search bar component with keyword input, search button, and reset button.
 */

import { useState } from "react";
import { Search, X } from "lucide-react";

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
      <div
        className={`flex items-center gap-2 bg-card border rounded-lg px-4 py-3 shadow-sm transition-all duration-150 ${
          focused ? "ring-2 ring-primary border-primary" : "border-border"
        }`}
      >
        {/* Search icon */}
        <Search className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />

        {/* Keyword input */}
        <input
          type="search"
          placeholder="Search by keyword, author, title, or journal..."
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          data-testid="input-search-keyword"
          aria-label="Search keyword"
        />

        {/* Clear current query */}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-clear-query"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-3">
        <button
          type="button"
          onClick={onSearch}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 active:opacity-80 text-sm font-medium px-5 py-2 rounded-lg transition-opacity"
          data-testid="button-search"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          Search
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:opacity-90 active:opacity-80 text-sm font-medium px-5 py-2 rounded-lg border border-border transition-opacity"
          data-testid="button-reset"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>
  );
}
