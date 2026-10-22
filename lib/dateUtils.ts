// Date helpers used across the dashboard. All functions operate on plain ISO
// date strings (YYYY-MM-DD) to avoid timezone drift between the server (UTC)
// and the browser.
//
// MCT weeks run Monday→Sunday (unlike Annotation's Sunday→Saturday) — see
// mondayOf / weekEndOf below and the weekly bucket SQL in the API routes.

import { DATA_START_DATE } from './config';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseISO(d: string): Date {
  // Treat as local-midnight to keep day arithmetic stable.
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

// Monday of the week (Mon→Sun) that contains `date`.
export function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = d.getDay(); // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

// Sunday that ends a Mon→Sun week given its Monday start (6 days later).
export function weekEndOf(weekStart: Date): Date {
  return addDays(weekStart, 6);
}

// "1-7 Jun" — the calendar date range of the week starting at `weekStartISO`.
export function formatWeekLabel(weekStartISO: string): string {
  const start = parseISO(weekStartISO);
  const end = weekEndOf(start);
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = `${start.getDate()}`;
  const endStr = `${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`;
  return sameMonth
    ? `${startStr}-${endStr}`
    : `${startStr} ${MONTHS_SHORT[start.getMonth()]} - ${endStr}`;
}

export function formatDayShort(dayISO: string): string {
  const d = parseISO(dayISO);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

// ISO 8601 week number of a date (used directly on the Monday week-start,
// since ISO weeks are themselves Monday-based).
export function isoWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function currentMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * "Quarter-to-date minus 1 day" — the fixed window used for D-Score RAG
 * banding. Always: start of the calendar quarter CONTAINING YESTERDAY,
 * through yesterday.
 */
export function quarterToDateMinusOne(): { start: string; end: string } {
  const now = new Date();
  const yesterday = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -1);
  const quarterStartMonth = Math.floor(yesterday.getMonth() / 3) * 3;
  const start = new Date(yesterday.getFullYear(), quarterStartMonth, 1);
  return { start: toISO(start), end: toISO(yesterday) };
}

/**
 * "Data start (Oct 1) through yesterday" — the window used for the
 * "All Months" Month-filter option.
 */
export function allMonthsWindow(): { start: string; end: string } {
  const now = new Date();
  const yesterday = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -1);
  return { start: DATA_START_DATE, end: toISO(yesterday) };
}
