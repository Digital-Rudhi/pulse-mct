'use client';

import { useEffect, useState } from 'react';
import type { DashboardFilters, BandFilter } from '@/lib/types';

interface FilterSectionProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  onReset: () => void;
}

interface FilterOptions {
  months: string[];
  employees: { code: string; name: string }[];
}

const fieldClass =
  'w-full px-4 py-2.5 glass-inset rounded-xl text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400/60 hover:bg-white/60';

export default function FilterSection({ filters, onFiltersChange, onReset }: FilterSectionProps) {
  const [options, setOptions] = useState<FilterOptions>({ months: [], employees: [] });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/filters');
        const data = await response.json();
        if (response.ok && data.months) setOptions(data);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      }
    };
    fetchOptions();
  }, []);

  const update = (patch: Partial<DashboardFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <div className="glass rounded-[1.75rem] px-7 py-5 mt-6 mb-6 relative overflow-hidden animate-rise">
      <div
        className="absolute inset-x-6 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }}
      />
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Filters</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {/* RAG band filter — quarter-to-date D-Score colour, affects KPIs, charts & employee list */}
          <div className="segmented flex items-center">
            {(['Green', 'Amber', 'Red', 'All'] as BandFilter[]).map((b) => (
              <button
                key={b}
                onClick={() => update({ band: b })}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                  filters.band === b ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {b !== 'All' && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: b === 'Green' ? '#34c759' : b === 'Amber' ? '#ff9500' : '#ff3b30' }}
                  />
                )}
                {b}
              </button>
            ))}
          </div>

          <button
            onClick={onReset}
            className="text-base font-semibold text-blue-600 hover:text-blue-700 glass-soft px-5 py-2 rounded-full transition hover:bg-white/70 active:scale-95"
          >
            Reset to defaults
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-[15px] font-semibold text-gray-600 mb-1.5">📅 Month</label>
          <select
            value={filters.month}
            onChange={(e) => update({ month: e.target.value })}
            className={fieldClass}
          >
            <option value="quarter">Current Quarter</option>
            <option value="">All Months (Oct 1 - Today)</option>
            {options.months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[15px] font-semibold text-gray-600 mb-1.5">👤 Employee</label>
          <select
            value={filters.employee}
            onChange={(e) => update({ employee: e.target.value })}
            className={fieldClass}
          >
            <option value="">All Employees</option>
            {options.employees.map((emp) => (
              <option key={emp.code} value={emp.code}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[15px] font-semibold text-gray-600 mb-1.5">📆 From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div>
          <label className="block text-[15px] font-semibold text-gray-600 mb-1.5">📆 To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className={fieldClass}
          />
        </div>
      </div>

      {(filters.employee || (filters.dateFrom && filters.dateTo)) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.employee && (
            <span className="text-xs bg-blue-500/12 text-blue-700 border border-blue-400/30 backdrop-blur-md px-3.5 py-1.5 rounded-full font-semibold inline-flex items-center">
              Cross-filter: employee = {filters.employee}
              <button
                onClick={() => update({ employee: '' })}
                className="ml-2 text-blue-500 hover:text-blue-800 transition"
              >
                ×
              </button>
            </span>
          )}
          {filters.dateFrom && filters.dateTo && (
            <span className="text-xs bg-purple-500/12 text-purple-700 border border-purple-400/30 backdrop-blur-md px-3.5 py-1.5 rounded-full font-semibold inline-flex items-center">
              Cross-filter: {filters.dateFrom} → {filters.dateTo}
              <button
                onClick={() => update({ dateFrom: '', dateTo: '' })}
                className="ml-2 text-purple-500 hover:text-purple-800 transition"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
