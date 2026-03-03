import { useEffect, useState } from 'react';
import Button from '@atlaskit/button';
import ModalDialog, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import Lozenge from '@atlaskit/lozenge';
import { useWorkflowStore } from '../store/workflowStore';
import type { RedisSubscription } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Text } from './ui/Text';
import { Icons } from './ui/Icons';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      fetchRedisSubs();
      fetchWorkflows();
      fetchConfigs();
    }
  }, [open, fetchRedisSubs, fetchWorkflows, fetchConfigs]);

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
    if (!form.workflowId) { toast.warning('Workflow is required'); return; }
    if (!form.configId) { toast.warning('Redis config is required'); return; }
    if (!form.channel.trim()) { toast.warning('Channel is required'); return; }

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
        toast.success('Subscription updated');
      } else {
        await addRedisSub(payload);
        toast.success('Subscription created');
      }
      setFormOpen(false);
    } catch {
      toast.error('Failed to save subscription');
    }
  };

  const handleToggle = async (s: RedisSubscription, enabled: boolean) => {
    try {
      await editRedisSub(s.id, { ...s, enabled });
      toast.success(enabled ? 'Subscription enabled' : 'Subscription paused');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeRedisSub(id);
      toast.success('Subscription deleted');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const workflowName = (id: number) => workflows.find((w) => w.id === id)?.name || `#${id}`;
  const configName = (id: number) => {
    const c = configs.find((c) => c.id === id);
    return c ? `${c.name}` : `#${id}`;
  };

  if (!open) return null;

  return (
    <>
      <ModalDialog onClose={onClose} width="700px">
        <ModalHeader>
          <ModalTitle><span className="flex items-center gap-2"><Icons.Bell /> Redis Subscriptions</span></ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="mb-2">
            <Button appearance="primary" onClick={openNew}>
              <span className="flex items-center gap-1"><Icons.Plus /> Add Subscription</span>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#e8e8e8]">
                  <th className="text-left py-2 px-2 font-semibold">Workflow</th>
                  <th className="text-left py-2 px-2 font-semibold">Channel</th>
                  <th className="text-left py-2 px-2 font-semibold">Server</th>
                  <th className="text-left py-2 px-2 font-semibold w-[50px]">Msgs</th>
                  <th className="text-left py-2 px-2 font-semibold w-[50px]">On</th>
                  <th className="text-left py-2 px-2 font-semibold w-[70px]" />
                </tr>
              </thead>
              <tbody>
                {redisSubs.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-center text-[#706e6b]">No subscriptions. Add one to trigger workflows on Redis messages.</td></tr>
                )}
                {redisSubs.map((record) => (
                  <tr key={record.id} className="border-b border-[#f0f0f0]">
                    <td className="py-2 px-2"><Text strong className="text-[11px]">{workflowName(record.workflowId)}</Text></td>
                    <td className="py-2 px-2">
                      <span className="flex items-center gap-1">
                        <Lozenge>{record.channel}</Lozenge>
                        {record.isPattern && <Lozenge appearance="inprogress">PATTERN</Lozenge>}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-[10px] text-[#706e6b]">{configName(record.configId)}</td>
                    <td className="py-2 px-2 text-[10px]">{record.msgCount ?? 0}</td>
                    <td className="py-2 px-2">
                      <input type="checkbox" checked={record.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleToggle(record, e.target.checked)} className="rounded" />
                    </td>
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
          <ModalHeader><ModalTitle>{editingId ? 'Edit Subscription' : 'New Subscription'}</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              <div>
                <Text strong className="text-[10px] block mb-0.5">Workflow</Text>
                <select className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.workflowId ?? ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, workflowId: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Select workflow...</option>
                  {workflows.map((wf) => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                </select>
              </div>
              <div>
                <Text strong className="text-[10px] block mb-0.5">Redis Server</Text>
                <select className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.configId ?? ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, configId: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Select Redis config...</option>
                  {redisConfigs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({(c.config as { host?: string; port?: number })?.host ?? '127.0.0.1'}:{(c.config as { port?: number })?.port ?? 6379})</option>
                  ))}
                </select>
                {redisConfigs.length === 0 && <Text className="text-[10px] text-[#706e6b]">No Redis configs found.</Text>}
              </div>
              <div>
                <Text strong className="text-[10px] block mb-0.5">Channel / Pattern</Text>
                <TextField placeholder="my-channel or events:*" value={form.channel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, channel: e.target.value })} />
              </div>
              <div>
                <Text strong className="text-[10px] block mb-0.5">Mode</Text>
                <select className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.isPattern ? 'pattern' : 'channel'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, isPattern: e.target.value === 'pattern' })}>
                  <option value="channel">SUBSCRIBE — exact channel name</option>
                  <option value="pattern">PSUBSCRIBE — glob pattern (*, ?)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="redis-enabled" checked={form.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, enabled: e.target.checked })} className="rounded" />
                <label htmlFor="redis-enabled"><Text strong className="text-[10px]">Enabled</Text></label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
            <Button appearance="subtle" onClick={() => setFormOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}

      {deleteConfirmId != null && (
        <ModalDialog onClose={() => setDeleteConfirmId(null)}>
          <ModalHeader><ModalTitle>Delete?</ModalTitle></ModalHeader>
          <ModalFooter>
            <Button appearance="primary" className="!bg-red-600 hover:!bg-red-700" onClick={() => handleDelete(deleteConfirmId)}>Delete</Button>
            <Button appearance="subtle" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}
    </>
  );
}
