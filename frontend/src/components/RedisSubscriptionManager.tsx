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
  NotificationOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import type { RedisSubscription } from '../api/client';

const { Text } = Typography;

interface FormState {
  workflowId: number | undefined;
  configId: number | undefined;
  channel: string;
  isPattern: boolean;
  enabled: boolean;
}

const defaultForm: FormState = {
  workflowId: undefined,
  configId: undefined,
  channel: '',
  isPattern: false,
  enabled: true,
};

export default function RedisSubscriptionManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    redisSubs, workflows, configs,
    fetchRedisSubs, fetchWorkflows, fetchConfigs,
    addRedisSub, editRedisSub, removeRedisSub,
  } = useWorkflowStore();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) {
      fetchRedisSubs();
      fetchWorkflows();
      fetchConfigs();
    }
  }, [open]);

  const redisConfigs = configs.filter((c) => c.type === 'redis');

  const openNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (s: RedisSubscription) => {
    setForm({
      workflowId: s.workflowId,
      configId: s.configId,
      channel: s.channel,
      isPattern: s.isPattern,
      enabled: s.enabled,
    });
    setEditingId(s.id);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.workflowId) { messageApi.warning('Workflow is required'); return; }
    if (!form.configId) { messageApi.warning('Redis config is required'); return; }
    if (!form.channel.trim()) { messageApi.warning('Channel is required'); return; }

    const payload: Partial<RedisSubscription> = {
      workflowId: form.workflowId,
      configId: form.configId,
      channel: form.channel.trim(),
      isPattern: form.isPattern,
      enabled: form.enabled,
    };
    try {
      if (editingId) {
        await editRedisSub(editingId, payload);
        messageApi.success('Subscription updated');
      } else {
        await addRedisSub(payload);
        messageApi.success('Subscription created');
      }
      setFormOpen(false);
    } catch {
      messageApi.error('Failed to save subscription');
    }
  };

  const handleToggle = async (s: RedisSubscription, enabled: boolean) => {
    try {
      await editRedisSub(s.id, { ...s, enabled });
      messageApi.success(enabled ? 'Subscription enabled' : 'Subscription paused');
    } catch {
      messageApi.error('Failed to update');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeRedisSub(id);
      messageApi.success('Subscription deleted');
    } catch {
      messageApi.error('Failed to delete');
    }
  };

  const workflowName = (id: number) => workflows.find((w) => w.id === id)?.name || `#${id}`;
  const configName = (id: number) => {
    const c = configs.find((c) => c.id === id);
    return c ? `${c.name}` : `#${id}`;
  };

  const columns = [
    {
      title: 'Workflow',
      dataIndex: 'workflowId',
      key: 'workflowId',
      render: (id: number) => <Text strong style={{ fontSize: 11 }}>{workflowName(id)}</Text>,
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      render: (ch: string, record: RedisSubscription) => (
        <span>
          <Tag style={{ fontFamily: 'monospace', fontSize: 10 }}>{ch}</Tag>
          {record.isPattern && <Tag color="orange" style={{ fontSize: 9 }}>PATTERN</Tag>}
        </span>
      ),
    },
    {
      title: 'Server',
      dataIndex: 'configId',
      key: 'configId',
      render: (id: number) => <Text type="secondary" style={{ fontSize: 10 }}>{configName(id)}</Text>,
    },
    {
      title: 'Msgs',
      dataIndex: 'msgCount',
      key: 'msgCount',
      width: 50,
      render: (v: number) => <Text style={{ fontSize: 10 }}>{v}</Text>,
    },
    {
      title: 'On',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 50,
      render: (enabled: boolean, record: RedisSubscription) => (
        <Switch size="small" checked={enabled} onChange={(v) => handleToggle(record, v)} />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 70,
      render: (_: any, record: RedisSubscription) => (
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
      title={<Space><NotificationOutlined /><span>Redis Subscriptions</span></Space>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {contextHolder}
      <div style={{ marginBottom: 8 }}>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openNew}>
          Add Subscription
        </Button>
      </div>

      <Table
        dataSource={redisSubs}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        style={{ fontSize: 11 }}
        locale={{ emptyText: 'No subscriptions. Add one to trigger workflows on Redis messages.' }}
      />

      <Modal
        title={editingId ? 'Edit Subscription' : 'New Subscription'}
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
              placeholder="Select workflow..."
              value={form.workflowId}
              onChange={(val) => setForm({ ...form, workflowId: val })}
              options={workflows.map((wf) => ({ value: wf.id, label: wf.name }))}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Redis Server</Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              placeholder="Select Redis config..."
              value={form.configId}
              onChange={(val) => setForm({ ...form, configId: val })}
              options={redisConfigs.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.config?.host || '127.0.0.1'}:${c.config?.port || 6379})`,
              }))}
              notFoundContent={<Text type="secondary" style={{ fontSize: 10 }}>No Redis configs found.</Text>}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Channel / Pattern</Text>
            <Input
              size="small"
              placeholder="my-channel or events:*"
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Mode</Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              value={form.isPattern ? 'pattern' : 'channel'}
              onChange={(val) => setForm({ ...form, isPattern: val === 'pattern' })}
              options={[
                { value: 'channel', label: 'SUBSCRIBE — exact channel name' },
                { value: 'pattern', label: 'PSUBSCRIBE — glob pattern (*, ?)' },
              ]}
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

