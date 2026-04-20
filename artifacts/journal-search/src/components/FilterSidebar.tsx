/**
 * Left sidebar filter panel.
 *
 * Filters are "pending" until the user clicks "Apply Filters".
 * A visual indicator appears when pending values differ from the last applied set.
 */

import { SlidersHorizontal, Check } from "lucide-react";
import type { SearchFilters } from "../lib/search";
import { LANGUAGES, LICENSES, YEAR_MIN, YEAR_MAX } from "../data/mockArticles";

interface FilterSidebarProps {
  /** Current pending values (what the user sees / is editing) */
  filters: SearchFilters;
  /** Whether pending values differ from what's currently applied */
  dirty: boolean;
  onChange: (updated: Partial<SearchFilters>) => void;
  onApply: () => void;
}

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

export function FilterSidebar({ filters, dirty, onChange, onApply }: FilterSidebarProps) {
  return (
    <aside
      className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border min-h-full flex flex-col"
      data-testid="filter-sidebar"
      aria-label="Search filters"
    >
      {/* Sidebar title */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-sidebar-border">
        <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground tracking-tight">
          Refine Results
        </span>
      </div>

      {/* Scrollable filter area */}
      <div className="flex-1 overflow-y-auto px-6">
        {/* Publication Year range */}
        <FilterSection label="Publication Year">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="year-from" className="text-[11px] text-muted-foreground font-medium">
                From
              </label>
              <input
                id="year-from"
                type="number"
                min={YEAR_MIN}
                max={YEAR_MAX}
                placeholder={String(YEAR_MIN)}
                value={filters.yearFrom}
                onChange={(e) =>
                  onChange({ yearFrom: e.target.value === "" ? "" : Number(e.target.value) })
                }
                className="w-full text-sm bg-card border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                data-testid="filter-year-from"
              />
            </div>
            <span className="text-muted-foreground mt-5 text-sm">–</span>
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="year-to" className="text-[11px] text-muted-foreground font-medium">
                To
              </label>
              <input
                id="year-to"
                type="number"
                min={YEAR_MIN}
                max={YEAR_MAX}
                placeholder={String(YEAR_MAX)}
                value={filters.yearTo}
                onChange={(e) =>
                  onChange({ yearTo: e.target.value === "" ? "" : Number(e.target.value) })
                }
                className="w-full text-sm bg-card border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                data-testid="filter-year-to"
              />
            </div>
          </div>
        </FilterSection>

        {/* Language */}
        <FilterSection label="Language">
          <div className="flex flex-col gap-2.5">
            {LANGUAGES.map((lang) => (
              <label key={lang} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="language"
                  value={lang}
                  checked={filters.language === lang}
                  onChange={() => onChange({ language: lang })}
                  className="accent-primary w-3.5 h-3.5 shrink-0"
                  data-testid={`filter-language-${lang.toLowerCase()}`}
                />
                <span className="text-sm text-foreground/80 group-hover:text-primary transition-colors">
                  {lang}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* License */}
        <FilterSection label="License">
          <div className="flex flex-col gap-2.5">
            {LICENSES.map((lic) => (
              <label key={lic} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="license"
                  value={lic}
                  checked={filters.license === lic}
                  onChange={() => onChange({ license: lic })}
                  className="accent-primary w-3.5 h-3.5 shrink-0"
                  data-testid={`filter-license-${lic.replace(/\s+/g, "-").toLowerCase()}`}
                />
                <span className="text-sm text-foreground/80 group-hover:text-primary transition-colors">
                  {lic}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* DOAJ note */}
        <div className="py-5">
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            Results are fetched from the{" "}
            <a
              href="https://doaj.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              DOAJ
            </a>{" "}
            public API. No API key required.
          </p>
        </div>
      </div>

      {/* Apply Filters button — sticky at the bottom of the sidebar */}
      <div className="px-6 py-5 border-t border-sidebar-border bg-sidebar">
        {/* "Unsaved changes" hint */}
        {dirty && (
          <p className="text-[11px] text-amber-600 mb-2.5 leading-snug">
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
          aria-label="Apply filters to current results"
        >
          <Check className="w-4 h-4" aria-hidden="true" />
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
