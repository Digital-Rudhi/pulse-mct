// MCT works all 7 days (no leave/half-day/blackout logic for now). Kept as a
// configurable list — add 'YYYY-MM-DD' entries here if a blackout day is ever
// needed, and every query that uses BLACKOUT_DATES_SQL will exclude it.
export const BLACKOUT_DATES: string[] = [];

export const BLACKOUT_DATES_SQL =
  BLACKOUT_DATES.length > 0
    ? `em.date::date NOT IN (${BLACKOUT_DATES.map((d) => `'${d}'`).join(', ')})`
    : '1=1';
