/**
 * Left sidebar filter panel.
 * Filters: Source, Publication Year (from/to), Language, License.
 */

import { Filter } from "lucide-react";
import type { SearchFilters } from "../lib/search";
import { SOURCES, LANGUAGES, LICENSES, YEAR_MIN, YEAR_MAX } from "../data/mockArticles";

interface FilterSidebarProps {
  filters: SearchFilters;
  onChange: (updated: Partial<SearchFilters>) => void;
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 border-b border-border last:border-b-0">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        {label}
      </h3>
      {children}
    </div>
  );
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  return (
    <aside
      className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border min-h-full"
      data-testid="filter-sidebar"
      aria-label="Search filters"
    >
      {/* Sidebar header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-sidebar-border">
        <Filter className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground">Filters</span>
      </div>

      <div className="px-5">
        {/* Source filter */}
        <FilterSection label="Source">
          <div className="flex flex-col gap-1.5">
            {SOURCES.map((src) => (
              <label
                key={src}
                className="flex items-center gap-2 cursor-pointer group"
                data-testid={`filter-source-${src.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <input
                  type="radio"
                  name="source"
                  value={src}
                  checked={filters.source === src}
                  onChange={() => onChange({ source: src })}
                  className="accent-primary w-3.5 h-3.5"
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {src}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Year range filter */}
        <FilterSection label="Publication Year">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="year-from" className="text-xs text-muted-foreground">
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
                  onChange({
                    yearFrom: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="w-full text-sm bg-card border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid="filter-year-from"
              />
            </div>
            <span className="text-muted-foreground mt-5">–</span>
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="year-to" className="text-xs text-muted-foreground">
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
                  onChange({
                    yearTo: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="w-full text-sm bg-card border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid="filter-year-to"
              />
            </div>
          </div>
        </FilterSection>

        {/* Language filter */}
        <FilterSection label="Language">
          <div className="flex flex-col gap-1.5">
            {LANGUAGES.map((lang) => (
              <label
                key={lang}
                className="flex items-center gap-2 cursor-pointer group"
                data-testid={`filter-language-${lang.toLowerCase()}`}
              >
                <input
                  type="radio"
                  name="language"
                  value={lang}
                  checked={filters.language === lang}
                  onChange={() => onChange({ language: lang })}
                  className="accent-primary w-3.5 h-3.5"
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {lang}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* License filter */}
        <FilterSection label="License">
          <div className="flex flex-col gap-1.5">
            {LICENSES.map((lic) => (
              <label
                key={lic}
                className="flex items-center gap-2 cursor-pointer group"
                data-testid={`filter-license-${lic.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <input
                  type="radio"
                  name="license"
                  value={lic}
                  checked={filters.license === lic}
                  onChange={() => onChange({ license: lic })}
                  className="accent-primary w-3.5 h-3.5"
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {lic}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>
    </aside>
  );
}
