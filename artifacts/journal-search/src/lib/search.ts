/**
 * Search and filtering logic for the Open Access Journal Search portal.
 *
 * ─────────────────────────────────────────────────────────
 * HOW TO INTEGRATE A REAL API
 * ─────────────────────────────────────────────────────────
 * Replace the body of `searchArticles` with a real API call, for example:
 *
 *   const params = new URLSearchParams({ q: query, year_min, year_max, ... });
 *   const res = await fetch(`https://api.core.ac.uk/v3/search/works?${params}`, {
 *     headers: { Authorization: `Bearer ${import.meta.env.VITE_CORE_API_KEY}` }
 *   });
 *   const json = await res.json();
 *   return json.results.map(transformCoreResult); // adapt to Article shape
 *
 * Candidate APIs:
 *   - CORE        https://core.ac.uk/services/api
 *   - OpenAlex    https://docs.openalex.org/
 *   - EuropePMC   https://europepmc.org/RestfulWebService
 *   - Unpaywall   https://unpaywall.org/products/api
 * ─────────────────────────────────────────────────────────
 */

import type { Article } from "../data/mockArticles";
import { mockArticles } from "../data/mockArticles";

export interface SearchFilters {
  query: string;
  source: string;
  yearFrom: number | "";
  yearTo: number | "";
  language: string;
  license: string;
}

/**
 * Searches and filters articles.
 * Currently uses in-memory mock data; swap the implementation for a real API.
 */
export function searchArticles(filters: SearchFilters): Article[] {
  const { query, source, yearFrom, yearTo, language, license } = filters;

  const q = query.trim().toLowerCase();

  return mockArticles.filter((article) => {
    // Full-text search across title, authors, journal, abstract
    if (q) {
      const searchTarget = [
        article.title,
        article.authors.join(" "),
        article.journal,
        article.abstract ?? "",
      ]
        .join(" ")
        .toLowerCase();

      if (!searchTarget.includes(q)) return false;
    }

    // Source filter
    if (source && source !== "All" && article.source !== source) return false;

    // Year range filter
    if (yearFrom !== "" && article.year < yearFrom) return false;
    if (yearTo !== "" && article.year > yearTo) return false;

    // Language filter
    if (language && language !== "All" && article.language !== language) return false;

    // License filter
    if (license && license !== "All") {
      if (!article.license || article.license !== license) return false;
    }

    return true;
  });
}
