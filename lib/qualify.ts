import { DAY_THRESHOLD } from './config';

// A person-day counts only if weighted_count > DAY_THRESHOLD OR tasks_count > DAY_THRESHOLD.
// All other days are ignored everywhere (working days, averages, trends, export).
export const QUALIFYING_DAY_SQL = `(em.weighted_count > ${DAY_THRESHOLD} OR em.tasks_count > ${DAY_THRESHOLD})`;
