/**
 * Left sidebar filter panel.
 *
 * Sections:
 *   - Source (DOAJ / Crossref checkboxes) — controls which APIs are called
 *   - Publication Year range
 *   - Language radio buttons
 *   - License radio buttons
 *
 * All values are "pending" until the user clicks "Apply Filters".
 * The dirty indicator fires as soon as any pending value differs from the
 * last committed (applied) snapshot.
 */

import { SlidersHorizontal, Check } from "lucide-react";
import type { SearchFilters, SourceSelection } from "../lib/search";
import { LANGUAGES, LICENSES, YEAR_MIN, YEAR_MAX } from "../data/mockArticles";

interface FilterSidebarProps {
  filters: SearchFilters;
  sources: SourceSelection;
  dirty: boolean;
  onChange: (updated: Partial<SearchFilters>) => void;
  onSourceChange: (updated: Partial<SourceSelection>) => void;
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

export function FilterSidebar({
  filters,
  sources,
  dirty,
  onChange,
  onSourceChange,
  onApply,
}: FilterSidebarProps) {
  const atLeastOneSource = sources.doaj || sources.crossref;

  function handleSourceToggle(key: keyof SourceSelection) {
    const next = { ...sources, [key]: !sources[key] };
    // Prevent unchecking the last selected source
    if (!next.doaj && !next.crossref) return;
    onSourceChange({ [key]: !sources[key] });
  }

  return (
    <aside
      className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border h-full flex flex-col"
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

        {/* ── Source ── */}
        <FilterSection label="Source">
          <div className="flex flex-col gap-2.5">
            {/* DOAJ */}
            <label
              className="flex items-start gap-2.5 cursor-pointer group"
              data-testid="filter-source-doaj-label"
            >
              <input
                type="checkbox"
                checked={sources.doaj}
                onChange={() => handleSourceToggle("doaj")}
                disabled={sources.doaj && !sources.crossref}
                className="accent-primary w-3.5 h-3.5 mt-0.5 shrink-0"
                data-testid="filter-source-doaj"
                aria-label="Include DOAJ results"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors leading-tight">
                  DOAJ
                </span>
                <span className="text-[10px] text-muted-foreground/60 leading-tight">
                  Open-access curated index
                </span>
              </span>
            </label>

            {/* Crossref */}
            <label
              className="flex items-start gap-2.5 cursor-pointer group"
              data-testid="filter-source-crossref-label"
            >
              <input
                type="checkbox"
                checked={sources.crossref}
                onChange={() => handleSourceToggle("crossref")}
                disabled={sources.crossref && !sources.doaj}
                className="accent-primary w-3.5 h-3.5 mt-0.5 shrink-0"
                data-testid="filter-source-crossref"
                aria-label="Include Crossref results"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors leading-tight">
                  Crossref
                </span>
                <span className="text-[10px] text-muted-foreground/60 leading-tight">
                  Scholarly metadata registry
                </span>
              </span>
            </label>

            {!atLeastOneSource && (
              <p className="text-[10px] text-rose-500 leading-snug">
                At least one source must be selected.
              </p>
            )}
          </div>
        </FilterSection>

        {/* ── Publication Year ── */}
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

        {/* ── Language ── */}
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

        {/* ── License ── */}
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

        {/* Footer note + Apply Filters */}
        <div className="py-5 flex flex-col gap-4">
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            Results are fetched from{" "}
            <a
              href="https://doaj.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              DOAJ
            </a>{" "}
            and{" "}
            <a
              href="https://www.crossref.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              Crossref
            </a>{" "}
            public APIs. No API key required.
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
            aria-label="Apply filters to current results"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Apply Filters
          </button>
        </div>
      </div>
    </aside>
  );
}
