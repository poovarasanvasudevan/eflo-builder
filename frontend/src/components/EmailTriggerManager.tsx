import { useEffect, useState } from 'react';
import Button from '@atlaskit/button';
import ModalDialog, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import Lozenge from '@atlaskit/lozenge';
import { useWorkflowStore } from '../store/workflowStore';
import type { EmailTrigger } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Text } from './ui/Text';
import { Icons } from './ui/Icons';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      fetchEmailTriggers();
      fetchConfigs();
    }
  }, [open, fetchEmailTriggers, fetchConfigs]);

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
      toast.warning('Select a workflow');
      return;
    }
    if (!form.configId) {
      toast.warning('Select an email config');
      return;
    }
    try {
      if (editingId) {
        await editEmailTrigger(editingId, { ...form, workflowId: form.workflowId!, configId: form.configId! });
        toast.success('Trigger updated');
      } else {
        await addEmailTrigger({ ...form, workflowId: form.workflowId!, configId: form.configId! });
        toast.success('Trigger created');
      }
      setFormOpen(false);
    } catch {
      toast.error('Failed to save trigger');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeEmailTrigger(id);
      toast.success('Trigger deleted');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete trigger');
    }
  };

  const handleToggle = async (t: EmailTrigger, enabled: boolean) => {
    try {
      await editEmailTrigger(t.id, { ...t, enabled });
      toast.success(enabled ? 'Trigger enabled' : 'Trigger disabled');
    } catch {
      toast.error('Failed to update trigger');
    }
  };

  if (!open) return null;

  return (
    <>
      <ModalDialog onClose={onClose} width="620px">
        <ModalHeader>
          <ModalTitle><span className="flex items-center gap-2"><Icons.Inbox /> Email Triggers (IMAP Polling)</span></ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="mb-2">
            <Button appearance="primary" onClick={openNew}>
              <span className="flex items-center gap-1"><Icons.Plus /> Add Email Trigger</span>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e8e8e8]">
                  <th className="text-left py-2 px-2 font-semibold">Workflow</th>
                  <th className="text-left py-2 px-2 font-semibold w-[80px]">Mailbox</th>
                  <th className="text-left py-2 px-2 font-semibold w-[60px]">Interval</th>
                  <th className="text-left py-2 px-2 font-semibold w-[50px]">Msgs</th>
                  <th className="text-left py-2 px-2 font-semibold w-[50px]">On</th>
                  <th className="text-left py-2 px-2 font-semibold w-[60px]" />
                </tr>
              </thead>
              <tbody>
                {emailTriggers.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-center text-[#706e6b]">No email triggers yet.</td></tr>
                )}
                {emailTriggers.map((record) => (
                  <tr key={record.id} className="border-b border-[#f0f0f0]">
                    <td className="py-2 px-2"><Text strong className="text-[11px]">{workflows.find((w) => w.id === record.workflowId)?.name ?? `#${record.workflowId}`}</Text></td>
                    <td className="py-2 px-2"><Lozenge>{record.mailbox || 'INBOX'}</Lozenge></td>
                    <td className="py-2 px-2 text-[10px] text-[#706e6b]">{record.pollIntervalSec}s</td>
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
          <ModalHeader><ModalTitle>{editingId ? 'Edit Email Trigger' : 'New Email Trigger'}</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              <div>
                <Text strong className="text-[11px] block mb-0.5">Workflow</Text>
                <select className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.workflowId ?? ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, workflowId: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Select workflow...</option>
                  {workflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Email Config</Text>
                <select className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.configId ?? ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, configId: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Select email server...</option>
                  {emailConfigs.map((c) => <option key={c.id} value={c.id}>{c.name} ({(c.config as { host?: string })?.host ?? 'smtp'})</option>)}
                </select>
                {emailConfigs.length === 0 && <Text className="text-[10px] text-[#706e6b]">No email configs. Create one in ⚙ Configs first.</Text>}
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Mailbox</Text>
                <TextField placeholder="INBOX" value={form.mailbox} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, mailbox: e.target.value })} />
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Poll Interval (seconds)</Text>
                <input type="number" min={10} max={3600} className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.pollIntervalSec} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, pollIntervalSec: Number(e.target.value) || 60 })} />
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Max Emails per Poll</Text>
                <input type="number" min={1} max={100} className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.maxFetch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, maxFetch: Number(e.target.value) || 10 })} />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="email-markSeen" checked={form.markSeen} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, markSeen: e.target.checked })} className="rounded" />
                  <label htmlFor="email-markSeen"><Text strong className="text-[11px]">Mark as Read</Text></label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="email-enabled" checked={form.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, enabled: e.target.checked })} className="rounded" />
                  <label htmlFor="email-enabled"><Text strong className="text-[11px]">Enabled</Text></label>
                </div>
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
          <ModalHeader><ModalTitle>Delete this trigger?</ModalTitle></ModalHeader>
          <ModalFooter>
            <Button appearance="primary" className="!bg-red-600 hover:!bg-red-700" onClick={() => handleDelete(deleteConfirmId)}>Delete</Button>
            <Button appearance="subtle" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}
    </>
  );
}
