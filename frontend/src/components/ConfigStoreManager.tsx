import { useEffect, useState } from 'react';
import Button from '@atlaskit/button';
import ModalDialog, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import { useWorkflowStore } from '../store/workflowStore';
import { getConfigStoreEntry, type ConfigStoreEntryMasked } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Text } from './ui/Text';
import { Icons } from './ui/Icons';

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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) fetchConfigStore();
  }, [open, fetchConfigStore]);

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
      toast.error('Failed to load entry');
    }
  };

  const handleSave = async () => {
    if (!form.key.trim()) {
      toast.warning('Key is required');
      return;
    }
    try {
      await setConfigStoreEntry({
        key: form.key.trim(),
        value: form.value,
        description: form.description.trim() || undefined,
      });
      toast.success(editingKey ? 'Entry updated' : 'Entry created');
      setFormOpen(false);
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await removeConfigStoreEntry(key);
      toast.success('Entry deleted');
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (!open) return null;

  return (
    <>
      <ModalDialog onClose={onClose} width="560px">
        <ModalHeader>
          <ModalTitle>
            <span className="flex items-center gap-2"><Icons.Safety /> Config Store</span>
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Text className="text-[11px] text-[#706e6b] block mb-2">Key-value store for secrets, tokens, and config. Use Get Config Store / Set Config Store nodes in workflows to read and write.</Text>
          <div className="mb-2">
            <Button appearance="primary" onClick={openNew}>
              <span className="flex items-center gap-1"><Icons.Plus /> Add entry</span>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e8e8e8]">
                  <th className="text-left py-2 px-2 font-semibold">Key</th>
                  <th className="text-left py-2 px-2 font-semibold">Value</th>
                  <th className="text-left py-2 px-2 font-semibold">Description</th>
                  <th className="text-left py-2 px-2 font-semibold w-[90px]" />
                </tr>
              </thead>
              <tbody>
                {configStoreEntries.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-[#706e6b]">No entries. Click &quot;Add entry&quot; to create one.</td></tr>
                )}
                {configStoreEntries.map((record: ConfigStoreEntryMasked) => (
                  <tr key={record.key} className="border-b border-[#f0f0f0]">
                    <td className="py-2 px-2 font-mono font-semibold">{record.key}</td>
                    <td className="py-2 px-2 text-[11px] text-[#706e6b]">********</td>
                    <td className="py-2 px-2 text-[11px] text-[#706e6b]">{record.description || '—'}</td>
                    <td className="py-2 px-2">
                      <button type="button" className="p-0.5 rounded hover:bg-black/10 mr-0.5" onClick={() => openEdit(record.key)} aria-label="Edit"><Icons.Edit /></button>
                      <button type="button" className="p-0.5 rounded hover:bg-red-100 text-red-600" onClick={() => setDeleteConfirm(record.key)} aria-label="Delete"><Icons.Delete /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalBody>
      </ModalDialog>

      {formOpen && (
        <ModalDialog onClose={() => setFormOpen(false)} width="420px">
          <ModalHeader><ModalTitle>{editingKey ? 'Edit entry' : 'Add entry'}</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              <div>
                <Text strong className="text-[11px] block mb-0.5">Key</Text>
                <TextField placeholder="e.g. API_SECRET, AUTH_TOKEN" value={form.key} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, key: e.target.value })} isDisabled={!!editingKey} className="font-mono" />
                {editingKey && <Text className="text-[9px] text-[#706e6b]">Key cannot be changed when editing.</Text>}
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Value</Text>
                <input type="password" className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1 font-mono" placeholder="Secret or token value" value={form.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Description (optional)</Text>
                <TextField placeholder="e.g. API key for service X" value={form.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" onClick={handleSave}>{editingKey ? 'Update' : 'Save'}</Button>
            <Button appearance="subtle" onClick={() => setFormOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}

      {deleteConfirm && (
        <ModalDialog onClose={() => setDeleteConfirm(null)}>
          <ModalHeader><ModalTitle>Delete this entry?</ModalTitle></ModalHeader>
          <ModalBody><p>Key: <code>{deleteConfirm}</code></p></ModalBody>
          <ModalFooter>
            <Button appearance="primary" className="!bg-red-600 hover:!bg-red-700" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            <Button appearance="subtle" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}
    </>
  );
}
