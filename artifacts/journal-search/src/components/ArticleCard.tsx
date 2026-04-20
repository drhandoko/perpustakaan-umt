/**
 * Article result card component.
 * Displays title, authors, journal, year, DOI, source, license,
 * and an "Open at source" button that opens the original publisher page in a new tab.
 *
 * NOTE: No PDFs or publisher content are embedded. The button always opens
 * the original source URL in a new browser tab.
 */

import { ExternalLink, FileText, Calendar, Globe, Tag, Scale } from "lucide-react";
import type { Article } from "../data/mockArticles";

interface ArticleCardProps {
  article: Article;
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

/** Maps license strings to badge colors */
function licenseBadgeClass(license: string): string {
  if (license.startsWith("CC BY 4")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (license.startsWith("CC BY-NC")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (license.startsWith("CC BY-SA")) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-muted text-muted-foreground border-border";
}

export function ArticleCard({ article }: ArticleCardProps) {
  const {
    id,
    title,
    authors,
    journal,
    year,
    doi,
    sourceUrl,
    source,
    license,
    language,
    abstract,
  } = article;

  const authorString =
    authors.length > 3
      ? `${authors.slice(0, 3).join(", ")} et al.`
      : authors.join(", ");

  return (
    <article
      className="bg-card border border-card-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
      data-testid={`card-article-${id}`}
    >
      {/* Top badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {/* Source badge */}
        <span
          className="text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5"
          data-testid={`badge-source-${id}`}
        >
          {source}
        </span>

        {/* License badge (only if available) */}
        {license && (
          <span
            className={`text-xs font-medium border rounded-full px-2.5 py-0.5 ${licenseBadgeClass(license)}`}
            data-testid={`badge-license-${id}`}
          >
            {license}
          </span>
        )}

        {/* Language badge — only shown when not English */}
        {language !== "English" && (
          <span
            className="text-xs font-medium bg-secondary text-secondary-foreground border border-border rounded-full px-2.5 py-0.5"
            data-testid={`badge-language-${id}`}
          >
            {language}
          </span>
        )}
      </div>

      {/* Article title */}
      <h2
        className="text-base font-serif font-semibold text-foreground leading-snug mb-1"
        data-testid={`text-title-${id}`}
      >
        {title}
      </h2>

      {/* Authors */}
      <p
        className="text-sm text-muted-foreground mb-3"
        data-testid={`text-authors-${id}`}
      >
        {authorString}
      </p>

      {/* Abstract (truncated) */}
      {abstract && (
        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2 mb-3">
          {abstract}
        </p>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-4">
        <MetaItem icon={FileText} label="Journal" value={journal} />
        <MetaItem icon={Calendar} label="Year" value={String(year)} />
        {doi && (
          <MetaItem icon={Globe} label="DOI" value={doi} />
        )}
        {language && (
          <MetaItem icon={Tag} label="Language" value={language} />
        )}
        {license && (
          <MetaItem icon={Scale} label="License" value={license} />
        )}
      </div>

      {/* Footer — open at source */}
      <div className="flex items-center justify-between">
        {doi ? (
          <span
            className="text-xs text-muted-foreground font-mono"
            data-testid={`text-doi-${id}`}
          >
            DOI: {doi}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">No DOI available</span>
        )}

        {/**
         * Opens the original publisher/repository page in a new tab.
         * We never embed external content in an iframe.
         */}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded-lg transition-colors duration-150"
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
