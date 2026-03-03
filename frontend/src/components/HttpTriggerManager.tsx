import { useEffect, useState } from 'react';
import Button from '@atlaskit/button';
import ModalDialog, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import Lozenge from '@atlaskit/lozenge';
import { useWorkflowStore } from '../store/workflowStore';
import type { HttpTrigger } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Text } from './ui/Text';
import { Icons } from './ui/Icons';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      fetchHttpTriggers();
      fetchWorkflows();
    }
  }, [open, fetchHttpTriggers, fetchWorkflows]);

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
      toast.warning('Workflow is required');
      return;
    }
    if (!form.path.trim()) {
      toast.warning('Path is required (e.g. webhook or api/events)');
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
        toast.success('HTTP trigger updated');
      } else {
        await addHttpTrigger(payload);
        toast.success('HTTP trigger created');
      }
      setFormOpen(false);
    } catch {
      toast.error('Failed to save HTTP trigger');
    }
  };

  const handleToggle = async (t: HttpTrigger, enabled: boolean) => {
    try {
      await editHttpTrigger(t.id, { ...t, enabled });
      toast.success(enabled ? 'Trigger enabled' : 'Trigger disabled');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeHttpTrigger(id);
      toast.success('HTTP trigger deleted');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const workflowName = (id: number) => workflows.find((w) => w.id === id)?.name || `#${id}`;
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/in` : '/api/in';

  if (!open) return null;

  return (
    <>
      <ModalDialog onClose={onClose} width="720px">
        <ModalHeader>
          <ModalTitle><span className="flex items-center gap-2"><Icons.Globe /> HTTP Triggers (HTTP-in / HTTP-out)</span></ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <Button appearance="primary" onClick={openNew}>
              <span className="flex items-center gap-1"><Icons.Plus /> Add HTTP Trigger</span>
            </Button>
            <Text className="text-[11px] text-[#706e6b]">Requests to /api/in/&#123;path&#125; run the workflow; use HTTP-out node to send the response.</Text>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#e8e8e8]">
                  <th className="text-left py-2 px-2 font-semibold">Workflow</th>
                  <th className="text-left py-2 px-2 font-semibold w-[80px]">Method</th>
                  <th className="text-left py-2 px-2 font-semibold">Path</th>
                  <th className="text-left py-2 px-2 font-semibold">URL</th>
                  <th className="text-left py-2 px-2 font-semibold w-[50px]">On</th>
                  <th className="text-left py-2 px-2 font-semibold w-[70px]" />
                </tr>
              </thead>
              <tbody>
                {httpTriggers.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-center text-[#706e6b]">No HTTP triggers. Add one to expose a workflow as an HTTP endpoint.</td></tr>
                )}
                {httpTriggers.map((record) => (
                  <tr key={record.id} className="border-b border-[#f0f0f0]">
                    <td className="py-2 px-2"><Text strong className="text-[11px]">{workflowName(record.workflowId)}</Text></td>
                    <td className="py-2 px-2"><Lozenge>{record.method || 'POST'}</Lozenge></td>
                    <td className="py-2 px-2 font-mono text-[10px]">{record.path || '/'}</td>
                    <td className="py-2 px-2 text-[10px] text-[#706e6b]">{baseUrl}/{record.path || 'webhook'}</td>
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
          <ModalHeader><ModalTitle>{editingId ? 'Edit HTTP Trigger' : 'New HTTP Trigger'}</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              <div>
                <Text strong className="text-[10px] block mb-0.5">Workflow</Text>
                <select className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.workflowId ?? ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, workflowId: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Select workflow (must have HTTP-in trigger node)...</option>
                  {workflows.map((wf) => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                </select>
              </div>
              <div>
                <Text strong className="text-[10px] block mb-0.5">Path</Text>
                <div className="flex items-center rounded border border-[#dfe1e6] overflow-hidden">
                  <span className="bg-[#f5f5f5] px-2 py-1 text-[10px] text-[#706e6b]">/api/in/</span>
                  <TextField placeholder="webhook or api/events" value={form.path} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, path: e.target.value })} />
                </div>
                <Text className="text-[9px] text-[#706e6b]">URL path after /api/in/ (e.g. webhook)</Text>
              </div>
              <div>
                <Text strong className="text-[10px] block mb-0.5">Method</Text>
                <select className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.method} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, method: e.target.value })}>
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="http-enabled" checked={form.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, enabled: e.target.checked })} className="rounded" />
                <label htmlFor="http-enabled"><Text strong className="text-[10px]">Enabled</Text></label>
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
