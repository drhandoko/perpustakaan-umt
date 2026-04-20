/**
 * Left sidebar filter panel.
 *
 * Filters are dynamic — only sections relevant to the active SearchType
 * are rendered:
 *
 *   journals : Language
 *   books    : Source, Publication Year, Language
 *   articles : Publication Year, Language, License
 *
 * All filter changes are "pending" until the user clicks "Apply Filters".
 * The dirty indicator fires whenever pending differs from applied.
 */

import { SlidersHorizontal, Check, ExternalLink } from "lucide-react";
import type { SearchFilters, SearchType } from "../lib/search";
import { LANGUAGES, LICENSES, BOOK_SOURCES, YEAR_MIN, YEAR_MAX } from "../data/mockArticles";

interface FilterSidebarProps {
  searchType: SearchType;
  filters: SearchFilters;
  dirty: boolean;
  onChange: (updated: Partial<SearchFilters>) => void;
  onApply: () => void;
}

// ─── Generic UI primitives ────────────────────────────────────────────────────

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-sidebar-border last:border-b-0">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
        {label}
      </h3>
      {children}
    </div>
  );
}

// ─── Multi-select checkbox list ───────────────────────────────────────────────

function CheckboxList({
  options,
  selected,
  onToggle,
  onClear,
  testIdPrefix,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  testIdPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {selected.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-[10px] text-primary underline underline-offset-2 hover:opacity-70 transition-opacity mb-0.5"
        >
          Clear selection
        </button>
      )}
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            value={opt}
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            className="accent-primary w-3.5 h-3.5 shrink-0 rounded"
            data-testid={`${testIdPrefix}-${opt.replace(/\s+/g, "-").toLowerCase()}`}
          />
          <span className="text-sm text-foreground/80 group-hover:text-primary transition-colors">
            {opt}
          </span>
        </label>
      ))}
    </div>
  );
}

// ─── Book source filter ───────────────────────────────────────────────────────
// Active sources get a real checkbox; inactive ("coming soon") are shown
// disabled with a badge so users know more sources are planned.

function BookSourceFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {BOOK_SOURCES.map((source) => (
        <div key={source.id} className="flex items-center justify-between gap-2">
          {source.active ? (
            <label className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0">
              <input
                type="checkbox"
                value={source.id}
                checked={selected.includes(source.id)}
                onChange={() => toggle(source.id)}
                className="accent-primary w-3.5 h-3.5 shrink-0 rounded"
                data-testid={`filter-source-${source.id}`}
              />
              <span className="text-sm text-foreground/80 group-hover:text-primary transition-colors truncate">
                {source.label}
              </span>
            </label>
          ) : (
            <div className="flex items-center gap-2.5 flex-1 min-w-0 opacity-50">
              <input
                type="checkbox"
                disabled
                className="w-3.5 h-3.5 shrink-0"
                aria-label={`${source.label} (coming soon)`}
              />
              <span className="text-sm text-muted-foreground truncate">
                {source.label}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {!source.active && (
              <span className="text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                Soon
              </span>
            )}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/50 hover:text-primary transition-colors"
              aria-label={`Open ${source.label} website`}
              title={source.url}
            >
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      ))}

      {/* Warning when no active source selected */}
      {BOOK_SOURCES.filter((s) => s.active && selected.includes(s.id)).length === 0 && (
        <p className="text-[11px] text-amber-600 leading-snug mt-1">
          Select at least one source to search.
        </p>
      )}
    </div>
  );
}

// ─── Year range filter ────────────────────────────────────────────────────────

function YearRangeFilter({
  yearFrom,
  yearTo,
  onChange,
}: {
  yearFrom: number | "";
  yearTo: number | "";
  onChange: (update: Partial<Pick<SearchFilters, "yearFrom" | "yearTo">>) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col gap-1 flex-1">
        <label htmlFor="year-from" className="text-[11px] text-muted-foreground font-medium">From</label>
        <input
          id="year-from"
          type="number"
          min={YEAR_MIN} max={YEAR_MAX}
          placeholder={String(YEAR_MIN)}
          value={yearFrom}
          onChange={(e) =>
            onChange({ yearFrom: e.target.value === "" ? "" : Number(e.target.value) })
          }
          className="w-full text-sm bg-card border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          data-testid="filter-year-from"
        />
      </div>
      <span className="text-muted-foreground mt-5 text-sm">–</span>
      <div className="flex flex-col gap-1 flex-1">
        <label htmlFor="year-to" className="text-[11px] text-muted-foreground font-medium">To</label>
        <input
          id="year-to"
          type="number"
          min={YEAR_MIN} max={YEAR_MAX}
          placeholder={String(YEAR_MAX)}
          value={yearTo}
          onChange={(e) =>
            onChange({ yearTo: e.target.value === "" ? "" : Number(e.target.value) })
          }
          className="w-full text-sm bg-card border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          data-testid="filter-year-to"
        />
      </div>
    </div>
  );
}

// ─── Source info footer ───────────────────────────────────────────────────────

const FOOTER_SOURCE: Record<SearchType, { label: string; href: string }[]> = {
  journals: [{ label: "DOAJ",     href: "https://doaj.org" }],
  books:    [
    { label: "DOAB",  href: "https://directory.doabooks.org" },
    { label: "OAPEN", href: "https://library.oapen.org" },
  ],
  articles: [{ label: "Crossref", href: "https://www.crossref.org" }],
};

// ─── Main component ───────────────────────────────────────────────────────────

export function FilterSidebar({
  searchType,
  filters,
  dirty,
  onChange,
  onApply,
}: FilterSidebarProps) {
  function toggleLanguage(lang: string) {
    const next = filters.language.includes(lang)
      ? filters.language.filter((l) => l !== lang)
      : [...filters.language, lang];
    onChange({ language: next });
  }

  function toggleLicense(lic: string) {
    const next = filters.license.includes(lic)
      ? filters.license.filter((l) => l !== lic)
      : [...filters.license, lic];
    onChange({ license: next });
  }

  const showYear    = searchType === "books" || searchType === "articles";
  const showLicense = searchType === "articles";
  const showSources = searchType === "books";
  const sources     = FOOTER_SOURCE[searchType];

  return (
    <aside
      className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border h-full flex flex-col"
      data-testid="filter-sidebar"
      aria-label="Search filters"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-sidebar-border">
        <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground tracking-tight">
          Refine Results
        </span>
      </div>

      {/* Scrollable filter content */}
      <div className="flex-1 overflow-y-auto px-6">

        {/* ── Book Sources (books only) ── */}
        {showSources && (
          <FilterSection label="Source">
            <BookSourceFilter
              selected={filters.bookSources}
              onChange={(next) => onChange({ bookSources: next })}
            />
          </FilterSection>
        )}

        {/* ── Publication Year (books + articles only) ── */}
        {showYear && (
          <FilterSection label="Publication Year">
            <YearRangeFilter
              yearFrom={filters.yearFrom}
              yearTo={filters.yearTo}
              onChange={onChange}
            />
          </FilterSection>
        )}

        {/* ── Language (all types) ── */}
        <FilterSection label="Language">
          <CheckboxList
            options={LANGUAGES}
            selected={filters.language}
            onToggle={toggleLanguage}
            onClear={() => onChange({ language: [] })}
            testIdPrefix="filter-language"
          />
        </FilterSection>

        {/* ── License (articles only) ── */}
        {showLicense && (
          <FilterSection label="License">
            <CheckboxList
              options={LICENSES}
              selected={filters.license}
              onToggle={toggleLicense}
              onClear={() => onChange({ license: [] })}
              testIdPrefix="filter-license"
            />
          </FilterSection>
        )}

        {/* ── Footer: source links + Apply button ── */}
        <div className="py-5 flex flex-col gap-4">
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            Results fetched from{" "}
            {sources.map((s, i) => (
              <span key={s.href}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-primary transition-colors"
                >
                  {s.label}
                </a>
                {i < sources.length - 1 ? " and " : ""}
              </span>
            ))}
            {" "}public API. No API key required.
          </p>

          {dirty && (
            <p className="text-[11px] text-amber-600 leading-snug">
              Filter changes not yet applied
            </p>
          )}

          <button
            type="button"
            onClick={onApply}
            data-testid="button-apply-filters"
            className={`w-full inline-flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg transition-all ${
              dirty
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                : "bg-muted text-muted-foreground border border-border cursor-default"
            }`}
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Apply Filters
          </button>
        </div>
      </div>
    </aside>
  );
}
