import { useEffect, useState } from 'react';
import Button from '@atlaskit/button';
import ModalDialog, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import Lozenge from '@atlaskit/lozenge';
import { useWorkflowStore } from '../store/workflowStore';
import type { CronSchedule } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Text } from './ui/Text';
import { Icons } from './ui/Icons';

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

const PRESETS = [
  { value: '* * * * *', label: 'Every minute' },
  { value: '*/5 * * * *', label: 'Every 5 minutes' },
  { value: '*/15 * * * *', label: 'Every 15 minutes' },
  { value: '0 * * * *', label: 'Every hour' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
  { value: '0 0 * * *', label: 'Daily at midnight' },
  { value: '0 9 * * *', label: 'Daily at 9 AM' },
  { value: '0 0 * * 1', label: 'Weekly (Monday)' },
  { value: '0 0 1 * *', label: 'Monthly (1st)' },
];

const TIMEZONES = [
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
];

export default function ScheduleManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { schedules, workflows, fetchSchedules, fetchWorkflows, addSchedule, editSchedule, removeSchedule } =
    useWorkflowStore();
  const [form, setForm] = useState<ScheduleFormState>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      fetchSchedules();
      fetchWorkflows();
    }
  }, [open, fetchSchedules, fetchWorkflows]);

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
      toast.warning('Workflow is required');
      return;
    }
    if (!form.expression.trim()) {
      toast.warning('Cron expression is required');
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
        toast.success('Schedule updated');
      } else {
        await addSchedule(payload);
        toast.success('Schedule created');
      }
      setFormOpen(false);
    } catch {
      toast.error('Failed to save schedule');
    }
  };

  const handleToggle = async (s: CronSchedule, enabled: boolean) => {
    try {
      await editSchedule(s.id, { ...s, enabled });
      toast.success(enabled ? 'Schedule enabled' : 'Schedule paused');
    } catch {
      toast.error('Failed to update schedule');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeSchedule(id);
      toast.success('Schedule deleted');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete schedule');
    }
  };

  const workflowName = (id: number) => {
    const wf = workflows.find((w) => w.id === id);
    return wf?.name || `#${id}`;
  };

  if (!open) return null;

  return (
    <>
      <ModalDialog onClose={onClose} width="720px">
        <ModalHeader>
          <ModalTitle><span className="flex items-center gap-2"><Icons.Schedule /> Cron Schedules</span></ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="mb-2">
            <Button appearance="primary" onClick={openNew}>
              <span className="flex items-center gap-1"><Icons.Plus /> Add Schedule</span>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e8e8e8]">
                  <th className="text-left py-2 px-2 font-semibold">Workflow</th>
                  <th className="text-left py-2 px-2 font-semibold">Expression</th>
                  <th className="text-left py-2 px-2 font-semibold w-[70px]">Enabled</th>
                  <th className="text-left py-2 px-2 font-semibold">Next Run</th>
                  <th className="text-left py-2 px-2 font-semibold">Last Run</th>
                  <th className="text-left py-2 px-2 font-semibold w-[80px]" />
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-center text-[#706e6b]">No schedules yet. Add one to auto-run workflows.</td></tr>
                )}
                {schedules.map((record) => (
                  <tr key={record.id} className="border-b border-[#f0f0f0]">
                    <td className="py-2 px-2"><Text strong className="text-xs">{workflowName(record.workflowId)}</Text></td>
                    <td className="py-2 px-2"><Lozenge>{record.expression}</Lozenge></td>
                    <td className="py-2 px-2">
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={record.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleToggle(record, e.target.checked)} className="rounded" />
                      </label>
                    </td>
                    <td className="py-2 px-2 text-[10px] text-[#706e6b]">{record.nextRunAt ? new Date(record.nextRunAt).toLocaleString() : '—'}</td>
                    <td className="py-2 px-2 text-[10px] text-[#706e6b]">{record.lastRunAt ? new Date(record.lastRunAt).toLocaleString() : '—'}</td>
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
        <ModalDialog onClose={() => setFormOpen(false)} width="420px">
          <ModalHeader><ModalTitle>{editingId ? 'Edit Schedule' : 'New Schedule'}</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              <div>
                <Text strong className="text-[11px] block mb-0.5">Workflow</Text>
                <select className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.workflowId ?? ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, workflowId: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Select workflow...</option>
                  {workflows.map((wf) => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                </select>
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Preset</Text>
                <select className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value="" onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { const val = e.target.value; if (val) setForm((f) => ({ ...f, expression: val })); }}>
                  <option value="">Choose preset...</option>
                  {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Cron Expression</Text>
                <TextField value={form.expression} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, expression: e.target.value })} placeholder="*/5 * * * *" />
                <Text className="text-[9px] text-[#706e6b]">min hour dom month dow</Text>
              </div>
              <div>
                <Text strong className="text-[11px] block mb-0.5">Timezone</Text>
                <select className="w-full text-sm border border-[#dfe1e6] rounded px-2 py-1" value={form.timezone} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, timezone: e.target.value })}>
                  {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="sched-enabled" checked={form.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, enabled: e.target.checked })} className="rounded" />
                <label htmlFor="sched-enabled"><Text strong className="text-[11px]">Enabled</Text></label>
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
          <ModalHeader><ModalTitle>Delete this schedule?</ModalTitle></ModalHeader>
          <ModalFooter>
            <Button appearance="primary" className="!bg-red-600 hover:!bg-red-700" onClick={() => handleDelete(deleteConfirmId)}>Delete</Button>
            <Button appearance="subtle" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}
    </>
  );
}
