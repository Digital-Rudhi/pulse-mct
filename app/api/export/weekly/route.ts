import ExcelJS from 'exceljs';
import { query } from '@/lib/db';
import { allMonthsWindow, parseISO, toISO, mondayOf, addDays, isoWeek, formatWeekLabel } from '@/lib/dateUtils';
import { QUALIFYING_DAY_SQL } from '@/lib/qualify';
import { BLACKOUT_DATES_SQL } from '@/lib/blackoutDates';
import { NextResponse } from 'next/server';

// Fixed, filter-independent report: every Mon→Sun week from the data start
// (Oct 1) through yesterday, one tab ("MCT"), one row per employee found in
// eod_mct (sorted by name), one column per week — same D Score computation
// (qualifying-day rule, blackout dates) as every other dashboard view.
export async function GET() {
  try {
    const { start: rangeStart, end: rangeEnd } = allMonthsWindow();

    const weeklyScoreQuery = `
      SELECT
        LOWER(em.emp_code)                                       AS code,
        (em.date - (EXTRACT(ISODOW FROM em.date)::int - 1))::text AS week_start,
        COALESCE(AVG(em.d_score::numeric), 0)                    AS d_score
      FROM public.eod_mct em
      WHERE em.date >= $1 AND em.date <= $2
        AND ${QUALIFYING_DAY_SQL}
        AND ${BLACKOUT_DATES_SQL}
      GROUP BY LOWER(em.emp_code), week_start
    `;

    const employeeRosterQuery = `
      SELECT DISTINCT emp_code, emp_name FROM public.eod_mct ORDER BY emp_name
    `;

    const [result, rosterResult] = await Promise.all([
      query(weeklyScoreQuery, [rangeStart, rangeEnd]),
      query(employeeRosterQuery),
    ]);

    // scoreMap[emp_code-lowercase][weekStartISO] = rounded d_score
    const scoreMap: Record<string, Record<string, number>> = {};
    for (const row of result.rows as Record<string, unknown>[]) {
      const code = String(row.code);
      const weekStart = String(row.week_start);
      const score = Math.round(parseFloat(String(row.d_score)) || 0);
      (scoreMap[code] ??= {})[weekStart] = score;
    }

    // Every Mon→Sun week from the Monday of rangeStart's week through the
    // Monday of rangeEnd's week — a fixed calendar list, independent of
    // which weeks actually have data.
    const weeks: string[] = [];
    const firstMonday = mondayOf(parseISO(rangeStart));
    const lastMonday = mondayOf(parseISO(rangeEnd));
    for (let d = firstMonday; d.getTime() <= lastMonday.getTime(); d = addDays(d, 7)) {
      weeks.push(toISO(d));
    }
    const weekHeaders = weeks.map((w) => `W${isoWeek(w)} (${formatWeekLabel(w)})`);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('MCT');
    sheet.addRow(['Employee', ...weekHeaders]);
    sheet.getRow(1).font = { bold: true };
    sheet.getColumn(1).width = 26;

    const roster = (rosterResult.rows as { emp_code: string; emp_name: string }[])
      .slice()
      .sort((a, b) => a.emp_name.localeCompare(b.emp_name));

    for (const emp of roster) {
      const empScores = scoreMap[emp.emp_code.trim().toLowerCase()] || {};
      const rowValues = weeks.map((w) => (w in empScores ? empScores[w] : '-'));
      sheet.addRow([emp.emp_name, ...rowValues]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const stamp = new Date().toISOString().split('T')[0];

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pulse-mct-weekly-dscore-${stamp}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Weekly export error:', error);
    return NextResponse.json({ error: 'Failed to generate weekly export' }, { status: 500 });
  }
}
