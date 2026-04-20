/**
 * Maps Journal Impact Factor (2-year mean citedness from OpenAlex) to an
 * approximate Q1–Q4 quality tier.
 *
 * CALIBRATION
 * -----------
 * OpenAlex indexes ~21,000 DOAJ-listed journals.  The distribution of
 * 2yr_mean_citedness across this population is heavily right-skewed:
 *
 *   Percentile  Approx JIF   Tier
 *   ─────────── ──────────── ────
 *   75–100 %    ≥ 2.5        Q1
 *   50–75  %    0.7 – 2.49   Q2
 *   25–50  %    0.12 – 0.69  Q3
 *   0–25   %    0 – 0.11     Q4   (found in OpenAlex but very low impact)
 *   —           not in OA    Unranked
 *
 * Thresholds are deliberately conservative (undercount Q1 rather than
 * overcounting).  The source is labelled "OpenAlex" in every result so users
 * know these are indicative tiers, not official SJR quartiles.
 */

export type JournalTier = "Q1" | "Q2" | "Q3" | "Q4";

/**
 * Returns the quality tier for a given JIF value, or `null` when the JIF is
 * zero / negative (treated as "no meaningful impact data").
 */
export function mapJifToTier(jif: number): JournalTier | null {
  if (jif >= 2.5)  return "Q1";
  if (jif >= 0.7)  return "Q2";
  if (jif >= 0.12) return "Q3";
  if (jif >  0)    return "Q4";
  return null;
}
