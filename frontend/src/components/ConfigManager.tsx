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
  Divider,
  Typography,
  Tag,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import type { NodeConfig } from '../api/client';

const { Text } = Typography;

const CONFIG_TYPES = [
  { value: 'redis', label: 'Redis', color: '#d63031' },
  { value: 'email', label: 'Email (SMTP)', color: '#8e44ad' },
  { value: 'ssh', label: 'SSH', color: '#16a085' },
  { value: 'database', label: 'Database', color: '#2980b9' },
];

interface ConfigFormState {
  name: string;
  type: string;
  host: string;
  port: number;
  password: string;
  db: number;
  // Email-specific
  username: string;
  from: string;
  tls: boolean;
  imapHost: string;
  imapPort: number;
  // SSH-specific
  authMethod: string;
  privateKey: string;
  // Database-specific
  driver: string;
  database: string;
}

const defaultForm: ConfigFormState = {
  name: '',
  type: 'redis',
  host: '127.0.0.1',
  port: 6379,
  password: '',
  db: 0,
  username: '',
  from: '',
  tls: true,
  imapHost: '',
  imapPort: 993,
  authMethod: 'password',
  privateKey: '',
  driver: 'mysql',
  database: '',
};

export default function ConfigManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { configs, fetchConfigs, addConfig, editConfig, removeConfig } = useWorkflowStore();
  const [form, setForm] = useState<ConfigFormState>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) fetchConfigs();
  }, [open]);

  const openNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (cfg: NodeConfig) => {
    const isDb = cfg.type === 'database';
    setForm({
      name: cfg.name,
      type: cfg.type,
      host: (cfg.config?.host as string) || (cfg.type === 'email' ? 'smtp.gmail.com' : cfg.type === 'ssh' ? '' : isDb ? '127.0.0.1' : '127.0.0.1'),
      port: (cfg.config?.port as number) ?? (cfg.type === 'email' ? 587 : cfg.type === 'ssh' ? 22 : isDb ? 3306 : 6379),
      password: (cfg.config?.password as string) || '',
      db: (cfg.config?.db as number) || 0,
      username: (cfg.config?.username as string) || (cfg.config?.user as string) || '',
      from: (cfg.config?.from as string) || '',
      tls: cfg.config?.tls !== false,
      imapHost: (cfg.config?.imapHost as string) || '',
      imapPort: (cfg.config?.imapPort as number) || 993,
      authMethod: (cfg.config?.authMethod as string) || 'password',
      privateKey: (cfg.config?.privateKey as string) || '',
      driver: (cfg.config?.driver as string) || 'mysql',
      database: (cfg.config?.database as string) || '',
    });
    setEditingId(cfg.id);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      messageApi.warning('Name is required');
      return;
    }
    if (form.type === 'ssh') {
      if (!form.host.trim()) {
        messageApi.warning('Host is required for SSH config');
        return;
      }
      if (!form.username.trim()) {
        messageApi.warning('Username is required for SSH config');
        return;
      }
      if (form.authMethod === 'privateKey' && !form.privateKey.trim()) {
        messageApi.warning('Private key is required when using key authentication');
        return;
      }
      if (form.authMethod === 'password' && !form.password) {
        messageApi.warning('Password is required when using password authentication');
        return;
      }
    }
    if (form.type === 'database') {
      if (!form.host.trim()) {
        messageApi.warning('Host is required for Database config');
        return;
      }
      if (!form.username.trim()) {
        messageApi.warning('Username is required for Database config');
        return;
      }
      if (!form.database.trim()) {
        messageApi.warning('Database name is required');
        return;
      }
    }
    let configData: Record<string, any>;
    if (form.type === 'email') {
      configData = {
        host: form.host,
        port: form.port,
        username: form.username,
        password: form.password,
        from: form.from || form.username,
        tls: form.tls,
        imapHost: form.imapHost || '',
        imapPort: form.imapPort || 993,
      };
    } else if (form.type === 'ssh') {
      configData = {
        host: form.host,
        port: form.port,
        username: form.username,
        authMethod: form.authMethod,
        password: form.authMethod === 'password' ? form.password : '',
        privateKey: form.authMethod === 'privateKey' ? form.privateKey : '',
      };
    } else if (form.type === 'database') {
      configData = {
        driver: form.driver,
        host: form.host,
        port: form.port,
        username: form.username,
        password: form.password,
        database: form.database,
      };
    } else {
      configData = {
        host: form.host,
        port: form.port,
        password: form.password,
        db: form.db,
      };
    }
    const payload: Partial<NodeConfig> = {
      name: form.name.trim(),
      type: form.type,
      config: configData,
    };
    try {
      if (editingId) {
        await editConfig(editingId, payload);
        messageApi.success('Config updated');
      } else {
        await addConfig(payload);
        messageApi.success('Config created');
      }
      setFormOpen(false);
    } catch {
      messageApi.error('Failed to save config');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeConfig(id);
      messageApi.success('Config deleted');
    } catch {
      messageApi.error('Failed to delete config');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong style={{ fontSize: 12 }}>{name}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const ct = CONFIG_TYPES.find((t) => t.value === type);
        return <Tag color={ct?.color || 'default'} style={{ fontSize: 10 }}>{type}</Tag>;
      },
    },
    {
      title: 'Details',
      key: 'host',
        render: (_: any, record: NodeConfig) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {record.config?.host || 'localhost'}:{record.config?.port || ''}
          {record.type === 'redis' && record.config?.db != null ? ` / db${record.config.db}` : ''}
          {record.type === 'email' && record.config?.username ? ` (${record.config.username})` : ''}
          {record.type === 'ssh' && record.config?.username ? ` (${record.config.username})` : ''}
          {record.type === 'database' ? ` / ${record.config?.database || ''} (${record.config?.driver || 'mysql'})` : ''}
        </Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, record: NodeConfig) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete this config?"
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
          <DatabaseOutlined />
          <span>Connection Configs</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
    >
      {contextHolder}
      <div style={{ marginBottom: 8 }}>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openNew}>
          Add Config
        </Button>
      </div>

      <Table
        dataSource={configs}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        style={{ fontSize: 12 }}
        locale={{ emptyText: 'No configs yet. Click "Add Config" to create one.' }}
      />

      {/* Add/Edit Form Modal */}
      <Modal
        title={editingId ? 'Edit Config' : 'New Config'}
        open={formOpen}
        onOk={handleSave}
        onCancel={() => setFormOpen(false)}
        okText={editingId ? 'Update' : 'Create'}
        width={400}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Name</Text>
            <Input
              size="small"
              placeholder="My Redis Server"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Type</Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              value={form.type}
              onChange={(val) => {
                if (val === 'email') {
                  setForm({ ...form, type: val, host: 'smtp.gmail.com', port: 587 });
                } else if (val === 'ssh') {
                  setForm({ ...form, type: val, host: '', port: 22 });
                } else if (val === 'database') {
                  setForm({ ...form, type: val, host: '127.0.0.1', port: 3306, driver: 'mysql', database: '' });
                } else {
                  setForm({ ...form, type: val, host: '127.0.0.1', port: 6379 });
                }
              }}
              options={CONFIG_TYPES}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Host</Text>
            <Input
              size="small"
              placeholder={form.type === 'email' ? 'smtp.gmail.com' : form.type === 'ssh' ? '192.168.1.10 or host.example.com' : form.type === 'database' ? '127.0.0.1 or db.example.com' : '127.0.0.1'}
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Port</Text>
            <InputNumber
              size="small"
              style={{ width: '100%' }}
              min={1}
              max={65535}
              value={form.port}
              onChange={(val) => setForm({ ...form, port: val ?? (form.type === 'email' ? 587 : form.type === 'ssh' ? 22 : form.type === 'database' ? 3306 : 6379) })}
            />
          </div>

          {form.type === 'database' && (
            <>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Driver</Text>
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  value={form.driver}
                  onChange={(val) => setForm({ ...form, driver: val, port: val === 'sqlserver' ? 1433 : 3306 })}
                  options={[
                    { value: 'mysql', label: 'MySQL' },
                    { value: 'sqlserver', label: 'SQL Server' },
                  ]}
                />
              </div>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Database name</Text>
                <Input
                  size="small"
                  placeholder="mydb"
                  value={form.database}
                  onChange={(e) => setForm({ ...form, database: e.target.value })}
                />
              </div>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Username</Text>
                <Input
                  size="small"
                  placeholder="dbuser"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Password</Text>
                <Input.Password
                  size="small"
                  placeholder="Database password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </>
          )}

          {form.type === 'email' && (
            <>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Username</Text>
                <Input
                  size="small"
                  placeholder="user@gmail.com"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Password / App Password</Text>
                <Input.Password
                  size="small"
                  placeholder="App password or SMTP password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>From Address</Text>
                <Input
                  size="small"
                  placeholder="(defaults to username)"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                />
              </div>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>TLS</Text>
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  value={form.tls ? 'yes' : 'no'}
                  onChange={(val) => setForm({ ...form, tls: val === 'yes' })}
                  options={[
                    { value: 'yes', label: 'Enabled (recommended)' },
                    { value: 'no', label: 'Disabled' },
                  ]}
                />
              </div>
              <Divider style={{ margin: '4px 0', fontSize: 10 }}>IMAP (Receive Email)</Divider>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>IMAP Host</Text>
                <Input
                  size="small"
                  placeholder="(auto: smtp.gmail.com → imap.gmail.com)"
                  value={form.imapHost}
                  onChange={(e) => setForm({ ...form, imapHost: e.target.value })}
                />
                <Text type="secondary" style={{ fontSize: 9 }}>Leave empty to auto-derive from SMTP host.</Text>
              </div>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>IMAP Port</Text>
                <InputNumber
                  size="small"
                  style={{ width: '100%' }}
                  min={1}
                  max={65535}
                  value={form.imapPort}
                  onChange={(val) => setForm({ ...form, imapPort: val || 993 })}
                />
              </div>
            </>
          )}

          {form.type === 'redis' && (
            <>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Password</Text>
                <Input.Password
                  size="small"
                  placeholder="(optional)"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Database</Text>
                <InputNumber
                  size="small"
                  style={{ width: '100%' }}
                  min={0}
                  max={15}
                  value={form.db}
                  onChange={(val) => setForm({ ...form, db: val || 0 })}
                />
              </div>
            </>
          )}

          {form.type === 'ssh' && (
            <>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Username</Text>
                <Input
                  size="small"
                  placeholder="root or deploy"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Authentication</Text>
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  value={form.authMethod}
                  onChange={(val) => setForm({ ...form, authMethod: val })}
                  options={[
                    { value: 'password', label: 'Password' },
                    { value: 'privateKey', label: 'Private key (PEM)' },
                  ]}
                />
              </div>
              {form.authMethod === 'password' && (
                <div>
                  <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Password</Text>
                  <Input.Password
                    size="small"
                    placeholder="SSH password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              )}
              {form.authMethod === 'privateKey' && (
                <div>
                  <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Private key (PEM)</Text>
                  <Input.TextArea
                    size="small"
                    rows={4}
                    placeholder="-----BEGIN ... END ...-----"
                    value={form.privateKey}
                    onChange={(e) => setForm({ ...form, privateKey: e.target.value })}
                    style={{ fontFamily: 'monospace', fontSize: 10 }}
                  />
                  <Text type="secondary" style={{ fontSize: 9 }}>Paste the full PEM content including the header and footer.</Text>
                </div>
              )}
            </>
          )}
        </Space>
      </Modal>
    </Modal>
  );
}

