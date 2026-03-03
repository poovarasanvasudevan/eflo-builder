import { useEffect, useState } from 'react';
import Button from '@atlaskit/button';
import Lozenge from '@atlaskit/lozenge';
import ModalDialog, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import { useWorkflowStore } from '../store/workflowStore';
import type { NodeConfig } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Text } from './ui/Text';
import { Icons } from './ui/Icons';

const CONFIG_TYPES = [
  { value: 'redis', label: 'Redis', color: '#d63031', appearance: 'removed' as const },
  { value: 'email', label: 'Email (SMTP)', color: '#8e44ad', appearance: 'new' as const },
  { value: 'ssh', label: 'SSH', color: '#16a085', appearance: 'success' as const },
  { value: 'database', label: 'Database', color: '#2980b9', appearance: 'inprogress' as const },
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) fetchConfigs();
  }, [open, fetchConfigs]);

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
      toast.warning('Name is required');
      return;
    }
    if (form.type === 'ssh') {
      if (!form.host.trim()) {
        toast.warning('Host is required for SSH config');
        return;
      }
      if (!form.username.trim()) {
        toast.warning('Username is required for SSH config');
        return;
      }
      if (form.authMethod === 'privateKey' && !form.privateKey.trim()) {
        toast.warning('Private key is required when using key authentication');
        return;
      }
      if (form.authMethod === 'password' && !form.password) {
        toast.warning('Password is required when using password authentication');
        return;
      }
    }
    if (form.type === 'database') {
      if (!form.host.trim()) {
        toast.warning('Host is required for Database config');
        return;
      }
      if (!form.username.trim()) {
        toast.warning('Username is required for Database config');
        return;
      }
      if (!form.database.trim()) {
        toast.warning('Database name is required');
        return;
      }
    }
    let configData: Record<string, unknown>;
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
        toast.success('Config updated');
      } else {
        await addConfig(payload);
        toast.success('Config created');
      }
      setFormOpen(false);
    } catch {
      toast.error('Failed to save config');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeConfig(id);
      toast.success('Config deleted');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete config');
    }
  };

  const renderDetails = (record: NodeConfig) => {
    const host = record.config?.host || 'localhost';
    const port = record.config?.port || '';
    const base = `${host}:${port}`;
    if (record.type === 'redis' && record.config?.db != null) return `${base} / db${record.config.db}`;
    if (record.type === 'email' && record.config?.username) return `${base} (${record.config.username})`;
    if (record.type === 'ssh' && record.config?.username) return `${base} (${record.config.username})`;
    if (record.type === 'database') return `${base} / ${record.config?.database || ''} (${record.config?.driver || 'mysql'})`;
    return base;
  };

  const typeAppearance = (type: string) => CONFIG_TYPES.find((t) => t.value === type)?.appearance ?? 'default';

  if (!open) return null;

  return (
    <>
      <ModalDialog onClose={onClose} width="560px">
        <ModalHeader>
          <ModalTitle>
            <span className="flex items-center gap-2"><Icons.Database /> Connection Configs</span>
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="mb-2">
            <Button appearance="primary" onClick={openNew}>
              <span className="flex items-center gap-1"><Icons.Plus /> Add Config</span>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e8e8e8]">
                  <th className="text-left py-2 px-2 font-semibold">Name</th>
                  <th className="text-left py-2 px-2 font-semibold w-20">Type</th>
                  <th className="text-left py-2 px-2 font-semibold">Details</th>
                  <th className="text-left py-2 px-2 font-semibold w-20" />
                </tr>
              </thead>
              <tbody>
                {configs.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-[#706e6b]">No configs yet. Click &quot;Add Config&quot; to create one.</td></tr>
                )}
                {configs.map((record) => (
                  <tr key={record.id} className="border-b border-[#f0f0f0]">
                    <td className="py-2 px-2"><Text strong>{record.name}</Text></td>
                    <td className="py-2 px-2"><Lozenge appearance={typeAppearance(record.type)}>{record.type}</Lozenge></td>
                    <td className="py-2 px-2 text-[11px] text-[#706e6b]">{renderDetails(record)}</td>
                    <td className="py-2 px-2">
                      <button type="button" className="p-0.5 rounded hover:bg-black/10 mr-0.5" onClick={() => openEdit(record)} aria-label="Edit"><Icons.Edit /></button>
                      <button type="button" className="p-0.5 rounded hover:bg-red-100 text-red-600" onClick={() => setDeleteConfirmId(record.id)} aria-label="Delete"><Icons.Delete /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalBody>
      </ModalDialog>

      {formOpen && (
        <ModalDialog onClose={() => setFormOpen(false)} width="400px">
          <ModalHeader><ModalTitle>{editingId ? 'Edit Config' : 'New Config'}</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              <div>
                <Text strong className="text-[11px] block mb-0.5">Name</Text>
                <TextField placeholder="My Redis Server" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Type</Text>
                <select
                  className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1.5 bg-white"
                  value={form.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const val = e.target.value;
                    if (val === 'email') setForm({ ...form, type: val, host: 'smtp.gmail.com', port: 587 });
                    else if (val === 'ssh') setForm({ ...form, type: val, host: '', port: 22 });
                    else if (val === 'database') setForm({ ...form, type: val, host: '127.0.0.1', port: 3306, driver: 'mysql', database: '' });
                    else setForm({ ...form, type: val, host: '127.0.0.1', port: 6379 });
                  }}
                >
                  {CONFIG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Host</Text>
                <TextField
                  placeholder={form.type === 'email' ? 'smtp.gmail.com' : form.type === 'ssh' ? '192.168.1.10 or host.example.com' : form.type === 'database' ? '127.0.0.1 or db.example.com' : '127.0.0.1'}
                  value={form.host}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, host: e.target.value })}
                />
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Port</Text>
                <input
                  type="number"
                  min={1}
                  max={65535}
                  className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1"
                  value={form.port}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, port: e.target.value === '' ? (form.type === 'email' ? 587 : form.type === 'ssh' ? 22 : form.type === 'database' ? 3306 : 6379) : Number(e.target.value) })}
                />
              </div>

              {form.type === 'database' && (
                <>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">Driver</Text>
                    <select
                      className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1.5 bg-white"
                      value={form.driver}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, driver: e.target.value, port: e.target.value === 'sqlserver' ? 1433 : 3306 })}
                    >
                      <option value="mysql">MySQL</option>
                      <option value="sqlserver">SQL Server</option>
                    </select>
                  </div>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">Database name</Text>
                    <TextField placeholder="mydb" value={form.database} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, database: e.target.value })} />
                  </div>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">Username</Text>
                    <TextField placeholder="dbuser" value={form.username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, username: e.target.value })} />
                  </div>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">Password</Text>
                    <input type="password" className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" placeholder="Database password" value={form.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })} />
                  </div>
                </>
              )}

              {form.type === 'email' && (
                <>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">Username</Text>
                    <TextField placeholder="user@gmail.com" value={form.username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, username: e.target.value })} />
                  </div>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">Password / App Password</Text>
                    <input type="password" className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" placeholder="App password or SMTP password" value={form.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })} />
                  </div>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">From Address</Text>
                    <TextField placeholder="(defaults to username)" value={form.from} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, from: e.target.value })} />
                  </div>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">TLS</Text>
                    <select
                      className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1.5 bg-white"
                      value={form.tls ? 'yes' : 'no'}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, tls: e.target.value === 'yes' })}
                    >
                      <option value="yes">Enabled (recommended)</option>
                      <option value="no">Disabled</option>
                    </select>
                  </div>
                  <div className="border-t border-[#e8e8e8] pt-2 mt-1">
                    <Text strong className="text-[11px] block mb-1">IMAP</Text>
                  </div>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">IMAP Host</Text>
                    <TextField placeholder="(auto: smtp.gmail.com → imap.gmail.com)" value={form.imapHost} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, imapHost: e.target.value })} />
                    <Text className="text-[9px] text-[#706e6b]">Leave empty to auto-derive from SMTP host.</Text>
                  </div>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">IMAP Port</Text>
                    <input type="number" min={1} max={65535} className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.imapPort} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, imapPort: e.target.value === '' ? 993 : Number(e.target.value) })} />
                  </div>
                </>
              )}

              {form.type === 'redis' && (
                <>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">Password</Text>
                    <input type="password" className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" placeholder="(optional)" value={form.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })} />
                  </div>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">Database</Text>
                    <input type="number" min={0} max={15} className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.db} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, db: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </div>
                </>
              )}

              {form.type === 'ssh' && (
                <>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">Username</Text>
                    <TextField placeholder="root or deploy" value={form.username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, username: e.target.value })} />
                  </div>
                  <div>
                    <Text strong className="text-[11px] block mb-0.5">Authentication</Text>
                    <select
                      className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1.5 bg-white"
                      value={form.authMethod}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, authMethod: e.target.value })}
                    >
                      <option value="password">Password</option>
                      <option value="privateKey">Private key (PEM)</option>
                    </select>
                  </div>
                  {form.authMethod === 'password' && (
                    <div>
                      <Text strong className="text-[11px] block mb-0.5">Password</Text>
                      <input type="password" className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" placeholder="SSH password" value={form.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })} />
                    </div>
                  )}
                  {form.authMethod === 'privateKey' && (
                    <div>
                      <Text strong className="text-[11px] block mb-0.5">Private key (PEM)</Text>
                      <textarea rows={4} className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1 font-mono" placeholder="-----BEGIN ... END ...-----" value={form.privateKey} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, privateKey: e.target.value })} />
                      <Text className="text-[9px] text-[#706e6b]">Paste the full PEM content including the header and footer.</Text>
                    </div>
                  )}
                </>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
            <Button appearance="subtle" onClick={() => setFormOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}

      {deleteConfirmId !== null && (
        <ModalDialog onClose={() => setDeleteConfirmId(null)}>
          <ModalHeader><ModalTitle>Delete this config?</ModalTitle></ModalHeader>
          <ModalBody><p>This action cannot be undone.</p></ModalBody>
          <ModalFooter>
            <Button appearance="primary" className="!bg-red-600 hover:!bg-red-700" onClick={() => handleDelete(deleteConfirmId)}>Delete</Button>
            <Button appearance="subtle" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}
    </>
  );
}
