import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const monthsResult = await query(`
      SELECT DISTINCT TO_CHAR(date, 'YYYY-MM') as month
      FROM public.eod_mct
      ORDER BY month DESC
    `);

    const employeesResult = await query(`
      SELECT DISTINCT emp_code, emp_name FROM public.eod_mct
      ORDER BY emp_name
    `);

    return NextResponse.json({
      months: monthsResult.rows.map((r: { month: string }) => r.month),
      employees: employeesResult.rows.map((r: { emp_code: string; emp_name: string }) => ({
        code: r.emp_code,
        name: r.emp_name,
      })),
    });
  } catch (error) {
    console.error('Filters fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
