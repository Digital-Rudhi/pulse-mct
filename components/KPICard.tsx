'use client';

interface KPICardProps {
  title: string;
  value: number | string;
  color: string;
  icon: string;
  unit?: string;
}

const ACCENTS: Record<
  string,
  { text: string; bubble: string; glow: string; ring: string }
> = {
  purple: {
    text: 'bg-gradient-to-br from-purple-600 to-fuchsia-500 bg-clip-text text-transparent',
    bubble: 'bg-purple-500/12',
    glow: 'rgba(175, 82, 222, 0.20)',
    ring: 'rgba(175, 82, 222, 0.35)',
  },
  green: {
    text: 'bg-gradient-to-br from-emerald-600 to-teal-500 bg-clip-text text-transparent',
    bubble: 'bg-emerald-500/12',
    glow: 'rgba(52, 199, 89, 0.20)',
    ring: 'rgba(52, 199, 89, 0.35)',
  },
  orange: {
    text: 'bg-gradient-to-br from-orange-500 to-amber-500 bg-clip-text text-transparent',
    bubble: 'bg-orange-500/12',
    glow: 'rgba(255, 149, 0, 0.20)',
    ring: 'rgba(255, 149, 0, 0.35)',
  },
  blue: {
    text: 'bg-gradient-to-br from-blue-600 to-sky-500 bg-clip-text text-transparent',
    bubble: 'bg-blue-500/12',
    glow: 'rgba(0, 122, 255, 0.20)',
    ring: 'rgba(0, 122, 255, 0.35)',
  },
  teal: {
    text: 'bg-gradient-to-br from-teal-600 to-cyan-500 bg-clip-text text-transparent',
    bubble: 'bg-teal-500/12',
    glow: 'rgba(48, 176, 199, 0.20)',
    ring: 'rgba(48, 176, 199, 0.35)',
  },
};

export default function KPICard({ title, value, color, icon, unit = '' }: KPICardProps) {
  const displayValue = typeof value === 'number' ? Math.round(value).toLocaleString('en-US') : value;
  const accent = ACCENTS[color] || ACCENTS.blue;

  return (
    <div
      className="glass rounded-[1.75rem] px-7 py-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-rise"
    >
      {/* Colour bloom in the corner */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-70"
        style={{ background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)` }}
      />
      {/* Specular top edge */}
      <div
        className="absolute inset-x-6 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }}
      />

      <div className="flex items-center justify-between mb-4 relative gap-3">
        <p className="text-gray-500 text-sm font-semibold tracking-wide leading-tight">{title}</p>
        <span
          className={`${accent.bubble} backdrop-blur-md text-3xl w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-white/50 shrink-0`}
        >
          {icon}
        </span>
      </div>
      <p className={`text-5xl 2xl:text-6xl font-bold tracking-tight relative ${accent.text}`}>
        {displayValue}
        {unit}
      </p>
    </div>
  );
}
