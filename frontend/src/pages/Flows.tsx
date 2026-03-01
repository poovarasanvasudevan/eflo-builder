import { Table, Button, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { HistoryOutlined, EditOutlined } from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import { useNavigate } from 'react-router';
import PageLayout from '../components/PageLayout';
import type { Workflow } from '../api/client';

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

export default function Flows() {
  const { workflows, fetchWorkflows, loadWorkflow } = useWorkflowStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const openInBuilder = (id: number) => {
    loadWorkflow(id).then(() => navigate('/wf-new'));
  };

  useEffect(() => {
    setLoading(true);
    fetchWorkflows().finally(() => setLoading(false));
  }, [fetchWorkflows]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      render: (name: string, record: Workflow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Text strong style={{ fontSize: 12 }}>{name}</Text>
          <Tooltip title="Open in Builder">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ padding: '0 4px', height: 22 }}
              onClick={() => openInBuilder(record.id)}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: string) => (v ? <Text type="secondary" style={{ fontSize: 11 }}>{v}</Text> : '—'),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (v: string) => (v ? <Text style={{ fontSize: 11 }}>{new Date(v).toLocaleString()}</Text> : '—'),
    },
    {
      title: 'Last run',
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      width: 180,
      render: (v: string) => (v ? <Text style={{ fontSize: 11 }}>{new Date(v).toLocaleString()}</Text> : '—'),
    },
    {
      title: 'Avg run time',
      dataIndex: 'avgRunTimeSec',
      key: 'avgRunTimeSec',
      width: 180,
      render: (v: number) => (v != null ? <Text style={{ fontSize: 11 }}>{formatDuration(v)}</Text> : '—'),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_: unknown, record: Workflow) => (
        <Tooltip title="View executions">
          <Button
            type="text"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/flows/${record.id}/executions`)}
            style={{ padding: '0 4px' }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <PageLayout title="Flows">
      <Table
        size="small"
        columns={columns}
        dataSource={workflows}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} flows`,
        }}
        style={{ fontSize: 12 }}
        locale={{ emptyText: 'No flows yet. Create one in Builder.' }}
      />
    </PageLayout>
  );
}
