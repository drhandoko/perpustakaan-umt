/**
 * Result card — renders differently based on `article.contentType`:
 *
 *   article → title, authors, journal, year, DOI, license, language, PDF link
 *             CTA: "Open Article"
 *
 *   journal → title, publisher, subjects, language, license
 *             CTA: "Open Journal"
 *
 *   book    → title, authors/editors, publisher, year, language, license, ISBN
 *             Source badge per book (DOAB / OAPEN / …)
 *             CTA: "Open Book"
 *
 * All links open in a new tab with rel="noopener noreferrer".
 * No external pages are ever embedded.
 */

import { ExternalLink, Calendar, Globe, Scale, FileDown, Tag, MapPin, BookMarked } from "lucide-react";
import type { Article, ContentType, JournalQuartile } from "../data/mockArticles";

interface ArticleCardProps {
  article: Article;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function contentTypeBadgeClass(ct: ContentType): string {
  if (ct === "journal") return "bg-primary/8 text-primary border-primary/15";
  if (ct === "book")    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-violet-50 text-violet-700 border-violet-200";
}

function contentTypeLabel(ct: ContentType): string {
  if (ct === "journal") return "Journal";
  if (ct === "book")    return "Book";
  return "Article";
}

function ctaLabel(ct: ContentType): string {
  if (ct === "journal") return "Open Journal";
  if (ct === "book")    return "Open Book";
  return "Open Article";
}

function licenseBadgeClass(license: string): string {
  if (license.startsWith("CC BY 4"))      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (license.startsWith("CC BY-NC-ND"))  return "bg-rose-50 text-rose-700 border-rose-200";
  if (license.startsWith("CC BY-NC"))     return "bg-amber-50 text-amber-700 border-amber-200";
  if (license.startsWith("CC BY-SA"))     return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-muted text-muted-foreground border-border";
}

/**
 * Returns Tailwind classes for an SJR quartile badge.
 * Q1 = emerald (top), Q2 = sky, Q3 = amber, Q4 = rose (bottom).
 */
function quartileBadgeClass(q: JournalQuartile): string {
  if (q === "Q1") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (q === "Q2") return "bg-sky-50 text-sky-700 border-sky-200";
  if (q === "Q3") return "bg-amber-50 text-amber-700 border-amber-200";
  return            "bg-rose-50 text-rose-700 border-rose-200";
}

/** Source badge colour per book index provider. */
function sourceBadgeClass(source: string): string {
  const s = source.toUpperCase();
  if (s === "DOAB")  return "bg-teal-50 text-teal-700 border-teal-200";
  if (s === "OAPEN") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (s === "DOAJ")  return "bg-primary/8 text-primary border-primary/15";
  return "bg-muted text-muted-foreground border-border";
}

const badgeBase = "text-[11px] font-semibold uppercase tracking-wider border rounded-full px-3 py-1";

// ─── Shared metadata pill ─────────────────────────────────────────────────────

function MetaPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
      {icon}
      <span>{children}</span>
    </span>
  );
}

// ─── Card body variants ───────────────────────────────────────────────────────

function ArticleBody({ article }: { article: Article }) {
  const { id, authors, journal, year, language } = article;
  const authorString =
    authors.length > 3 ? `${authors.slice(0, 3).join(", ")} et al.` : authors.join(", ");

  return (
    <>
      <p className="text-sm text-muted-foreground mb-3" data-testid={`text-authors-${id}`}>
        {authorString}
      </p>
      <div className="flex flex-wrap gap-2.5 mb-5">
        <MetaPill icon={<Globe className="w-3 h-3 shrink-0" />}>{journal}</MetaPill>
        <MetaPill icon={<Calendar className="w-3 h-3 shrink-0" />}>
          <span data-testid={`text-year-${id}`}>{year !== 0 ? year : "Not available"}</span>
        </MetaPill>
        {language !== "Not available" && (
          <MetaPill icon={<Globe className="w-3 h-3 shrink-0" />}>{language}</MetaPill>
        )}
      </div>
    </>
  );
}

function JournalBody({ article }: { article: Article }) {
  const { publisher, subjects, country, language } = article;
  return (
    <>
      <div className="flex flex-wrap gap-2.5 mb-5">
        {publisher && publisher !== "Not available" && (
          <MetaPill icon={<Globe className="w-3 h-3 shrink-0" />}>{publisher}</MetaPill>
        )}
        {country && (
          <MetaPill icon={<MapPin className="w-3 h-3 shrink-0" />}>{country}</MetaPill>
        )}
        {language !== "Not available" && (
          <MetaPill icon={<Globe className="w-3 h-3 shrink-0" />}>{language}</MetaPill>
        )}
      </div>
      {subjects && subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {subjects.slice(0, 5).map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 text-[11px] bg-secondary text-secondary-foreground border border-border rounded-full px-2.5 py-0.5"
            >
              <Tag className="w-2.5 h-2.5" aria-hidden="true" />
              {s}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function BookBody({ article }: { article: Article }) {
  const { id, authors, publisher, year, language, isbn, subjects } = article;
  const authorString = (() => {
    if (authors.length === 0 || authors[0] === "Not available") return "Not available";
    return authors.length > 3 ? `${authors.slice(0, 3).join(", ")} et al.` : authors.join(", ");
  })();

  return (
    <>
      <p className="text-sm text-muted-foreground mb-3" data-testid={`text-authors-${id}`}>
        {authorString}
      </p>
      <div className="flex flex-wrap gap-2.5 mb-4">
        {publisher && publisher !== "Not available" && (
          <MetaPill icon={<Globe className="w-3 h-3 shrink-0" />}>{publisher}</MetaPill>
        )}
        <MetaPill icon={<Calendar className="w-3 h-3 shrink-0" />}>
          <span data-testid={`text-year-${id}`}>{year !== 0 ? year : "Not available"}</span>
        </MetaPill>
        {language !== "Not available" && (
          <MetaPill icon={<Globe className="w-3 h-3 shrink-0" />}>{language}</MetaPill>
        )}
        {isbn && (
          <MetaPill icon={<BookMarked className="w-3 h-3 shrink-0" />}>
            ISBN {isbn.length === 13
              ? `${isbn.slice(0,3)}-${isbn.slice(3,4)}-${isbn.slice(4,9)}-${isbn.slice(9,12)}-${isbn.slice(12)}`
              : isbn}
          </MetaPill>
        )}
      </div>
      {subjects && subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {subjects.slice(0, 4).map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 text-[11px] bg-secondary text-secondary-foreground border border-border rounded-full px-2.5 py-0.5"
            >
              <Tag className="w-2.5 h-2.5" aria-hidden="true" />
              {s}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function ArticleCard({ article }: ArticleCardProps) {
  const { id, title, contentType, doi, sourceUrl, pdfUrl, license, abstract, source, journalQuartile } = article;

  return (
    <article
      className="bg-card border border-card-border rounded-2xl p-7 shadow-sm hover:shadow-lg transition-shadow duration-200 group"
      data-testid={`card-article-${id}`}
    >
      {/* ── Top badges ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Content type badge */}
        <span className={`${badgeBase} ${contentTypeBadgeClass(contentType)}`}>
          {contentTypeLabel(contentType)}
        </span>

        {/* Source badge — always shown; especially useful in Books mode to distinguish DOAB/OAPEN */}
        {source && (
          <span
            className={`${badgeBase} ${sourceBadgeClass(source)}`}
            data-testid={`badge-source-${id}`}
          >
            {source}
          </span>
        )}

        {/* SJR quartile badge — journals only, shown only when quartile data is available */}
        {contentType === "journal" && journalQuartile && (
          <span
            className={`${badgeBase} ${quartileBadgeClass(journalQuartile)}`}
            data-testid={`badge-quartile-${id}`}
            title="SJR (Scimago Journal Rankings) quartile"
          >
            {journalQuartile}
          </span>
        )}

        {/* License badge */}
        {license && (
          <span
            className={`${badgeBase} ${licenseBadgeClass(license)}`}
            data-testid={`badge-license-${id}`}
          >
            {license}
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

      {/* ── Abstract ── */}
      {abstract && (
        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2 mb-4">
          {abstract}
        </p>
      )}

      {/* ── Body varies by content type ── */}
      <div className="border-t border-border my-4" />

      {contentType === "article" && <ArticleBody article={article} />}
      {contentType === "journal" && <JournalBody article={article} />}
      {contentType === "book"    && <BookBody    article={article} />}

      {/* ── Footer: identifier + PDF link + CTA ── */}
      <div className="flex items-center justify-between gap-4 mt-1">
        <div className="flex items-center gap-3 min-w-0">
          {/* Primary identifier: DOI preferred, then ISBN, then placeholder */}
          {doi ? (
            <span className="text-[11px] font-mono text-muted-foreground/70 truncate" data-testid={`text-doi-${id}`}>
              DOI: {doi}
            </span>
          ) : article.isbn ? (
            <span className="text-[11px] font-mono text-muted-foreground/70 truncate">
              ISBN: {article.isbn}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/50 italic">No identifier</span>
          )}

          {/* Inline PDF link for articles */}
          {contentType === "article" && pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
              data-testid={`link-pdf-${id}`}
              aria-label={`Download PDF for "${title}"`}
            >
              <FileDown className="w-3 h-3" aria-hidden="true" />
              PDF
            </a>
          )}

          {/* License label inline (journals / books — license badge already in top badges) */}
          {contentType === "journal" && license && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <Scale className="w-3 h-3" aria-hidden="true" />
              {license}
            </span>
          )}
        </div>

        {/* CTA — opens source in new tab, never embedded */}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/6 border border-primary/20 hover:bg-primary hover:text-primary-foreground px-4 py-2 rounded-lg transition-colors duration-150"
          data-testid={`link-open-source-${id}`}
          aria-label={`${ctaLabel(contentType)}: "${title}" opens in a new tab`}
        >
          {ctaLabel(contentType)}
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
