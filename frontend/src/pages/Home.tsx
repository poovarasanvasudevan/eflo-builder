import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import PageLayout from '../components/PageLayout';
import { getExecutionStats, type ExecutionStats } from '../api/client';
import Spinner from '@atlaskit/spinner';
import { Text } from '../components/ui/Text';
import { Icons } from '../components/ui/Icons';

function formatDuration(sec: number): string {
  if (sec < 1) return `${(sec * 1000).toFixed(0)}ms`;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Home() {
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExecutionStats(14)
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <Spinner size="large" />
        </div>
      </PageLayout>
    );
  }

  const s = stats ?? {
    totalCount: 0,
    totalDurationSec: 0,
    avgDurationSec: 0,
    minDurationSec: 0,
    maxDurationSec: 0,
    byDay: [],
  };

  const chartData = s.byDay.map((d) => ({
    date: formatShortDate(d.date),
    fullDate: d.date,
    executions: d.count,
    avgSec: Math.round(d.avgDurationSec * 10) / 10,
    totalSec: d.totalDurationSec,
  }));

  const StatCard = ({ icon, label, value, iconColor }: { icon: React.ReactNode; label: string; value: string; iconColor: string }) => (
    <div className="rounded border border-[#e8e8e8] bg-white p-3 h-full shadow-sm">
      <div className="flex items-center gap-2 mb-1" style={{ color: iconColor }}>{icon}</div>
      <Text className="text-[11px] text-[#706e6b]">{label}</Text>
      <Text strong className="text-[22px]">{value}</Text>
    </div>
  );

  return (
    <PageLayout title="Home">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-5">
        <StatCard icon={<Icons.Play />} label="Total Executions" value={s.totalCount.toLocaleString()} iconColor="#1890ff" />
        <StatCard icon={<Icons.Clock />} label="Total Execution Time" value={s.totalCount > 0 ? formatDuration(s.totalDurationSec) : '—'} iconColor="#52c41a" />
        <StatCard icon={<Icons.Chart />} label="Average Execution Time" value={s.totalCount > 0 ? formatDuration(s.avgDurationSec) : '—'} iconColor="#722ed1" />
        <StatCard icon={<Icons.TrendingDown />} label="Min Time" value={s.totalCount > 0 ? formatDuration(s.minDurationSec) : '—'} iconColor="#fa8c16" />
        <StatCard icon={<Icons.TrendingUp />} label="Max Time" value={s.totalCount > 0 ? formatDuration(s.maxDurationSec) : '—'} iconColor="#eb2f96" />
      </div>

      {chartData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div className="rounded border border-[#e8e8e8] bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-[#16325c] mb-2">Executions per day (last 14 days)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number | undefined) => [value ?? 0, 'Executions']}
                  labelFormatter={(_: unknown, payload: readonly { payload?: { fullDate?: string } }[]) => (payload?.[0] as { payload?: { fullDate?: string } })?.payload?.fullDate ?? ''}
                />
                <Bar dataKey="executions" fill="#1890ff" name="Executions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded border border-[#e8e8e8] bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-[#16325c] mb-2">Average execution time per day (seconds)</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="s" />
                <Tooltip
                  formatter={(value: number | undefined) => [value ?? 0, 'Avg (s)']}
                  labelFormatter={(_: unknown, payload: readonly { payload?: { fullDate?: string } }[]) => (payload?.[0] as { payload?: { fullDate?: string } })?.payload?.fullDate ?? ''}
                />
                <Legend />
                <Line type="monotone" dataKey="avgSec" stroke="#722ed1" name="Avg duration (s)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded border border-[#e8e8e8] bg-white p-4 shadow-sm">
          <Text className="text-[#706e6b]">No execution data in the last 14 days. Run some flows to see charts here.</Text>
        </div>
      )}
    </PageLayout>
  );
}
