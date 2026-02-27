import { Input, Select, InputNumber, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

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
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Email Config</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Select email server..."
          value={properties.configId || undefined}
          onChange={(val) => updateProp('configId', val)}
          options={emailConfigs.map((c) => ({
            value: c.id,
            label: `${c.name} (${c.config?.host || 'smtp'})`,
          }))}
          notFoundContent={
            <Text type="secondary" style={{ fontSize: 10, padding: 4 }}>
              No email configs. Add one in ⚙ Configs.
            </Text>
          }
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Mailbox</Text>
        <Input
          size="small"
          placeholder="INBOX"
          value={properties.mailbox || ''}
          onChange={(e) => updateProp('mailbox', e.target.value)}
        />
        <Text type="secondary" style={{ fontSize: 9 }}>
          IMAP folder to poll (default: INBOX)
        </Text>
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Poll Interval (sec)</Text>
        <InputNumber
          size="small"
          style={{ width: '100%' }}
          min={10}
          max={3600}
          value={properties.pollIntervalSec || 60}
          onChange={(val) => updateProp('pollIntervalSec', val)}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Mark as Read</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          value={properties.markSeen !== false ? 'yes' : 'no'}
          onChange={(val) => updateProp('markSeen', val === 'yes')}
          options={[
            { value: 'yes', label: 'Yes — mark fetched emails as read' },
            { value: 'no', label: 'No — leave emails as unread' },
          ]}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Max Fetch per Poll</Text>
        <InputNumber
          size="small"
          style={{ width: '100%' }}
          min={1}
          max={100}
          value={properties.maxFetch || 10}
          onChange={(val) => updateProp('maxFetch', val)}
        />
      </div>
    </>
  );
}
