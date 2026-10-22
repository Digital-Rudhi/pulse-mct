'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DashboardFilters } from '@/lib/types';

type Band = 'Green' | 'Amber' | 'Red';

interface Employee {
  code: string;
  name: string;
  dScore: number;
  workingDays: number;
  totalWeightedUnits: number;
  totalJobs: number;
  band: Band;
}

// Proportional column widths (sum = 100%)
const COL_WIDTHS = ['5%', '38%', '14%', '14%', '14%', '15%'];

function ColGroup() {
  return (
    <colgroup>
      {COL_WIDTHS.map((w, i) => (
        <col key={i} style={{ width: w }} />
      ))}
    </colgroup>
  );
}

interface EmployeeListProps {
  filters: DashboardFilters;
  onSelectEmployee: (code: string) => void;
}

const bandStyles: Record<Band, string> = {
  Green: 'bg-green-500/15 text-green-700 border-green-500/30',
  Amber: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  Red:   'bg-red-500/15 text-red-700 border-red-500/30',
};

export default function EmployeeList({ filters, onSelectEmployee }: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.month)    params.append('month', filters.month);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo)   params.append('dateTo', filters.dateTo);
        if (filters.band)     params.append('band', filters.band);
        const response = await fetch(`/api/employees?${params}`);
        const result = await response.json();
        setEmployees(result.employees || []);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [filters.month, filters.dateFrom, filters.dateTo, filters.band]);

  // Sorted by D Score desc (fixed)
  const sorted = useMemo(() => [...employees].sort((a, b) => b.dScore - a.dScore), [employees]);

  const visibleEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(e => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q));
  }, [sorted, search]);

  const rowHeight = 60;
  const visibleRows = 10;

  return (
    <div className="glass rounded-[1.75rem] p-7 mt-5 relative overflow-hidden animate-rise">
      <div className="absolute inset-x-6 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }}
      />

      {/* Header row */}
      <div className="mb-5 flex items-center justify-between relative gap-4">
        <div>
          <h3 className="text-3xl font-bold text-gray-800 tracking-tight">Employee Distribution</h3>
          <p className="text-base text-gray-500 mt-1">
            {visibleEmployees.length} shown
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Clear cross-filter */}
          {filters.employee && (
            <button
              onClick={() => onSelectEmployee(filters.employee)}
              className="text-sm bg-blue-500/12 text-blue-700 border border-blue-400/30 backdrop-blur-md px-4 py-2 rounded-full font-semibold hover:bg-blue-500/20 transition active:scale-95"
            >
              Clear employee filter ×
            </button>
          )}

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or code..."
              className="w-64 pl-10 pr-8 py-3 glass-inset rounded-full text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 hover:bg-white/60"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : employees.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No employees found</p>
      ) : visibleEmployees.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No employees match the current filters</p>
      ) : (
        <div className="glass-soft rounded-2xl overflow-hidden relative">
          {/* Sticky header */}
          <table className="w-full table-fixed">
            <ColGroup />
            <thead>
              <tr className="border-b border-white/60 bg-white/35 backdrop-blur-md">
                <th className="text-left py-2.5 px-3 font-bold text-gray-600 text-[12px] uppercase tracking-wider">#</th>
                <th className="text-left py-2.5 px-3 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Employee Name</th>
                <th className="text-right py-2.5 px-3 font-bold text-gray-600 text-[12px] uppercase tracking-wider">D Score</th>
                <th className="text-right py-2.5 px-3 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Working Days</th>
                <th className="text-right py-2.5 px-3 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Total Weighted Units</th>
                <th className="text-right py-2.5 px-3 font-bold text-gray-600 text-[12px] uppercase tracking-wider"># Jobs</th>
              </tr>
            </thead>
          </table>

          <div className="overflow-y-auto glass-scroll" style={{ maxHeight: `${rowHeight * visibleRows}px` }}>
            <table className="w-full table-fixed">
              <ColGroup />
              <tbody>
                {visibleEmployees.map((emp, idx) => {
                  const isSelected = filters.employee === emp.code;
                  const band = emp.band;
                  return (
                    <tr
                      key={emp.code}
                      onClick={() => onSelectEmployee(emp.code)}
                      className={`border-b border-white/40 transition-all duration-200 cursor-pointer ${
                        isSelected ? 'bg-purple-500/12 hover:bg-purple-500/18' : 'hover:bg-white/45'
                      }`}
                      style={{ height: `${rowHeight}px` }}
                    >
                      <td className="py-2.5 px-3 text-gray-400 font-semibold text-sm">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-gray-800 font-semibold text-[14px] truncate">
                        <span>{emp.name}</span>
                        {isSelected && <span className="ml-1 text-xs text-purple-600 font-semibold">(filtering)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`border backdrop-blur-md px-2.5 py-1 rounded-full font-bold text-sm whitespace-nowrap ${bandStyles[band]}`}>
                          {emp.dScore.toLocaleString('en-US')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700 font-medium">
                        {emp.workingDays.toLocaleString('en-US')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700 font-medium">
                        {emp.totalWeightedUnits.toLocaleString('en-US')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700 font-medium">
                        {emp.totalJobs.toLocaleString('en-US')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
