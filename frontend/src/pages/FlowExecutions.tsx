import { Table } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useWorkflowStore } from '../store/workflowStore';
import {NormalToolbar} from "../components/NormalToolbar.tsx";

export default function FlowExecutions() {
  const { flowId } = useParams();
  const { fetchExecutionsForFlow } = useWorkflowStore();
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!flowId) return;
    setLoading(true);
    fetchExecutionsForFlow(flowId).then(setExecutions).finally(() => setLoading(false));
  }, [flowId, fetchExecutionsForFlow]);

  const columns = [
    { title: 'Execution ID', dataIndex: 'id', key: 'id' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Started', dataIndex: 'startedAt', key: 'startedAt', render: (v: string) => v ? new Date(v).toLocaleString() : '' },
    { title: 'Ended', dataIndex: 'endedAt', key: 'endedAt', render: (v: string) => v ? new Date(v).toLocaleString() : '' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NormalToolbar />
      <div style={{ flex: 1, padding: 24 }}>
        <Table
          columns={columns}
          dataSource={executions}
          rowKey="id"
          loading={loading}
          bordered
        />
      </div>
    </div>
  );
}

