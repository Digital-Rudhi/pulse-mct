import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS public.pulse_mct_visits (
        id SERIAL PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        visited_at TIMESTAMP NOT NULL DEFAULT NOW(),
        user_agent TEXT
      )
    `);

    const totalResult = await query(`SELECT COUNT(*) AS total FROM public.pulse_mct_visits`);
    const uniqueResult = await query(`SELECT COUNT(DISTINCT visitor_id) AS unique_visitors FROM public.pulse_mct_visits`);
    const dailyResult = await query(`
      SELECT visited_at::date AS day, COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS unique_visitors
      FROM public.pulse_mct_visits
      GROUP BY visited_at::date
      ORDER BY day DESC
      LIMIT 30
    `);

    return NextResponse.json({
      totalVisits: parseInt(totalResult.rows[0].total, 10) || 0,
      uniqueVisitors: parseInt(uniqueResult.rows[0].unique_visitors, 10) || 0,
      daily: dailyResult.rows.map((r: Record<string, unknown>) => ({
        day: (r.day as Date).toISOString().split('T')[0],
        visits: parseInt(String(r.visits), 10) || 0,
        uniqueVisitors: parseInt(String(r.unique_visitors), 10) || 0,
      })),
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
