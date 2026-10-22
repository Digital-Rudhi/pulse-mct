'use client';

import { useEffect, useState } from 'react';

interface DailyStat {
  day: string;
  visits: number;
  uniqueVisitors: number;
}

interface Stats {
  totalVisits: number;
  uniqueVisitors: number;
  daily: DailyStat[];
}

export default function InternalStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/internal/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load stats');
        return res.json();
      })
      .then(setStats)
      .catch(() => setError('Failed to load stats'));
  }, []);

  if (error) {
    return <div style={{ maxWidth: 700, margin: '60px auto', padding: 24, fontFamily: 'sans-serif' }}>{error}</div>;
  }

  if (!stats) {
    return <div style={{ maxWidth: 700, margin: '60px auto', padding: 24, fontFamily: 'sans-serif' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2>PULSE MCT — Usage Stats</h2>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.totalVisits}</div>
          <div>Total Visits</div>
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.uniqueVisitors}</div>
          <div>Unique Visitors (all-time)</div>
        </div>
      </div>
      <h3>Last 30 Days</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Date</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 8 }}>Visits</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 8 }}>Unique Visitors</th>
          </tr>
        </thead>
        <tbody>
          {stats.daily.map((d) => (
            <tr key={d.day}>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{d.day}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>{d.visits}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>{d.uniqueVisitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
