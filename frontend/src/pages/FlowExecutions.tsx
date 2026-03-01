import { Table, Button, Breadcrumb, Typography, Tag, Drawer, Timeline, Spin, Collapse } from 'antd';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useWorkflowStore } from '../store/workflowStore';
import { getWorkflow, getExecution, getExecutionLogs } from '../api/client';
import type { Execution, Workflow, ExecutionLog } from '../api/client';
import PageLayout from '../components/PageLayout';

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

function statusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'success';
    case 'running':
      return 'processing';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
}

function formatJson(str: string | undefined): string {
  if (!str || str === '{}' || str === 'null') return '';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

export default function FlowExecutions() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const { fetchExecutionsForFlow } = useWorkflowStore();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    if (!flowId) return;
    setLoading(true);
    Promise.all([
      fetchExecutionsForFlow(flowId),
      getWorkflow(Number(flowId)).then((r) => r.data).catch(() => null),
    ])
      .then(([execs, wf]) => {
        setExecutions(execs);
        setWorkflow(wf || null);
      })
      .finally(() => setLoading(false));
  }, [flowId, fetchExecutionsForFlow]);

  const openDetails = useCallback((record: Execution) => {
    setSelectedExecution(record);
    setDrawerOpen(true);
    setExecutionLogs([]);
    setDrawerLoading(true);
    Promise.all([
      getExecution(record.id).then((r) => r.data),
      getExecutionLogs(record.id).then((r) => r.data),
    ])
      .then(([exec, logs]) => {
        setSelectedExecution(exec);
        setExecutionLogs(logs);
      })
      .finally(() => setDrawerLoading(false));
  }, []);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Text style={{ fontSize: 11 }}>{id}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <Tag color={statusColor(status)} style={{ fontSize: 10 }}>{status}</Tag>,
    },
    {
      title: 'Started',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 180,
      render: (v: string) => (v ? <Text style={{ fontSize: 11 }}>{new Date(v).toLocaleString()}</Text> : '—'),
    },
    {
      title: 'Finished',
      dataIndex: 'finishedAt',
      key: 'finishedAt',
      width: 180,
      render: (v: string) => (v ? <Text style={{ fontSize: 11 }}>{new Date(v).toLocaleString()}</Text> : '—'),
    },
    {
      title: 'Time taken',
      key: 'duration',
      width: 180,
      render: (_: unknown, r: Execution) => {
        const started = r.startedAt ? new Date(r.startedAt).getTime() : null;
        const finished = r.finishedAt ? new Date(r.finishedAt).getTime() : null;
        if (started == null || finished == null || finished < started) return '—';
        return <Text style={{ fontSize: 11 }}>{formatDuration((finished - started) / 1000)}</Text>;
      },
    },
    {
      title: 'Details',
      key: 'details',
      width: 90,
      render: (_: unknown, r: Execution) => (
        <Button type="link" size="small" style={{ padding: 0, fontSize: 11 }} onClick={() => openDetails(r)}>
          View
        </Button>
      ),
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      ellipsis: true,
      render: (v: string) => (v ? <Text type="danger" style={{ fontSize: 11 }}>{v}</Text> : '—'),
    },
  ];

  return (
    <PageLayout>
      <div style={{ marginBottom: 12 }}>
        <Breadcrumb
          style={{ fontSize: 11 }}
          items={[
            { title: <Link to="/flows">Flows</Link> },
            { title: workflow ? workflow.name : `Flow ${flowId}` },
            { title: 'Executions' },
          ]}
        />
      </div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text strong style={{ fontSize: 12 }}>
          {workflow ? `Executions for "${workflow.name}"` : 'Executions'}
        </Text>
        <Button size="small" type="primary" onClick={() => navigate('/flows')}>
          Back to Flows
        </Button>
      </div>
      <Table
        size="small"
        columns={columns}
        dataSource={executions}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} executions`,
        }}
        style={{ fontSize: 12 }}
        locale={{ emptyText: 'No executions for this flow yet.' }}
      />
      <Drawer
        title={selectedExecution ? `Execution #${selectedExecution.id}` : 'Execution details'}
        placement="right"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { paddingTop: 8 } }}
      >
        {drawerLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : selectedExecution ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Tag color={statusColor(selectedExecution.status)}>{selectedExecution.status}</Tag>
              {selectedExecution.startedAt && (
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                  Started: {new Date(selectedExecution.startedAt).toLocaleString()}
                </Text>
              )}
              {selectedExecution.finishedAt && (
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                  Finished: {new Date(selectedExecution.finishedAt).toLocaleString()}
                </Text>
              )}
              {selectedExecution.error && (
                <Text type="danger" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>{selectedExecution.error}</Text>
              )}
            </div>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Timeline</Text>
            <Timeline
              items={executionLogs.map((log) => ({
                color: log.status === 'completed' ? 'green' : log.status === 'failed' ? 'red' : 'blue',
                children: (
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 12 }} strong>{log.nodeType}</Text>
                      <Tag style={{ marginLeft: 6, fontSize: 10 }}>{log.nodeId}</Tag>
                      <Tag color={statusColor(log.status)} style={{ fontSize: 10 }}>{log.status}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 6 }}>
                      {new Date(log.executedAt).toLocaleString()}
                    </Text>
                    <Collapse
                      size="small"
                      items={[
                        log.input != null && log.input !== '' && { key: 'input', label: 'Input', children: <pre style={{ margin: 0, fontSize: 10, overflow: 'auto', maxHeight: 160 }}>{formatJson(log.input)}</pre> },
                        log.output != null && log.output !== '' && { key: 'output', label: 'Output', children: <pre style={{ margin: 0, fontSize: 10, overflow: 'auto', maxHeight: 160 }}>{formatJson(log.output)}</pre> },
                        log.error != null && log.error !== '' && { key: 'error', label: 'Error', children: <pre style={{ margin: 0, fontSize: 10, color: 'var(--ant-color-error)' }}>{log.error}</pre> },
                      ].filter(Boolean) as { key: string; label: string; children: React.ReactNode }[]}
                    />
                  </div>
                ),
              }))}
            />
            {executionLogs.length === 0 && (
              <Text type="secondary" style={{ fontSize: 11 }}>No step logs for this execution.</Text>
            )}
          </>
        ) : null}
      </Drawer>
    </PageLayout>
  );
}
