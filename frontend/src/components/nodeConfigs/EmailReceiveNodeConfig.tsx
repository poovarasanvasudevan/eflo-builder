import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';
import TextField from '@atlaskit/textfield';

export const EMAIL_RECEIVE_NODE_DOC: NodeDoc = {
  title: 'Receive Email Trigger',
  description:
    'A trigger node that polls an IMAP mailbox for unread emails and triggers a workflow execution for each new message. Uses the same email configuration as Send Email (with auto-derived IMAP host).',
  usage:
    'Select an email config (the IMAP host is derived from the SMTP host, e.g. smtp.gmail.com → imap.gmail.com, or set imapHost/imapPort in the config). Set the mailbox folder, poll interval, and whether to mark emails as read. Then create an Email Trigger via the 📨 toolbar button to activate.',
  properties: [
    { name: 'configId', type: 'select', desc: 'Email server configuration (must have IMAP access)', required: true },
    { name: 'mailbox', type: 'string', desc: 'IMAP folder to poll (default: INBOX)', required: false },
    { name: 'pollIntervalSec', type: 'number', desc: 'Seconds between each poll (min: 10, default: 60)', required: false },
    { name: 'markSeen', type: 'boolean', desc: 'Mark fetched emails as read (default: true)', required: false },
    { name: 'maxFetch', type: 'number', desc: 'Max emails to fetch per poll (default: 10)', required: false },
  ],
  sampleInput: {},
  sampleOutput: {
    triggered: true,
    triggeredAt: '2026-02-25T10:00:00Z',
    from: 'sender@example.com',
    to: 'you@gmail.com',
    subject: 'Order Confirmation #12345',
    date: 'Tue, 25 Feb 2026 09:59:45 +0000',
    messageId: '<abc123@mail.example.com>',
    seqNum: 42,
    fetchedAt: '2026-02-25T10:00:01Z',
    triggerId: 1,
    receivedAt: '2026-02-25T10:00:01Z',
  },
  tips: [
    'Uses the same email config as Send Email — IMAP host is auto-derived (smtp.gmail.com → imap.gmail.com).',
    'For custom IMAP hosts, add "imapHost" and "imapPort" to the config JSON.',
    'Only UNSEEN emails are fetched. Enable "Mark as Read" to avoid processing the same email twice.',
    'Each email triggers a separate workflow execution with from, to, subject, date, etc. as input.',
    'For Gmail: enable IMAP in Settings → Forwarding and POP/IMAP, and use an App Password.',
    'Create an Email Trigger via the 📨 toolbar button to activate polling.',
    'Minimum poll interval is 10 seconds. Use 60+ seconds for production.',
  ],
};

export default function EmailReceiveNodeConfig({ properties, updateProp, configs }: NodeConfigProps) {
  const emailConfigs = configs?.filter((c) => c.type === 'email') ?? [];
  return (
    <>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Email Config</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={properties.configId != null ? String(properties.configId) : ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('configId', e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">Select email server...</option>
          {emailConfigs.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({(c.config as { host?: string })?.host || 'smtp'})</option>
          ))}
        </select>
        {emailConfigs.length === 0 && <Text className="text-[10px] text-[#706e6b] block mt-0.5">No email configs. Add one in ⚙ Configs.</Text>}
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Mailbox</Text>
        <TextField placeholder="INBOX" value={(properties.mailbox as string) || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('mailbox', e.target.value)} />
        <Text className="text-[9px] text-[#706e6b]">IMAP folder to poll (default: INBOX)</Text>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Poll Interval (sec)</Text>
        <input type="number" min={10} max={3600} className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1" value={properties.pollIntervalSec ?? 60} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('pollIntervalSec', e.target.value === '' ? undefined : Number(e.target.value))} />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Mark as Read</Text>
        <select className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white" value={properties.markSeen !== false ? 'yes' : 'no'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('markSeen', e.target.value === 'yes')}>
          <option value="yes">Yes — mark fetched emails as read</option>
          <option value="no">No — leave emails as unread</option>
        </select>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Max Fetch per Poll</Text>
        <input type="number" min={1} max={100} className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1" value={properties.maxFetch ?? 10} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('maxFetch', e.target.value === '' ? undefined : Number(e.target.value))} />
      </div>
    </>
  );
}
