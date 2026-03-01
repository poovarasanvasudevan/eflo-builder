import { Card, Row, Col, Typography, Spin } from 'antd';
import { useEffect, useState } from 'react';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
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

const { Text } = Typography;

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
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin size="large" />
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

  return (
    <PageLayout title="Home">
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <ThunderboltOutlined style={{ fontSize: 18, color: '#1890ff' }} />
              <Text type="secondary" style={{ fontSize: 11 }}>Total Executions</Text>
            </div>
            <Text strong style={{ fontSize: 22 }}>{s.totalCount.toLocaleString()}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <ClockCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
              <Text type="secondary" style={{ fontSize: 11 }}>Total Execution Time</Text>
            </div>
            <Text strong style={{ fontSize: 22 }}>{s.totalCount > 0 ? formatDuration(s.totalDurationSec) : '—'}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <LineChartOutlined style={{ fontSize: 18, color: '#722ed1' }} />
              <Text type="secondary" style={{ fontSize: 11 }}>Average Execution Time</Text>
            </div>
            <Text strong style={{ fontSize: 22 }}>{s.totalCount > 0 ? formatDuration(s.avgDurationSec) : '—'}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <FallOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
              <Text type="secondary" style={{ fontSize: 11 }}>Min Time</Text>
            </div>
            <Text strong style={{ fontSize: 22 }}>{s.totalCount > 0 ? formatDuration(s.minDurationSec) : '—'}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <RiseOutlined style={{ fontSize: 18, color: '#eb2f96' }} />
              <Text type="secondary" style={{ fontSize: 11 }}>Max Time</Text>
            </div>
            <Text strong style={{ fontSize: 22 }}>{s.totalCount > 0 ? formatDuration(s.maxDurationSec) : '—'}</Text>
          </Card>
        </Col>
      </Row>

      {chartData.length > 0 ? (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={12} lg={12}>
            <Card size="small" title="Executions per day (last 14 days)" style={{ marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number | undefined) => [value ?? 0, 'Executions']}
                    labelFormatter={(_, payload) => (payload?.[0] as { payload?: { fullDate?: string } })?.payload?.fullDate ?? ''}
                  />
                  <Bar dataKey="executions" fill="#1890ff" name="Executions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={12}>
            <Card size="small" title="Average execution time per day (seconds)">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="s" />
                  <Tooltip
                    formatter={(value: number | undefined) => [value ?? 0, 'Avg (s)']}
                    labelFormatter={(_, payload) => (payload?.[0] as { payload?: { fullDate?: string } })?.payload?.fullDate ?? ''}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avgSec" stroke="#722ed1" name="Avg duration (s)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      ) : (
        <Card size="small">
          <Text type="secondary">No execution data in the last 14 days. Run some flows to see charts here.</Text>
        </Card>
      )}
    </PageLayout>
  );
}
