import { Input, Select, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;
const { TextArea } = Input;

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
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>To</Text>
        <Input
          size="small"
          placeholder="user@example.com, user2@example.com"
          value={properties.to || ''}
          onChange={(e) => updateProp('to', e.target.value)}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>CC</Text>
        <Input
          size="small"
          placeholder="(optional)"
          value={properties.cc || ''}
          onChange={(e) => updateProp('cc', e.target.value)}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>BCC</Text>
        <Input
          size="small"
          placeholder="(optional)"
          value={properties.bcc || ''}
          onChange={(e) => updateProp('bcc', e.target.value)}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Subject</Text>
        <Input
          size="small"
          placeholder="Email subject"
          value={properties.subject || ''}
          onChange={(e) => updateProp('subject', e.target.value)}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Body</Text>
        <TextArea
          size="small"
          rows={4}
          style={{ fontSize: 10 }}
          placeholder="Email body content..."
          value={properties.body || ''}
          onChange={(e) => updateProp('body', e.target.value)}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Content Type</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          value={properties.contentType || 'text/plain'}
          onChange={(val) => updateProp('contentType', val)}
          options={[
            { value: 'text/plain', label: 'Plain Text' },
            { value: 'text/html', label: 'HTML' },
          ]}
        />
      </div>
    </>
  );
}
