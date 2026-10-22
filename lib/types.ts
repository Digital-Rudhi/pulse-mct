export type BandFilter = 'Green' | 'Amber' | 'Red' | 'All';

export interface DashboardFilters {
  month: string;
  employee: string;
  dateFrom: string;
  dateTo: string;
  band: BandFilter;
}
