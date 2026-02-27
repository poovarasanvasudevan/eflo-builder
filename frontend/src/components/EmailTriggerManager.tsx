import { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  Input,
  InputNumber,
  Select,
  Table,
  Space,
  Popconfirm,
  Typography,
  Tag,
  Switch,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import type { EmailTrigger } from '../api/client';

const { Text } = Typography;

interface TriggerFormState {
  workflowId: number | undefined;
  configId: number | undefined;
  mailbox: string;
  pollIntervalSec: number;
  markSeen: boolean;
  maxFetch: number;
  enabled: boolean;
}

const defaultForm: TriggerFormState = {
  workflowId: undefined,
  configId: undefined,
  mailbox: 'INBOX',
  pollIntervalSec: 60,
  markSeen: true,
  maxFetch: 10,
  enabled: true,
};

export default function EmailTriggerManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    emailTriggers,
    fetchEmailTriggers,
    addEmailTrigger,
    editEmailTrigger,
    removeEmailTrigger,
    workflows,
    configs,
    fetchConfigs,
  } = useWorkflowStore();

  const [form, setForm] = useState<TriggerFormState>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) {
      fetchEmailTriggers();
      fetchConfigs();
    }
  }, [open]);

  const emailConfigs = configs.filter((c) => c.type === 'email');

  const openNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (t: EmailTrigger) => {
    setForm({
      workflowId: t.workflowId,
      configId: t.configId,
      mailbox: t.mailbox || 'INBOX',
      pollIntervalSec: t.pollIntervalSec || 60,
      markSeen: t.markSeen,
      maxFetch: t.maxFetch || 10,
      enabled: t.enabled,
    });
    setEditingId(t.id);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.workflowId) {
      messageApi.warning('Select a workflow');
      return;
    }
    if (!form.configId) {
      messageApi.warning('Select an email config');
      return;
    }
    try {
      if (editingId) {
        await editEmailTrigger(editingId, { ...form, workflowId: form.workflowId!, configId: form.configId! });
        messageApi.success('Trigger updated');
      } else {
        await addEmailTrigger({ ...form, workflowId: form.workflowId!, configId: form.configId! });
        messageApi.success('Trigger created');
      }
      setFormOpen(false);
    } catch {
      messageApi.error('Failed to save trigger');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeEmailTrigger(id);
      messageApi.success('Trigger deleted');
    } catch {
      messageApi.error('Failed to delete trigger');
    }
  };

  const handleToggle = async (t: EmailTrigger, enabled: boolean) => {
    try {
      await editEmailTrigger(t.id, { ...t, enabled });
      messageApi.success(enabled ? 'Trigger enabled' : 'Trigger disabled');
    } catch {
      messageApi.error('Failed to update trigger');
    }
  };

  const columns = [
    {
      title: 'Workflow',
      key: 'workflow',
      render: (_: any, record: EmailTrigger) => {
        const wf = workflows.find((w) => w.id === record.workflowId);
        return <Text strong style={{ fontSize: 11 }}>{wf?.name || `#${record.workflowId}`}</Text>;
      },
    },
    {
      title: 'Mailbox',
      dataIndex: 'mailbox',
      key: 'mailbox',
      width: 80,
      render: (v: string) => <Tag style={{ fontSize: 10 }}>{v || 'INBOX'}</Tag>,
    },
    {
      title: 'Interval',
      key: 'interval',
      width: 60,
      render: (_: any, r: EmailTrigger) => <Text type="secondary" style={{ fontSize: 10 }}>{r.pollIntervalSec}s</Text>,
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
      key: 'enabled',
      width: 50,
      render: (_: any, record: EmailTrigger) => (
        <Switch size="small" checked={record.enabled} onChange={(v) => handleToggle(record, v)} />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: any, record: EmailTrigger) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Delete this trigger?" onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={<Space><InboxOutlined /><span>Email Triggers (IMAP Polling)</span></Space>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={620}
    >
      {contextHolder}
      <div style={{ marginBottom: 8 }}>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openNew}>
          Add Email Trigger
        </Button>
      </div>

      <Table
        dataSource={emailTriggers}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        style={{ fontSize: 12 }}
        locale={{ emptyText: 'No email triggers yet.' }}
      />

      <Modal
        title={editingId ? 'Edit Email Trigger' : 'New Email Trigger'}
        open={formOpen}
        onOk={handleSave}
        onCancel={() => setFormOpen(false)}
        okText={editingId ? 'Update' : 'Create'}
        width={400}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Workflow</Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              placeholder="Select workflow..."
              value={form.workflowId}
              onChange={(val) => setForm({ ...form, workflowId: val })}
              options={workflows.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Email Config</Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              placeholder="Select email server..."
              value={form.configId}
              onChange={(val) => setForm({ ...form, configId: val })}
              options={emailConfigs.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.config?.host || 'smtp'})`,
              }))}
              notFoundContent={<Text type="secondary" style={{ fontSize: 10 }}>No email configs. Create one in ⚙ Configs first.</Text>}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Mailbox</Text>
            <Input
              size="small"
              placeholder="INBOX"
              value={form.mailbox}
              onChange={(e) => setForm({ ...form, mailbox: e.target.value })}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Poll Interval (seconds)</Text>
            <InputNumber
              size="small"
              style={{ width: '100%' }}
              min={10}
              max={3600}
              value={form.pollIntervalSec}
              onChange={(val) => setForm({ ...form, pollIntervalSec: val || 60 })}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Max Emails per Poll</Text>
            <InputNumber
              size="small"
              style={{ width: '100%' }}
              min={1}
              max={100}
              value={form.maxFetch}
              onChange={(val) => setForm({ ...form, maxFetch: val || 10 })}
            />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Mark as Read</Text>
              <Switch size="small" checked={form.markSeen} onChange={(v) => setForm({ ...form, markSeen: v })} />
            </div>
            <div>
              <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Enabled</Text>
              <Switch size="small" checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} />
            </div>
          </div>
        </Space>
      </Modal>
    </Modal>
  );
}

