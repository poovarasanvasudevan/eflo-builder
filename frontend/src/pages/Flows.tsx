import { Table, Button, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { HistoryOutlined } from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import { useNavigate } from 'react-router';
import {NormalToolbar} from "../components/NormalToolbar.tsx";

export default function Flows() {
  const { workflows, fetchWorkflows } = useWorkflowStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchWorkflows().finally(() => setLoading(false));
  }, [fetchWorkflows]);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Updated', dataIndex: 'updatedAt', key: 'updatedAt', render: (v: string) => v ? new Date(v).toLocaleString() : '' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Tooltip title="Executions">
          <Button
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/flows/${record.id}/executions`)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NormalToolbar />
      <div style={{ flex: 1, padding: 24 }}>
        <Table
          columns={columns}
          dataSource={workflows}
          rowKey="id"
          loading={loading}
          bordered
        />
      </div>
    </div>
  );
}

