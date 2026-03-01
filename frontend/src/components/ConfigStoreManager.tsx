import { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  Input,
  Table,
  Space,
  Popconfirm,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import { getConfigStoreEntry, type ConfigStoreEntryMasked } from '../api/client';

const { Text } = Typography;

interface FormState {
  key: string;
  value: string;
  description: string;
}

export default function ConfigStoreManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { configStoreEntries, fetchConfigStore, setConfigStoreEntry, removeConfigStoreEntry } = useWorkflowStore();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ key: '', value: '', description: '' });
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) fetchConfigStore();
  }, [open]);

  const openNew = () => {
    setForm({ key: '', value: '', description: '' });
    setEditingKey(null);
    setFormOpen(true);
  };

  const openEdit = async (key: string) => {
    try {
      const res = await getConfigStoreEntry(key);
      setForm({
        key: res.data.key,
        value: res.data.value,
        description: res.data.description || '',
      });
      setEditingKey(key);
      setFormOpen(true);
    } catch {
      messageApi.error('Failed to load entry');
    }
  };

  const handleSave = async () => {
    if (!form.key.trim()) {
      messageApi.warning('Key is required');
      return;
    }
    try {
      await setConfigStoreEntry({
        key: form.key.trim(),
        value: form.value,
        description: form.description.trim() || undefined,
      });
      messageApi.success(editingKey ? 'Entry updated' : 'Entry created');
      setFormOpen(false);
    } catch {
      messageApi.error('Failed to save');
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await removeConfigStoreEntry(key);
      messageApi.success('Entry deleted');
    } catch {
      messageApi.error('Failed to delete');
    }
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => <Text strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{key}</Text>,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: () => <Text type="secondary" style={{ fontSize: 11 }}>********</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d: string) => (d ? <Text type="secondary" style={{ fontSize: 11 }}>{d}</Text> : '—'),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: ConfigStoreEntryMasked) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(record.key)} />
          <Popconfirm
            title="Delete this entry?"
            onConfirm={() => handleDelete(record.key)}
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
          <SafetyCertificateOutlined />
          <span>Config Store</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
    >
      {contextHolder}
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
        Key-value store for secrets, tokens, and config. Use Get Config Store / Set Config Store nodes in workflows to read and write.
      </Text>
      <div style={{ marginBottom: 8 }}>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openNew}>
          Add entry
        </Button>
      </div>

      <Table
        dataSource={configStoreEntries}
        columns={columns}
        rowKey="key"
        size="small"
        pagination={false}
        style={{ fontSize: 12 }}
        locale={{ emptyText: 'No entries. Click "Add entry" to create one.' }}
      />

      {/* Set / Edit form modal */}
      <Modal
        title={editingKey ? 'Edit entry' : 'Add entry'}
        open={formOpen}
        onOk={handleSave}
        onCancel={() => setFormOpen(false)}
        okText={editingKey ? 'Update' : 'Save'}
        width={420}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Key</Text>
            <Input
              size="small"
              placeholder="e.g. API_SECRET, AUTH_TOKEN"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              disabled={!!editingKey}
              style={{ fontFamily: 'monospace' }}
            />
            {editingKey && <Text type="secondary" style={{ fontSize: 9 }}>Key cannot be changed when editing.</Text>}
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Value</Text>
            <Input.Password
              size="small"
              placeholder="Secret or token value"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Description (optional)</Text>
            <Input
              size="small"
              placeholder="e.g. API key for service X"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </Space>
      </Modal>
    </Modal>
  );
}
