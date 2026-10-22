import { query } from '@/lib/db';
import { buildWhereClause } from '@/lib/filterClause';
import { computeQuarterBands } from '@/lib/quarterBand';
import { Band } from '@/lib/band';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const band = (searchParams.get('band') || 'All') as Band | 'All';

    // The table ignores the Employee dropdown (same cross-filter UX as Annotation —
    // the selected row is highlighted instead of the list being narrowed to one row).
    const { whereClause, params } = buildWhereClause(searchParams, { includeEmployee: false });

    const employeesQuery = `
      SELECT
        LOWER(em.emp_code)                            AS code,
        MAX(em.emp_name)                              AS name,
        COALESCE(AVG(em.d_score::numeric), 0)         AS d_score,
        COUNT(*)                                      AS working_days,
        COALESCE(SUM(em.weighted_count::numeric), 0)  AS total_weighted_units,
        COALESCE(SUM(em.tasks_count::numeric), 0)     AS total_jobs
      FROM public.eod_mct em
      ${whereClause}
      GROUP BY LOWER(em.emp_code)
      ORDER BY d_score DESC
    `;

    const [result, quarterBands] = await Promise.all([
      query(employeesQuery, params),
      computeQuarterBands(),
    ]);

    let employees = (result.rows as Record<string, unknown>[]).map((row) => {
      const code = String(row.code);
      return {
        code,
        name: String(row.name || ''),
        dScore: Math.round(parseFloat(String(row.d_score)) || 0),
        workingDays: parseInt(String(row.working_days), 10) || 0,
        totalWeightedUnits: Math.round(parseFloat(String(row.total_weighted_units)) || 0),
        totalJobs: Math.round(parseFloat(String(row.total_jobs)) || 0),
        band: (quarterBands.bandByCode[code] || 'Amber') as Band,
      };
    });

    if (band !== 'All') {
      employees = employees.filter((e) => e.band === band);
    }

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Employees fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}
