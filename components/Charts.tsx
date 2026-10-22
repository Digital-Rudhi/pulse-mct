'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  formatWeekLabel,
  formatDayShort,
  parseISO,
  toISO,
  isoWeek,
} from '@/lib/dateUtils';
import type { DashboardFilters } from '@/lib/types';

export type Granularity = 'daily' | 'weekly' | 'monthly';

interface ChartsProps {
  filters: DashboardFilters;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  onSelectDateRange: (fromISO: string, toISO: string) => void;
}

interface TrendRow {
  date: string;
  productivity: number;
  avgTrips: number;
  totalTrips: number;
  dScore: number;
}

interface ChartPoint extends TrendRow {
  label: string;
  fullLabel: string;
  rangeFrom: string;
  rangeTo: string;
}

const MONTHS_LONG = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildPoints(rows: TrendRow[], granularity: Granularity): ChartPoint[] {
  return rows.map((row) => {
    if (granularity === 'weekly') {
      // row.date is the Monday start of a Mon→Sun bucket (MCT weeks run
      // Monday-Sunday) — ISO week number is computed directly off the Monday.
      const start = parseISO(row.date);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      const wNum = isoWeek(row.date);
      return {
        ...row,
        label: `W${wNum}`,
        fullLabel: `W${wNum} (${formatWeekLabel(row.date)})`,
        rangeFrom: row.date,
        rangeTo: toISO(end),
      };
    }
    if (granularity === 'monthly') {
      const start = parseISO(row.date);
      const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const label = `${MONTHS_LONG[start.getMonth()]} ${start.getFullYear()}`;
      return {
        ...row,
        label,
        fullLabel: label,
        rangeFrom: row.date,
        rangeTo: toISO(monthEnd),
      };
    }
    return {
      ...row,
      label: formatDayShort(row.date),
      fullLabel: row.date,
      rangeFrom: row.date,
      rangeTo: row.date,
    };
  });
}

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.80)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.7)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(31,38,135,0.12)',
  fontWeight: 600,
};

const CustomProductivityTooltip = (props: { active?: boolean; payload?: unknown[] }) => {
  const payload = props.payload as { name: string; value: unknown; payload: ChartPoint }[] | undefined;
  if (!props.active || !payload?.length) return null;
  const chartPoint = payload[0]?.payload as ChartPoint | undefined;

  const intFormatter = (v: unknown) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '0';
  };

  return (
    <div style={{ ...tooltipStyle, padding: '8px 12px' }}>
      <div style={{ fontSize: '13px', color: '#333', marginBottom: '6px', fontWeight: 'bold' }}>
        {chartPoint?.fullLabel}
      </div>
      <div style={{ fontSize: '13px', color: '#34c759', fontWeight: 600, marginBottom: '4px' }}>
        Avg Weighted Units : {intFormatter(chartPoint?.productivity)}
      </div>
      <div style={{ fontSize: '13px', color: '#ff9500', fontWeight: 600 }}>
        Avg Jobs/Day/Emp : {intFormatter(chartPoint?.avgTrips)}
      </div>
    </div>
  );
};

export default function Charts({ filters, granularity, onGranularityChange, onSelectDateRange }: ChartsProps) {
  const [rows, setRows] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('granularity', granularity);
        if (filters.month)    params.append('month', filters.month);
        if (filters.employee) params.append('employee', filters.employee);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo)   params.append('dateTo', filters.dateTo);
        if (filters.band)     params.append('band', filters.band);

        const response = await fetch(`/api/trends?${params}`);
        const result = await response.json();
        setRows(result.trends || []);
      } catch (error) {
        console.error('Failed to fetch trends:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, [granularity, filters]);

  const data = useMemo(() => buildPoints(rows, granularity), [rows, granularity]);

  const selectedLabel = useMemo(() => {
    if (!filters.dateFrom || !filters.dateTo) return null;
    const hit = data.find(p => p.rangeFrom === filters.dateFrom && p.rangeTo === filters.dateTo);
    return hit ? hit.label : null;
  }, [data, filters.dateFrom, filters.dateTo]);

  const onChartClick = (e: unknown) => {
    const evt = e as { activePayload?: { payload: ChartPoint }[] } | null;
    if (!evt?.activePayload?.[0]) return;
    const pt = evt.activePayload[0].payload;
    onSelectDateRange(pt.rangeFrom, pt.rangeTo);
  };

  const intFormatter = (v: unknown) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '0';
  };

  const labelFormatter = ((_: unknown, payload: unknown) => {
    const arr = payload as { payload: ChartPoint }[] | undefined;
    return arr?.[0] ? arr[0].payload.fullLabel : '';
  }) as never;

  const TabButton = ({ value, label }: { value: Granularity; label: string }) => (
    <button
      onClick={() => onGranularityChange(value)}
      className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
        granularity === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
    </button>
  );

  const ChartCard = ({ title, description, children }: {
    title: string; description: string; children: React.ReactNode;
  }) => (
    <div className="glass rounded-[1.75rem] p-7 relative overflow-hidden transition-all duration-300 hover:shadow-2xl animate-rise">
      <div className="absolute inset-x-6 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }}
      />
      <div className="flex justify-between items-start mb-4 relative">
        <div>
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="segmented flex">
          <TabButton value="daily"   label="D" />
          <TabButton value="weekly"  label="W" />
          <TabButton value="monthly" label="M" />
        </div>
      </div>
      {selectedLabel && (
        <p className="text-sm text-purple-700 bg-purple-500/12 border border-purple-400/30 backdrop-blur-md inline-block px-3.5 py-1.5 rounded-full font-semibold mb-3 relative">
          Filtered to {selectedLabel} — click again to clear
        </p>
      )}
      {loading ? (
        <div className="h-72 flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="h-72 flex items-center justify-center">
          <p className="text-gray-400">No data for the current filters</p>
        </div>
      ) : children}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">

      {/* D Score Trend — single line */}
      <ChartCard title="D Score Trend" description="Avg D Score over time">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data} margin={{ top: 15, right: 15, left: 0, bottom: 20 }}
            onClick={onChartClick as never} style={{ cursor: 'pointer' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,60,67,0.10)" />
            <XAxis dataKey="label" tick={{ fontSize: 13 }} stroke="#999" />
            <YAxis stroke="#999" allowDecimals={false} tickFormatter={intFormatter} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={((v: unknown) => [intFormatter(v), 'D Score']) as never}
              labelFormatter={labelFormatter}
            />
            <Line
              type="monotone" dataKey="dScore" stroke="#af52de" strokeWidth={2.5}
              dot={(props: { cx?: number; cy?: number; payload?: ChartPoint; index?: number }) => {
                const { cx, cy, payload, index } = props;
                const sel = payload?.label === selectedLabel;
                return (
                  <circle key={`d-${index}`} cx={cx} cy={cy} r={sel ? 6 : 3}
                    fill={sel ? '#8e2de2' : '#af52de'}
                    stroke={sel ? '#fff' : 'none'} strokeWidth={sel ? 2 : 0}
                  />
                );
              }}
              activeDot={{ r: 6 }} name="D Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Productivity & Jobs — two lines, single Y-axis */}
      <ChartCard title="Productivity & Jobs" description="Avg Weighted Units/Day/Emp & Avg Jobs/Day/Emp">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data} margin={{ top: 15, right: 15, left: 0, bottom: 20 }}
            onClick={onChartClick as never} style={{ cursor: 'pointer' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,60,67,0.10)" />
            <XAxis dataKey="label" tick={{ fontSize: 13 }} stroke="#999" />
            {/* Single left Y-axis for both metrics */}
            <YAxis
              stroke="#999" allowDecimals={false} tickFormatter={intFormatter}
            />
            <Tooltip content={<CustomProductivityTooltip />} />
            <Legend />
            {/* Weighted Units first — green */}
            <Line
              type="monotone" dataKey="productivity"
              stroke="#34c759" strokeWidth={2.5}
              dot={(props: { cx?: number; cy?: number; payload?: ChartPoint; index?: number }) => {
                const { cx, cy, payload, index } = props;
                const sel = payload?.label === selectedLabel;
                return (
                  <circle key={`wu-${index}`} cx={cx} cy={cy} r={sel ? 6 : 3}
                    fill={sel ? '#1a9e3f' : '#34c759'}
                    stroke={sel ? '#fff' : 'none'} strokeWidth={sel ? 2 : 0}
                  />
                );
              }}
              activeDot={{ r: 6 }} name="Avg Weighted Units"
            />
            {/* Avg Jobs second — orange */}
            <Line
              type="monotone" dataKey="avgTrips"
              stroke="#ff9500" strokeWidth={2.5}
              dot={(props: { cx?: number; cy?: number; payload?: ChartPoint; index?: number }) => {
                const { cx, cy, payload, index } = props;
                const sel = payload?.label === selectedLabel;
                return (
                  <circle key={`tr-${index}`} cx={cx} cy={cy} r={sel ? 6 : 3}
                    fill={sel ? '#cc7700' : '#ff9500'}
                    stroke={sel ? '#fff' : 'none'} strokeWidth={sel ? 2 : 0}
                  />
                );
              }}
              activeDot={{ r: 6 }} name="Avg Jobs/Day/Emp"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
