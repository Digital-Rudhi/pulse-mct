import { BAND_PERCENTILE } from './config';

export type Band = 'Green' | 'Amber' | 'Red';

export interface BandCutoffs {
  top: number;    // 75th percentile — scores >= this are Green (top 25%)
  bottom: number; // 25th percentile — scores <= this are Red (bottom 25%)
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// Computes the top/bottom quartile cutoffs across a population of
// quarter-to-date D-Scores (everyone found in eod_mct — MCT has a single
// sub-department, so there's only one curve, unlike Annotation's per-dept grouping).
export function computeBandCutoffs(scores: number[]): BandCutoffs {
  const sorted = [...scores].sort((a, b) => a - b);
  return {
    top: percentile(sorted, 1 - BAND_PERCENTILE),
    bottom: percentile(sorted, BAND_PERCENTILE),
  };
}

// Top 25% (>= top cutoff) => Green, bottom 25% (<= bottom cutoff) => Red, rest => Amber.
export function bandForScore(score: number, cutoffs: BandCutoffs): Band {
  if (cutoffs.top > cutoffs.bottom) {
    if (score >= cutoffs.top) return 'Green';
    if (score <= cutoffs.bottom) return 'Red';
    return 'Amber';
  }
  // Degenerate case (too little spread in the population) — fall back to Amber for everyone.
  return 'Amber';
}
