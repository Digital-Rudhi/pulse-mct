'use client';

import { DEPT_CUTOFF_GREEN, DEPT_CUTOFF_AMBER } from '@/lib/config';

interface Quartiles {
  topAvg: number;
  midAvg: number;
  bottomAvg: number;
}

interface DScoreCardProps {
  value: number;
  quartiles: Quartiles;
}

// Department colour: Green >= 70, Amber >= 50, else Red (fixed cutoffs,
// independent of the quarter-to-date quartile pills below it).
function deptScoreColor(value: number): string {
  if (value >= DEPT_CUTOFF_GREEN) return '#34c759';
  if (value >= DEPT_CUTOFF_AMBER) return '#ff9500';
  return '#ff3b30';
}

export default function DScoreCard({ value, quartiles }: DScoreCardProps) {
  // Determine which quartile band the overall avg D score falls in (pill highlighting)
  const band =
    value >= quartiles.topAvg ? 'top' :
    value >= quartiles.bottomAvg ? 'mid' :
    'bottom';

  const scoreDot = deptScoreColor(value);

  return (
    <div
      className="glass rounded-[1.75rem] px-7 py-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-rise h-full"
      style={{ boxShadow: '0 0 0 2px rgba(96,113,255,0.35), 0 12px 40px rgba(31,38,135,0.12), inset 0 1px 0 rgba(255,255,255,0.85)' }}
    >
      {/* Ambient bloom */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(96,113,255,0.20) 0%, transparent 70%)' }}
      />
      <div className="absolute inset-x-6 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }}
      />

      {/* Header row */}
      <div className="flex flex-col items-center justify-center mb-3 relative">
        <p className="text-gray-500 text-base font-bold tracking-widest uppercase">D Score</p>
      </div>

      {/* Big number — coloured by the department Green/Amber/Red cut-offs */}
      <p
        className="text-7xl font-black tracking-tight relative leading-none mb-4 text-center"
        style={{ color: scoreDot, textShadow: `0 0 24px ${scoreDot}33` }}
      >
        {value}
      </p>

      {/* Quartile pills */}
      <div className="flex items-center justify-center gap-3 flex-wrap relative">
        <QuartilePill
          dot="#34c759"
          label="Top Quartile"
          score={quartiles.topAvg}
          active={band === 'top'}
        />
        <QuartilePill
          dot="#ff9500"
          label="Mid Quartile"
          score={quartiles.midAvg}
          active={band === 'mid'}
        />
        <QuartilePill
          dot="#ff3b30"
          label="Bottom Quartile"
          score={quartiles.bottomAvg}
          active={band === 'bottom'}
        />
      </div>
    </div>
  );
}

function QuartilePill({ dot, label, score, active }: {
  dot: string; label: string; score: number; active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
        active
          ? 'bg-white/60 border-white/80 shadow-sm'
          : 'bg-white/20 border-white/30 text-gray-600'
      }`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          background: dot,
          boxShadow: active ? `0 0 8px ${dot}` : 'none',
        }}
      />
      <span className="font-bold" style={{ color: active ? dot : undefined }}>{score}</span>
      <span className={active ? 'text-gray-700' : 'text-gray-500'}>{label}</span>
    </span>
  );
}
