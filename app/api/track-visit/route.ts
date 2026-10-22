import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { visitorId } = await request.json();
    if (!visitorId || typeof visitorId !== 'string') {
      return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
    }
    const userAgent = request.headers.get('user-agent') || '';

    await query(`
      CREATE TABLE IF NOT EXISTS public.pulse_mct_visits (
        id SERIAL PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        visited_at TIMESTAMP NOT NULL DEFAULT NOW(),
        user_agent TEXT
      )
    `);

    await query(
      `INSERT INTO public.pulse_mct_visits (visitor_id, user_agent) VALUES ($1, $2)`,
      [visitorId, userAgent]
    );

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Track-visit error:', error);
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 });
  }
}
