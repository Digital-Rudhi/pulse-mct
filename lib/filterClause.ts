import { allMonthsWindow, quarterToDateMinusOne } from './dateUtils';
import { QUALIFYING_DAY_SQL } from './qualify';
import { BLACKOUT_DATES_SQL } from './blackoutDates';

// Builds the shared WHERE clause (month window, optional employee/date-range,
// qualifying-day rule, blackout dates) used by kpis/trends/employees. The
// Employee dropdown intentionally does NOT narrow the table (same cross-filter
// UX as the Annotation dashboard) — callers pass includeEmployee: false for that route.
export function buildWhereClause(
  searchParams: URLSearchParams,
  opts: { includeEmployee?: boolean } = {}
): { whereClause: string; params: unknown[] } {
  const month = searchParams.get('month');
  const employee = searchParams.get('employee');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const includeEmployee = opts.includeEmployee !== false;

  let whereClause = `WHERE ${QUALIFYING_DAY_SQL} AND ${BLACKOUT_DATES_SQL}`;
  const params: unknown[] = [];

  if (month === 'quarter') {
    const { start, end } = quarterToDateMinusOne();
    whereClause += ` AND em.date >= $${params.length + 1} AND em.date <= $${params.length + 2}`;
    params.push(start, end);
  } else if (month) {
    whereClause += ` AND TO_CHAR(em.date, 'YYYY-MM') = $${params.length + 1}`;
    params.push(month);
  } else {
    const { start, end } = allMonthsWindow();
    whereClause += ` AND em.date >= $${params.length + 1} AND em.date <= $${params.length + 2}`;
    params.push(start, end);
  }

  if (includeEmployee && employee) {
    whereClause += ` AND em.emp_code = $${params.length + 1}`;
    params.push(employee);
  }
  if (dateFrom) {
    whereClause += ` AND em.date >= $${params.length + 1}`;
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ` AND em.date <= $${params.length + 1}`;
    params.push(dateTo);
  }

  return { whereClause, params };
}
