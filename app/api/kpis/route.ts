import { query } from '@/lib/db';
import { buildWhereClause } from '@/lib/filterClause';
import { computeQuarterBands } from '@/lib/quarterBand';
import { Band } from '@/lib/band';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const band = (searchParams.get('band') || 'All') as Band | 'All';

    const { whereClause, params } = buildWhereClause(searchParams);

    // Team / Avg Weighted Units / Avg Jobs — simple row-weighted averages
    // over qualifying employee-day rows (unchanged definition from the
    // Annotation dashboard).
    const rowQuery = `
      SELECT
        COUNT(DISTINCT em.emp_code)                AS total_employees,
        COALESCE(AVG(em.weighted_count::numeric), 0) AS avg_weighted_units,
        COALESCE(AVG(em.tasks_count::numeric), 0)    AS avg_jobs
      FROM public.eod_mct em
      ${whereClause}
    `;

    // Department D Score = "average over days of the team's daily average"
    // — compute each day's team average first, then average those.
    const deptScoreQuery = `
      WITH daily AS (
        SELECT em.date AS d, AVG(em.d_score::numeric) AS day_avg
        FROM public.eod_mct em
        ${whereClause}
        GROUP BY em.date
      )
      SELECT COALESCE(AVG(day_avg), 0) AS d_score FROM daily
    `;

    const [rowResult, deptScoreResult, quarterBands] = await Promise.all([
      query(rowQuery, params),
      query(deptScoreQuery, params),
      computeQuarterBands(),
    ]);

    let rowData = rowResult.rows[0];
    let deptScoreData = deptScoreResult.rows[0];

    if (band !== 'All') {
      const bandEmps = quarterBands.bandEmployees[band as Band] || [];
      if (bandEmps.length === 0) {
        rowData = { total_employees: 0, avg_weighted_units: 0, avg_jobs: 0 };
        deptScoreData = { d_score: 0 };
      } else {
        const placeholders = bandEmps.map((_, i) => `$${params.length + 1 + i}`).join(',');
        const bandWhere = `${whereClause} AND LOWER(em.emp_code) IN (${placeholders})`;
        const bandParams = [...params, ...bandEmps];

        const bandRowQuery = `
          SELECT
            COUNT(DISTINCT em.emp_code)                AS total_employees,
            COALESCE(AVG(em.weighted_count::numeric), 0) AS avg_weighted_units,
            COALESCE(AVG(em.tasks_count::numeric), 0)    AS avg_jobs
          FROM public.eod_mct em
          ${bandWhere}
        `;
        const bandDeptScoreQuery = `
          WITH daily AS (
            SELECT em.date AS d, AVG(em.d_score::numeric) AS day_avg
            FROM public.eod_mct em
            ${bandWhere}
            GROUP BY em.date
          )
          SELECT COALESCE(AVG(day_avg), 0) AS d_score FROM daily
        `;
        const [bandRowResult, bandDeptScoreResult] = await Promise.all([
          query(bandRowQuery, bandParams),
          query(bandDeptScoreQuery, bandParams),
        ]);
        rowData = bandRowResult.rows[0] || { total_employees: 0, avg_weighted_units: 0, avg_jobs: 0 };
        deptScoreData = bandDeptScoreResult.rows[0] || { d_score: 0 };
      }
    }

    const avgOf = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

    return NextResponse.json({
      team: parseInt(String(rowData.total_employees), 10) || 0,
      avgWeightedUnits: Math.round(parseFloat(String(rowData.avg_weighted_units)) || 0),
      avgJobs: Math.round(parseFloat(String(rowData.avg_jobs)) || 0),
      dScore: Math.round(parseFloat(String(deptScoreData.d_score)) || 0),
      quartiles: {
        topAvg: avgOf(quarterBands.bandScores.Green),
        midAvg: avgOf(quarterBands.bandScores.Amber),
        bottomAvg: avgOf(quarterBands.bandScores.Red),
      },
    });
  } catch (error) {
    console.error('KPI fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
  }
}
