import { query } from '@/lib/db';
import { buildWhereClause } from '@/lib/filterClause';
import { computeQuarterBands } from '@/lib/quarterBand';
import { Band } from '@/lib/band';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const granularity = (searchParams.get('granularity') || 'weekly') as 'daily' | 'weekly' | 'monthly';
    const band = (searchParams.get('band') || 'All') as Band | 'All';

    const { whereClause, params } = buildWhereClause(searchParams);

    // Weekly buckets are Monday→Sunday (MCT works all 7 days, no Sunday skip).
    let bucketExpr = 'em.date';
    if (granularity === 'weekly') bucketExpr = `(em.date - (EXTRACT(ISODOW FROM em.date)::int - 1))`;
    if (granularity === 'monthly') bucketExpr = `DATE_TRUNC('month', em.date)::date`;

    let finalWhere = whereClause;
    let finalParams = params;

    if (band !== 'All') {
      const quarterBands = await computeQuarterBands();
      const bandEmps = quarterBands.bandEmployees[band as Band] || [];
      if (bandEmps.length === 0) {
        return NextResponse.json({ trends: [], granularity });
      }
      const placeholders = bandEmps.map((_, i) => `$${params.length + 1 + i}`).join(',');
      finalWhere = `${whereClause} AND LOWER(em.emp_code) IN (${placeholders})`;
      finalParams = [...params, ...bandEmps];
    }

    // Row-weighted metrics (Avg Weighted Units/Day/Emp, Avg Jobs/Day/Emp, total jobs)
    // bucketed directly; D Score is "average over days of the team's daily average",
    // computed via a nested CTE so busier/quieter days within a bucket don't skew it
    // the way a flat row-weighted average would.
    const trendsQuery = `
      WITH filtered AS (
        SELECT em.date AS dt, em.d_score::numeric AS d_score, em.weighted_count::numeric AS wu, em.tasks_count::numeric AS jobs
        FROM public.eod_mct em
        ${finalWhere}
      ),
      daily AS (
        SELECT dt, AVG(d_score) AS day_avg FROM filtered GROUP BY dt
      ),
      bucketed_daily AS (
        SELECT (${bucketExpr.replace(/em\.date/g, 'dt')})::text AS bucket, AVG(day_avg) AS d_score
        FROM daily
        GROUP BY (${bucketExpr.replace(/em\.date/g, 'dt')})
      ),
      bucketed_rows AS (
        SELECT (${bucketExpr.replace(/em\.date/g, 'dt')})::text AS bucket,
               AVG(wu) AS productivity, AVG(jobs) AS avg_jobs, SUM(jobs) AS total_jobs
        FROM filtered
        GROUP BY (${bucketExpr.replace(/em\.date/g, 'dt')})
      )
      SELECT br.bucket, br.productivity, br.avg_jobs, br.total_jobs, COALESCE(bd.d_score, 0) AS d_score
      FROM bucketed_rows br
      LEFT JOIN bucketed_daily bd ON br.bucket = bd.bucket
      ORDER BY br.bucket ASC
    `;

    const result = await query(trendsQuery, finalParams);

    const trends = (result.rows as Record<string, unknown>[]).map((row) => ({
      date: String(row.bucket),
      productivity: Math.round(parseFloat(String(row.productivity)) || 0),
      avgTrips: Math.round(parseFloat(String(row.avg_jobs)) || 0),
      totalTrips: Math.round(parseFloat(String(row.total_jobs)) || 0),
      dScore: Math.round(parseFloat(String(row.d_score)) || 0),
    }));

    return NextResponse.json({ trends, granularity });
  } catch (error) {
    console.error('Trends fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
