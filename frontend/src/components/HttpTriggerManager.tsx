import { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  Input,
  Select,
  Table,
  Space,
  Switch,
  Popconfirm,
  Typography,
  Tag,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import type { HttpTrigger } from '../api/client';

const { Text } = Typography;

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

interface FormState {
  workflowId: number | undefined;
  path: string;
  method: string;
  enabled: boolean;
}

const defaultForm: FormState = {
  workflowId: undefined,
  path: '',
  method: 'POST',
  enabled: true,
};

export default function HttpTriggerManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    httpTriggers,
    workflows,
    fetchHttpTriggers,
    fetchWorkflows,
    addHttpTrigger,
    editHttpTrigger,
    removeHttpTrigger,
  } = useWorkflowStore();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) {
      fetchHttpTriggers();
      fetchWorkflows();
    }
  }, [open]);

  const openNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (t: HttpTrigger) => {
    setForm({
      workflowId: t.workflowId,
      path: t.path,
      method: t.method || 'POST',
      enabled: t.enabled,
    });
    setEditingId(t.id);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.workflowId) {
      messageApi.warning('Workflow is required');
      return;
    }
    if (!form.path.trim()) {
      messageApi.warning('Path is required (e.g. webhook or api/events)');
      return;
    }
    const path = form.path.trim().replace(/^\/+/, '').replace(/^api\/in\/?/, '');
    const payload: Partial<HttpTrigger> = {
      workflowId: form.workflowId,
      path: path || 'webhook',
      method: form.method,
      enabled: form.enabled,
    };
    try {
      if (editingId) {
        await editHttpTrigger(editingId, payload);
        messageApi.success('HTTP trigger updated');
      } else {
        await addHttpTrigger(payload);
        messageApi.success('HTTP trigger created');
      }
      setFormOpen(false);
    } catch {
      messageApi.error('Failed to save HTTP trigger');
    }
  };

  const handleToggle = async (t: HttpTrigger, enabled: boolean) => {
    try {
      await editHttpTrigger(t.id, { ...t, enabled });
      messageApi.success(enabled ? 'Trigger enabled' : 'Trigger disabled');
    } catch {
      messageApi.error('Failed to update');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeHttpTrigger(id);
      messageApi.success('HTTP trigger deleted');
    } catch {
      messageApi.error('Failed to delete');
    }
  };

  const workflowName = (id: number) => workflows.find((w) => w.id === id)?.name || `#${id}`;
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/in` : '/api/in';

  const columns = [
    {
      title: 'Workflow',
      dataIndex: 'workflowId',
      key: 'workflowId',
      render: (id: number) => <Text strong style={{ fontSize: 11 }}>{workflowName(id)}</Text>,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (m: string) => <Tag style={{ fontSize: 10 }}>{m || 'POST'}</Tag>,
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      render: (path: string) => (
        <Text code style={{ fontSize: 10 }}>{path || '/'}</Text>
      ),
    },
    {
      title: 'URL',
      key: 'url',
      render: (_: unknown, record: HttpTrigger) => (
        <Text type="secondary" style={{ fontSize: 10 }}>
          {baseUrl}/{record.path || 'webhook'}
        </Text>
      ),
    },
    {
      title: 'On',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 50,
      render: (enabled: boolean, record: HttpTrigger) => (
        <Switch size="small" checked={enabled} onChange={(v) => handleToggle(record, v)} />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 70,
      render: (_: unknown, record: HttpTrigger) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)} okButtonProps={{ danger: true }}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <GlobalOutlined />
          <span>HTTP Triggers (HTTP-in / HTTP-out)</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
    >
      {contextHolder}
      <div style={{ marginBottom: 8 }}>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openNew}>
          Add HTTP Trigger
        </Button>
        <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
          Requests to /api/in/&#123;path&#125; run the workflow; use HTTP-out node to send the response.
        </Text>
      </div>

      <Table
        dataSource={httpTriggers}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        style={{ fontSize: 11 }}
        locale={{ emptyText: 'No HTTP triggers. Add one to expose a workflow as an HTTP endpoint.' }}
      />

      <Modal
        title={editingId ? 'Edit HTTP Trigger' : 'New HTTP Trigger'}
        open={formOpen}
        onOk={handleSave}
        onCancel={() => setFormOpen(false)}
        okText={editingId ? 'Update' : 'Create'}
        width={400}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Workflow</Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              placeholder="Select workflow (must have HTTP-in trigger node)..."
              value={form.workflowId}
              onChange={(val) => setForm({ ...form, workflowId: val })}
              options={workflows.map((wf) => ({ value: wf.id, label: wf.name }))}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Path</Text>
            <Input
              size="small"
              placeholder="webhook or api/events"
              value={form.path}
              onChange={(e) => setForm({ ...form, path: e.target.value })}
              addonBefore="/api/in/"
            />
            <Text type="secondary" style={{ fontSize: 9 }}>URL path after /api/in/ (e.g. webhook)</Text>
          </div>
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Method</Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              value={form.method}
              onChange={(val) => setForm({ ...form, method: val })}
              options={METHODS.map((m) => ({ value: m, label: m }))}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Enabled</Text>
            <Switch size="small" checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} />
          </div>
        </Space>
      </Modal>
    </Modal>
  );
}
