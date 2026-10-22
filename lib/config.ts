// Tunable constants for the MCT dashboard. These are placeholders per the
// build spec and are expected to change later — keep every cross-cutting
// threshold here instead of inline in queries/components.

// A person-day only counts (toward Working Days, D Score averages, totals,
// trends) if weighted_count > DAY_THRESHOLD OR tasks_count > DAY_THRESHOLD.
export const DAY_THRESHOLD = 16;

// Department D Score colour (applied to the big number on the D Score card).
export const DEPT_CUTOFF_GREEN = 70; // >= this => Green
export const DEPT_CUTOFF_AMBER = 50; // >= this (and < green) => Amber; below => Red

// Employee D Score colour — top/bottom quartile of the quarter-to-date
// population are Green/Red, the rest Amber (see lib/band.ts).
export const BAND_PERCENTILE = 0.25;

// Data in eod_mct starts here; the "All Months" filter window and its label
// are anchored to this date instead of a fiscal-year April 1.
export const DATA_START_DATE = "2026-10-01";
