'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import KPICard from '@/components/KPICard';
import DScoreCard from '@/components/DScoreCard';
import FilterSection from '@/components/FilterSection';
import Charts, { Granularity } from '@/components/Charts';
import EmployeeList from '@/components/EmployeeList';
import Footer from '@/components/Footer';
import VisitTracker from '@/components/VisitTracker';

import type { DashboardFilters } from '@/lib/types';

interface Quartiles {
  topAvg: number;
  midAvg: number;
  bottomAvg: number;
}

interface KPIs {
  team: number;
  avgWeightedUnits: number;
  avgJobs: number;
  dScore: number;
  quartiles: Quartiles;
}

const DEFAULT_GRANULARITY: Granularity = 'weekly';
const EMPTY_QUARTILES: Quartiles = { topAvg: 0, midAvg: 0, bottomAvg: 0 };

const DEFAULT_FILTERS: DashboardFilters = {
  month: '',
  employee: '',
  dateFrom: '',
  dateTo: '',
  band: 'All',
};

function buildParams(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.month)    params.append('month', filters.month);
  if (filters.employee) params.append('employee', filters.employee);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo)   params.append('dateTo', filters.dateTo);
  if (filters.band)     params.append('band', filters.band);
  return params;
}

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({ ...DEFAULT_FILTERS });
  const [granularity, setGranularity] = useState<Granularity>(DEFAULT_GRANULARITY);
  const [kpis, setKpis] = useState<KPIs>({
    team: 0,
    avgWeightedUnits: 0,
    avgJobs: 0,
    dScore: 0,
    quartiles: EMPTY_QUARTILES,
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const params = buildParams(filters);
        const response = await fetch(`/api/kpis?${params}`);
        const data = await response.json();
        setKpis({
          ...data,
          quartiles: data.quartiles ?? EMPTY_QUARTILES,
        });
      } catch (error) {
        console.error('Failed to fetch KPIs:', error);
      }
    };
    fetchKPIs();
  }, [filters]);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/weekly');
      if (!response.ok) throw new Error('Export request failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `pulse-mct-weekly-dscore-${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const handleReset = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setGranularity(DEFAULT_GRANULARITY);
  };

  const toggleEmployee = (code: string) => {
    setFilters(f => ({ ...f, employee: f.employee === code ? '' : code }));
  };

  const toggleDateRange = (fromISO: string, toISO: string) => {
    setFilters(f => {
      const same = f.dateFrom === fromISO && f.dateTo === toISO;
      return same ? { ...f, dateFrom: '', dateTo: '' } : { ...f, dateFrom: fromISO, dateTo: toISO };
    });
  };

  return (
    <div className="min-h-screen">
      <VisitTracker />
      <Header onExport={handleExport} />

      <div className="mx-auto px-6 py-6 max-w-[1600px]">

        {/* KPI row — Team | D Score (center) | Avg WU */}
        <div className="flex gap-5 mb-6 items-stretch justify-center">
          <div className="flex-[23]">
            <KPICard title="Team" value={kpis.team} color="blue" icon="👥" />
          </div>
          <div className="flex-[39]">
            <DScoreCard value={kpis.dScore} quartiles={kpis.quartiles} />
          </div>
          <div className="flex-[23]">
            <KPICard title="Avg. Weighted Units/Day/Emp" value={kpis.avgWeightedUnits} color="green" icon="📈" />
          </div>
        </div>

        <FilterSection
          filters={filters}
          onFiltersChange={setFilters}
          onReset={handleReset}
        />

        <Charts
          filters={filters}
          granularity={granularity}
          onGranularityChange={setGranularity}
          onSelectDateRange={toggleDateRange}
        />

        <EmployeeList
          filters={filters}
          onSelectEmployee={toggleEmployee}
        />
      </div>

      <Footer />
    </div>
  );
}
