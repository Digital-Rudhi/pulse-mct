import { query } from './db';
import { quarterToDateMinusOne } from './dateUtils';
import { QUALIFYING_DAY_SQL } from './qualify';
import { BLACKOUT_DATES_SQL } from './blackoutDates';
import { computeBandCutoffs, bandForScore, Band } from './band';

export interface QuarterBandResult {
  bandByCode: Record<string, Band>;
  bandEmployees: Record<Band, string[]>;
  bandScores: Record<Band, number[]>;
}

// The RAG colour population: average D Score per employee over their
// qualifying days in the fixed quarter-to-date(-1) window — everyone found
// in eod_mct (no active/status concept for MCT). Independent of the current
// dashboard filters so an employee's colour stays stable no matter what's selected.
export async function computeQuarterBands(): Promise<QuarterBandResult> {
  const { start, end } = quarterToDateMinusOne();
  const sql = `
    SELECT LOWER(em.emp_code) AS code, COALESCE(AVG(em.d_score::numeric), 0) AS avg_d
    FROM public.eod_mct em
    WHERE em.date >= $1 AND em.date <= $2
      AND ${QUALIFYING_DAY_SQL}
      AND ${BLACKOUT_DATES_SQL}
    GROUP BY LOWER(em.emp_code)
  `;
  const result = await query(sql, [start, end]);
  const rows = (result.rows as Record<string, unknown>[]).map((r) => ({
    code: String(r.code),
    score: Math.round(parseFloat(String(r.avg_d)) || 0),
  }));
  const cutoffs = computeBandCutoffs(rows.map((r) => r.score));

  const bandByCode: Record<string, Band> = {};
  const bandEmployees: Record<Band, string[]> = { Green: [], Amber: [], Red: [] };
  const bandScores: Record<Band, number[]> = { Green: [], Amber: [], Red: [] };

  for (const r of rows) {
    const b = bandForScore(r.score, cutoffs);
    bandByCode[r.code] = b;
    bandEmployees[b].push(r.code);
    bandScores[b].push(r.score);
  }

  return { bandByCode, bandEmployees, bandScores };
}
