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
  FieldTimeOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import type { CronSchedule } from '../api/client';

const { Text } = Typography;

interface ScheduleFormState {
  workflowId: number | undefined;
  expression: string;
  timezone: string;
  enabled: boolean;
}

const defaultForm: ScheduleFormState = {
  workflowId: undefined,
  expression: '*/5 * * * *',
  timezone: 'UTC',
  enabled: true,
};

export default function ScheduleManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { schedules, workflows, fetchSchedules, fetchWorkflows, addSchedule, editSchedule, removeSchedule } =
    useWorkflowStore();
  const [form, setForm] = useState<ScheduleFormState>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) {
      fetchSchedules();
      fetchWorkflows();
    }
  }, [open]);

  const openNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (s: CronSchedule) => {
    setForm({
      workflowId: s.workflowId,
      expression: s.expression,
      timezone: s.timezone,
      enabled: s.enabled,
    });
    setEditingId(s.id);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.workflowId) {
      messageApi.warning('Workflow is required');
      return;
    }
    if (!form.expression.trim()) {
      messageApi.warning('Cron expression is required');
      return;
    }
    const payload: Partial<CronSchedule> = {
      workflowId: form.workflowId,
      expression: form.expression.trim(),
      timezone: form.timezone,
      enabled: form.enabled,
    };
    try {
      if (editingId) {
        await editSchedule(editingId, payload);
        messageApi.success('Schedule updated');
      } else {
        await addSchedule(payload);
        messageApi.success('Schedule created');
      }
      setFormOpen(false);
    } catch {
      messageApi.error('Failed to save schedule');
    }
  };

  const handleToggle = async (s: CronSchedule, enabled: boolean) => {
    try {
      await editSchedule(s.id, { ...s, enabled });
      messageApi.success(enabled ? 'Schedule enabled' : 'Schedule paused');
    } catch {
      messageApi.error('Failed to update schedule');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeSchedule(id);
      messageApi.success('Schedule deleted');
    } catch {
      messageApi.error('Failed to delete schedule');
    }
  };

  const workflowName = (id: number) => {
    const wf = workflows.find((w) => w.id === id);
    return wf?.name || `#${id}`;
  };

  const columns = [
    {
      title: 'Workflow',
      dataIndex: 'workflowId',
      key: 'workflowId',
      render: (id: number) => <Text strong style={{ fontSize: 12 }}>{workflowName(id)}</Text>,
    },
    {
      title: 'Expression',
      dataIndex: 'expression',
      key: 'expression',
      render: (expr: string) => (
        <Tag style={{ fontFamily: 'monospace', fontSize: 11 }}>{expr}</Tag>
      ),
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 70,
      render: (enabled: boolean, record: CronSchedule) => (
        <Switch size="small" checked={enabled} onChange={(v) => handleToggle(record, v)} />
      ),
    },
    {
      title: 'Next Run',
      dataIndex: 'nextRunAt',
      key: 'nextRunAt',
      render: (v: string | undefined) =>
        v ? (
          <Text type="secondary" style={{ fontSize: 10 }}>
            {new Date(v).toLocaleString()}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 10 }}>—</Text>
        ),
    },
    {
      title: 'Last Run',
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      render: (v: string | undefined) =>
        v ? (
          <Text type="secondary" style={{ fontSize: 10 }}>
            {new Date(v).toLocaleString()}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 10 }}>—</Text>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, record: CronSchedule) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete this schedule?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
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
          <FieldTimeOutlined />
          <span>Cron Schedules</span>
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
          Add Schedule
        </Button>
      </div>

      <Table
        dataSource={schedules}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        style={{ fontSize: 12 }}
        locale={{ emptyText: 'No schedules yet. Add one to auto-run workflows.' }}
      />

      <Modal
        title={editingId ? 'Edit Schedule' : 'New Schedule'}
        open={formOpen}
        onOk={handleSave}
        onCancel={() => setFormOpen(false)}
        okText={editingId ? 'Update' : 'Create'}
        width={420}
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
              options={workflows.map((wf) => ({ value: wf.id, label: wf.name }))}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Preset</Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              placeholder="Choose preset..."
              value={undefined}
              onChange={(val) => { if (val) setForm({ ...form, expression: val }); }}
              options={[
                { value: '* * * * *', label: 'Every minute' },
                { value: '*/5 * * * *', label: 'Every 5 minutes' },
                { value: '*/15 * * * *', label: 'Every 15 minutes' },
                { value: '0 * * * *', label: 'Every hour' },
                { value: '0 */6 * * *', label: 'Every 6 hours' },
                { value: '0 0 * * *', label: 'Daily at midnight' },
                { value: '0 9 * * *', label: 'Daily at 9 AM' },
                { value: '0 0 * * 1', label: 'Weekly (Monday)' },
                { value: '0 0 1 * *', label: 'Monthly (1st)' },
              ]}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Cron Expression</Text>
            <Input
              size="small"
              style={{ fontFamily: 'monospace' }}
              placeholder="*/5 * * * *"
              value={form.expression}
              onChange={(e) => setForm({ ...form, expression: e.target.value })}
            />
            <Text type="secondary" style={{ fontSize: 9 }}>min hour dom month dow</Text>
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Timezone</Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              showSearch
              value={form.timezone}
              onChange={(val) => setForm({ ...form, timezone: val })}
              options={[
                { value: 'UTC', label: 'UTC' },
                { value: 'America/New_York', label: 'US Eastern' },
                { value: 'America/Chicago', label: 'US Central' },
                { value: 'America/Los_Angeles', label: 'US Pacific' },
                { value: 'Europe/London', label: 'London' },
                { value: 'Europe/Berlin', label: 'Berlin' },
                { value: 'Asia/Kolkata', label: 'India (IST)' },
                { value: 'Asia/Tokyo', label: 'Tokyo' },
                { value: 'Asia/Shanghai', label: 'Shanghai' },
                { value: 'Australia/Sydney', label: 'Sydney' },
              ]}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Enabled</Text>
            <Switch
              size="small"
              checked={form.enabled}
              onChange={(v) => setForm({ ...form, enabled: v })}
            />
          </div>
        </Space>
      </Modal>
    </Modal>
  );
}

