/**
 * Article result card — polished university library style.
 * All source links open in a new tab. No iframe embedding.
 */

import { ExternalLink, Calendar, Globe, Scale } from "lucide-react";
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
  const { id, title, authors, journal, year, doi, sourceUrl, source, license, language, abstract } = article;

  const authorString =
    authors.length > 3
      ? `${authors.slice(0, 3).join(", ")} et al.`
      : authors.join(", ");

  return (
    <article
      className="bg-card border border-card-border rounded-2xl p-7 shadow-sm hover:shadow-lg transition-shadow duration-200 group"
      data-testid={`card-article-${id}`}
    >
      {/* Top row: source + license + language badges */}
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

        {language !== "English" && (
          <span
            className="text-[11px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border rounded-full px-3 py-1"
            data-testid={`badge-language-${id}`}
          >
            {language}
          </span>
        )}
      </div>

      {/* Title */}
      <h2
        className="text-[17px] font-serif font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors"
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

      {/* Abstract */}
      {abstract && (
        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2 mb-5">
          {abstract}
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-border my-4" />

      {/* Metadata pill row */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Journal */}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
          <Globe className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span>{journal}</span>
        </span>

        {/* Year */}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
          <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span>{year}</span>
        </span>

        {/* License pill */}
        {license && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
            <Scale className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{license}</span>
          </span>
        )}
      </div>

      {/* Footer: DOI + CTA */}
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
