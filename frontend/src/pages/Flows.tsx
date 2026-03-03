import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Tooltip from '@atlaskit/tooltip';
import Spinner from '@atlaskit/spinner';
import { useWorkflowStore } from '../store/workflowStore';
import PageLayout from '../components/PageLayout';
import { Text } from '../components/ui/Text';
import { Icons } from '../components/ui/Icons';
import type { Workflow } from '../api/client';

function formatDuration(sec: number): string {
  if (sec < 1) return `${(sec * 1000).toFixed(0)}ms`;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

export default function Flows() {
  const { workflows, fetchWorkflows, loadWorkflow } = useWorkflowStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const openInBuilder = (id: number) => {
    loadWorkflow(id).then(() => navigate('/wf-new'));
  };

  useEffect(() => {
    setLoading(true);
    fetchWorkflows().finally(() => setLoading(false));
  }, [fetchWorkflows]);

  return (
    <PageLayout title="Flows">
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="large" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e8e8e8]">
                <th className="text-left py-2 px-2 font-semibold text-[#16325c]" style={{ width: 260 }}>Name</th>
                <th className="text-left py-2 px-2 font-semibold text-[#16325c]">Description</th>
                <th className="text-left py-2 px-2 font-semibold text-[#16325c]" style={{ width: 180 }}>Updated</th>
                <th className="text-left py-2 px-2 font-semibold text-[#16325c]" style={{ width: 180 }}>Last run</th>
                <th className="text-left py-2 px-2 font-semibold text-[#16325c]" style={{ width: 180 }}>Avg run time</th>
                <th className="text-left py-2 px-2 font-semibold text-[#16325c]" style={{ width: 56 }} />
              </tr>
            </thead>
            <tbody>
              {workflows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#706e6b]">No flows yet. Create one in Builder.</td>
                </tr>
              )}
              {workflows.map((record: Workflow) => (
                <tr key={record.id} className="border-b border-[#f0f0f0] hover:bg-black/[0.02]">
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <Text strong className="text-xs">{record.name}</Text>
                      <Tooltip content="Open in Builder">
                        <button type="button" className="p-0.5 rounded hover:bg-black/10" onClick={() => openInBuilder(record.id)}>
                          <Icons.Edit />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="py-2 px-2 max-w-[200px] truncate">
                    {record.description ? <Text className="text-[11px] text-[#706e6b]">{record.description}</Text> : '—'}
                  </td>
                  <td className="py-2 px-2 text-[11px]">{record.updatedAt ? new Date(record.updatedAt).toLocaleString() : '—'}</td>
                  <td className="py-2 px-2 text-[11px]">{record.lastRunAt ? new Date(record.lastRunAt).toLocaleString() : '—'}</td>
                  <td className="py-2 px-2 text-[11px]">{record.avgRunTimeSec != null ? formatDuration(record.avgRunTimeSec) : '—'}</td>
                  <td className="py-2 px-2">
                    <Tooltip content="View executions">
                      <button type="button" className="p-0.5 rounded hover:bg-black/10" onClick={() => navigate(`/flows/${record.id}/executions`)}>
                        <Icons.History />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}
