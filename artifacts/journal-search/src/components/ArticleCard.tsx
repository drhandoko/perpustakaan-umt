/**
 * Article result card.
 * Displays metadata and two CTAs:
 *   - PDF download link (opens in new tab) — shown only when a direct PDF link is available
 *   - "Open at source" — always shown; opens the publisher/repository page in a new tab
 *
 * No PDFs or external content are ever embedded.
 */

import { ExternalLink, Calendar, Globe, Scale, FileDown } from "lucide-react";
import type { Article } from "../data/mockArticles";

interface ArticleCardProps {
  article: Article;
}

function licenseBadgeClass(license: string): string {
  if (license.startsWith("CC BY 4")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (license.startsWith("CC BY-NC-ND")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (license.startsWith("CC BY-NC")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (license.startsWith("CC BY-SA")) return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-muted text-muted-foreground border-border";
}

export function ArticleCard({ article }: ArticleCardProps) {
  const {
    id, title, authors, journal, year, doi, sourceUrl, pdfUrl,
    source, license, language, abstract,
  } = article;

  const authorString =
    authors.length > 3
      ? `${authors.slice(0, 3).join(", ")} et al.`
      : authors.join(", ");

  return (
    <article
      className="bg-card border border-card-border rounded-2xl p-7 shadow-sm hover:shadow-lg transition-shadow duration-200 group"
      data-testid={`card-article-${id}`}
    >
      {/* ── Top badges ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider bg-primary/8 text-primary border border-primary/15 rounded-full px-3 py-1"
          data-testid={`badge-source-${id}`}
        >
          {source}
        </span>

        {license && (
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider border rounded-full px-3 py-1 ${licenseBadgeClass(license)}`}
            data-testid={`badge-license-${id}`}
          >
            {license}
          </span>
        )}

        {language !== "English" && language !== "Not available" && (
          <span
            className="text-[11px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border rounded-full px-3 py-1"
            data-testid={`badge-language-${id}`}
          >
            {language}
          </span>
        )}
      </div>

      {/* ── Title ── */}
      <h2
        className="text-[17px] font-serif font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors"
        data-testid={`text-title-${id}`}
      >
        {title}
      </h2>

      {/* ── Authors ── */}
      <p
        className="text-sm text-muted-foreground mb-3"
        data-testid={`text-authors-${id}`}
      >
        {authorString}
      </p>

      {/* ── Abstract ── */}
      {abstract && (
        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2 mb-5">
          {abstract}
        </p>
      )}

      {/* ── Divider ── */}
      <div className="border-t border-border my-4" />

      {/* ── Metadata pills ── */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {/* Journal */}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
          <Globe className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span>{journal}</span>
        </span>

        {/* Year + optional PDF download — grouped together */}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
          <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span data-testid={`text-year-${id}`}>
            {year !== 0 ? year : "Not available"}
          </span>

          {/* PDF link — shown inline next to the year only when available */}
          {pdfUrl && (
            <>
              <span className="mx-1 text-border select-none">·</span>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                data-testid={`link-pdf-${id}`}
                aria-label={`Download PDF for "${title}"`}
                title="Download PDF"
              >
                <FileDown className="w-3 h-3" aria-hidden="true" />
                PDF
              </a>
            </>
          )}
        </span>

        {/* License */}
        {license && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
            <Scale className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{license}</span>
          </span>
        )}
      </div>

      {/* ── Footer: DOI + Open at source ── */}
      <div className="flex items-center justify-between gap-4">
        {doi ? (
          <span
            className="text-[11px] font-mono text-muted-foreground/70 truncate"
            data-testid={`text-doi-${id}`}
          >
            DOI: {doi}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/50 italic">No DOI available</span>
        )}

        {/* Opens the HTML source page in a new tab — never an iframe */}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/6 border border-primary/20 hover:bg-primary hover:text-primary-foreground px-4 py-2 rounded-lg transition-colors duration-150"
          data-testid={`link-open-source-${id}`}
          aria-label={`Open "${title}" at source in a new tab`}
        >
          Open at source
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
