import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';
import TextField from '@atlaskit/textfield';

export const EMAIL_NODE_DOC: NodeDoc = {
  title: 'Send Email',
  description:
    'Sends an email via SMTP using a configured email server. Supports To, CC, BCC, subject, plain text or HTML body.',
  usage:
    'Select an email config (create one in ⚙ Connection Configs with SMTP details). Set the recipient, subject, and body. Multiple recipients can be comma-separated.',
  properties: [
    { name: 'configId', type: 'select', desc: 'Email (SMTP) server configuration', required: true },
    { name: 'to', type: 'string', desc: 'Recipient email(s), comma-separated', required: true },
    { name: 'cc', type: 'string', desc: 'CC recipients, comma-separated', required: false },
    { name: 'bcc', type: 'string', desc: 'BCC recipients, comma-separated', required: false },
    { name: 'subject', type: 'string', desc: 'Email subject line', required: true },
    { name: 'body', type: 'string', desc: 'Email body content', required: true },
    { name: 'contentType', type: 'select', desc: 'text/plain or text/html', required: false },
  ],
  sampleInput: { userName: 'John', userEmail: 'john@example.com' },
  sampleOutput: {
    sent: true,
    to: 'john@example.com',
    cc: '',
    bcc: '',
    subject: 'Welcome John!',
    from: 'noreply@myapp.com',
    smtpHost: 'smtp.gmail.com',
    sentAt: '2026-02-24T10:00:03Z',
    recipients: 1,
  },
  tips: [
    'Create an email config first in ⚙ Connection Configs (type: Email).',
    'For Gmail, use an App Password (not your regular password).',
    'Port 587 = STARTTLS (recommended), Port 465 = SSL/TLS.',
    'Use text/html content type for rich formatted emails.',
    'To, subject, and body can be populated from upstream node data.',
  ],
};

export default function EmailNodeConfig({ properties, updateProp, configs }: NodeConfigProps) {
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
        <Text strong className="text-[10px] block mb-0.5">To</Text>
        <TextField placeholder="user@example.com, user2@example.com" value={(properties.to as string) || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('to', e.target.value)} />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">CC</Text>
        <TextField placeholder="(optional)" value={(properties.cc as string) || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('cc', e.target.value)} />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">BCC</Text>
        <TextField placeholder="(optional)" value={(properties.bcc as string) || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('bcc', e.target.value)} />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Subject</Text>
        <TextField placeholder="Email subject" value={(properties.subject as string) || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('subject', e.target.value)} />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Body</Text>
        <textarea className="w-full min-h-[80px] p-2 border border-[#dfe1e6] rounded text-[10px] resize-y" placeholder="Email body content..." value={(properties.body as string) || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProp('body', e.target.value)} rows={4} />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Content Type</Text>
        <select className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white" value={(properties.contentType as string) || 'text/plain'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('contentType', e.target.value)}>
          <option value="text/plain">Plain Text</option>
          <option value="text/html">HTML</option>
        </select>
      </div>
    </>
  );
}
