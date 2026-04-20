/**
 * Deduplication logic for merged book results.
 *
 * When the same book is indexed by both DOAB and OAPEN (which is common —
 * both index many of the same titles from the same publishers), we keep
 * only the first occurrence seen.
 *
 * Deduplication priority:
 *   1. DOI (exact match, case-insensitive)       — most reliable
 *   2. ISBN (digits only, case-insensitive)       — very reliable
 *   3. Normalised title + publisher pair          — fallback heuristic
 *
 * Books that match on any key are considered duplicates.
 * The first record in the input array wins (earlier source has priority).
 */

import type { BookRecord } from "./types.js";

// ─── Key normalisation helpers ────────────────────────────────────────────────

/** Normalise a title for fuzzy matching: lowercase, collapse whitespace, take first 60 chars. */
function normTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** Normalise a publisher name for fuzzy matching. */
function normPublisher(pub: string): string {
  return pub
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .slice(0, 30);
}

// ─── Main deduplication function ─────────────────────────────────────────────

/**
 * Remove duplicate books from a flat array.
 *
 * Input order determines precedence — earlier items are kept when
 * a duplicate is found.  The function is O(n) per record (constant
 * Set lookups) so it scales well to hundreds of results.
 *
 * @param books  Flat array of BookRecords from all sources, ordered by priority.
 * @returns      New array with duplicates removed.
 */
export function deduplicateBooks(books: BookRecord[]): BookRecord[] {
  const seenDoi             = new Set<string>();
  const seenIsbn            = new Set<string>();
  const seenTitlePublisher  = new Set<string>();

  const result: BookRecord[] = [];

  for (const book of books) {
    // ── Key 1: DOI ──────────────────────────────────────────────────────────
    if (book.doi) {
      const key = book.doi.toLowerCase();
      if (seenDoi.has(key)) continue;
      seenDoi.add(key);
    }

    // ── Key 2: ISBN ─────────────────────────────────────────────────────────
    if (book.isbn) {
      const key = book.isbn.toUpperCase();
      if (seenIsbn.has(key)) continue;
      seenIsbn.add(key);
    }

    // ── Key 3: Normalised title + publisher ──────────────────────────────────
    const titleKey = `${normTitle(book.title)}|${normPublisher(book.publisher)}`;
    if (seenTitlePublisher.has(titleKey)) continue;
    seenTitlePublisher.add(titleKey);

    result.push(book);
  }

  return result;
}
