import { useEffect } from 'react';
import { Input, Select, InputNumber, Typography, Divider, Space, Tag, Tabs, Button } from 'antd';
import { useWorkflowStore } from '../store/workflowStore';
import NODE_DOCS from '../data/nodeDocs';
import { PRIMARY } from '../theme';

const { Text } = Typography;
const { TextArea } = Input;

const REDIS_OPERATIONS = [
  { label: '── String ──', options: [
    { value: 'GET', label: 'GET — Get value' },
    { value: 'SET', label: 'SET — Set value' },
    { value: 'INCR', label: 'INCR — Increment' },
    { value: 'DECR', label: 'DECR — Decrement' },
  ]},
  { label: '── Hash ──', options: [
    { value: 'HGET', label: 'HGET — Get hash field' },
    { value: 'HSET', label: 'HSET — Set hash field' },
    { value: 'HGETALL', label: 'HGETALL — Get all fields' },
    { value: 'HDEL', label: 'HDEL — Delete hash field' },
  ]},
  { label: '── List ──', options: [
    { value: 'LPUSH', label: 'LPUSH — Push left' },
    { value: 'RPUSH', label: 'RPUSH — Push right' },
    { value: 'LPOP', label: 'LPOP — Pop left' },
    { value: 'RPOP', label: 'RPOP — Pop right' },
    { value: 'LRANGE', label: 'LRANGE — Get range' },
  ]},
  { label: '── Set ──', options: [
    { value: 'SADD', label: 'SADD — Add to set' },
    { value: 'SMEMBERS', label: 'SMEMBERS — Get members' },
  ]},
  { label: '── Key ──', options: [
    { value: 'DEL', label: 'DEL — Delete key' },
    { value: 'KEYS', label: 'KEYS — Find keys' },
    { value: 'EXISTS', label: 'EXISTS — Check exists' },
    { value: 'EXPIRE', label: 'EXPIRE — Set expiry' },
    { value: 'TTL', label: 'TTL — Get TTL' },
  ]},
  { label: '── Pub/Sub ──', options: [
    { value: 'PUBLISH', label: 'PUBLISH — Publish message' },
  ]},
];

export default function NodeConfigPanel() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const configs = useWorkflowStore((s) => s.configs);
  const fetchConfigs = useWorkflowStore((s) => s.fetchConfigs);
  const workflows = useWorkflowStore((s) => s.workflows);
  const currentWorkflow = useWorkflowStore((s) => s.currentWorkflow);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  useEffect(() => {
    fetchConfigs();
  }, []);

  if (!selectedNode) {
    return (
      <div style={{ padding: 8 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>Select a node to edit its properties</Text>
      </div>
    );
  }

  const data = selectedNode.data as any;
  const properties = data.properties || {};
  const nodeType = selectedNode.type || '';

  const updateProp = (key: string, value: any) => {
    updateNodeData(selectedNode.id, {
      properties: { ...properties, [key]: value },
    });
  };

  const updateLabel = (label: string) => {
    updateNodeData(selectedNode.id, { label });
  };

  return (
    <div style={{ fontSize: 10 }}>
      <Tabs
        defaultActiveKey="props"
        size="small"
        style={{ padding: '0 8px' }}
        items={[
          {
            key: 'props',
            label: 'Properties',
            children: (
              <div style={{ paddingBottom: 8 }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <div>
          <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Label</Text>
          <Input
            size="small"
            value={data.label || ''}
            onChange={(e) => updateLabel(e.target.value)}
          />
        </div>

        <div>
          <Tag color="blue" style={{ fontSize: 9 }}>{nodeType}</Tag>
          <Text type="secondary" style={{ fontSize: 9 }}>{selectedNode.id}</Text>
        </div>

        <Divider style={{ margin: '2px 0' }} />

        {nodeType === 'http_request' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Method</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                value={properties.method || 'GET'}
                onChange={(val) => updateProp('method', val)}
                options={[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' },
                  { value: 'PATCH', label: 'PATCH' },
                ]}
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>URL</Text>
              <Input
                size="small"
                placeholder="https://api.example.com/data"
                value={properties.url || ''}
                onChange={(e) => updateProp('url', e.target.value)}
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Body (JSON)</Text>
              <TextArea
                size="small"
                rows={3}
                style={{ fontFamily: 'monospace', fontSize: 10 }}
                placeholder='{"key": "value"}'
                value={properties.body || ''}
                onChange={(e) => updateProp('body', e.target.value)}
              />
            </div>
          </>
        )}

        {nodeType === 'delay' && (
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Duration (ms)</Text>
            <InputNumber
              size="small"
              style={{ width: '100%' }}
              min={0}
              value={properties.durationMs || 1000}
              onChange={(val) => updateProp('durationMs', val)}
            />
          </div>
        )}

        {nodeType === 'condition' && (
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Expression</Text>
            <TextArea
              size="small"
              rows={2}
              style={{ fontFamily: 'monospace', fontSize: 10 }}
              placeholder="statusCode == 200"
              value={properties.expression || ''}
              onChange={(e) => updateProp('expression', e.target.value)}
            />
            <Text type="secondary" style={{ fontSize: 10 }}>
              Uses expr-lang syntax. Vars come from upstream output.
            </Text>
          </div>
        )}

        {nodeType === 'log' && (
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Message</Text>
            <TextArea
              size="small"
              rows={2}
              placeholder="Log message..."
              value={properties.message || ''}
              onChange={(e) => updateProp('message', e.target.value)}
            />
          </div>
        )}

        {nodeType === 'transform' && (
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Expression</Text>
            <TextArea
              size="small"
              rows={3}
              style={{ fontFamily: 'monospace', fontSize: 10 }}
              placeholder='body + " transformed"'
              value={properties.expression || ''}
              onChange={(e) => updateProp('expression', e.target.value)}
            />
            <Text type="secondary" style={{ fontSize: 10 }}>
              Uses expr-lang. Available vars from upstream output.
            </Text>
          </div>
        )}

        {nodeType === 'function' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>JavaScript Code</Text>
              <TextArea
                size="small"
                rows={8}
                style={{ fontFamily: 'monospace', fontSize: 10 }}
                placeholder={'// Input from upstream is in the "input" object.\n// Set returnValue to pass data downstream.\nreturnValue = { ...input, computed: input.value * 2 };'}
                value={properties.code || ''}
                onChange={(e) => updateProp('code', e.target.value)}
              />
              <Text type="secondary" style={{ fontSize: 10 }}>
                Use <code>input</code> for upstream data. Set <code>returnValue</code> for the result.
              </Text>
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Timeout (ms)</Text>
              <InputNumber
                size="small"
                style={{ width: '100%' }}
                min={1000}
                max={60000}
                value={properties.timeoutMs || 10000}
                onChange={(val) => updateProp('timeoutMs', val)}
              />
            </div>
          </>
        )}

        {nodeType === 'redis' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Server Config</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                placeholder="Select Redis server..."
                value={properties.configId || undefined}
                onChange={(val) => updateProp('configId', val)}
                options={configs
                  .filter((c) => c.type === 'redis')
                  .map((c) => ({
                    value: c.id,
                    label: `${c.name} (${c.config?.host || '127.0.0.1'}:${c.config?.port || 6379})`,
                  }))}
                notFoundContent={
                  <Text type="secondary" style={{ fontSize: 10, padding: 4 }}>
                    No Redis configs. Add one in ⚙ Configs.
                  </Text>
                }
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Operation</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                placeholder="Select operation..."
                value={properties.operation || undefined}
                onChange={(val) => updateProp('operation', val)}
                options={REDIS_OPERATIONS}
              />
            </div>

            {/* Key — shown for most operations */}
            {properties.operation && properties.operation !== 'KEYS' && (
              <div>
                <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>
                  {properties.operation === 'PUBLISH' ? 'Channel' : 'Key'}
                </Text>
                <Input
                  size="small"
                  placeholder={properties.operation === 'PUBLISH' ? 'channel-name' : 'my-key'}
                  value={properties.key || ''}
                  onChange={(e) => updateProp('key', e.target.value)}
                />
              </div>
            )}

            {/* Pattern for KEYS */}
            {properties.operation === 'KEYS' && (
              <div>
                <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Pattern</Text>
                <Input
                  size="small"
                  placeholder="user:*"
                  value={properties.key || ''}
                  onChange={(e) => updateProp('key', e.target.value)}
                />
              </div>
            )}

            {/* Field — for hash operations */}
            {['HGET', 'HSET', 'HDEL'].includes(properties.operation) && (
              <div>
                <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Field</Text>
                <Input
                  size="small"
                  placeholder="field-name"
                  value={properties.field || ''}
                  onChange={(e) => updateProp('field', e.target.value)}
                />
              </div>
            )}

            {/* Value — for SET, HSET, LPUSH, RPUSH, SADD, PUBLISH */}
            {['SET', 'HSET', 'LPUSH', 'RPUSH', 'SADD', 'PUBLISH'].includes(properties.operation) && (
              <div>
                <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Value</Text>
                <TextArea
                  size="small"
                  rows={2}
                  placeholder="value"
                  value={properties.value || ''}
                  onChange={(e) => updateProp('value', e.target.value)}
                />
              </div>
            )}

            {/* TTL — for SET and EXPIRE */}
            {['SET', 'EXPIRE'].includes(properties.operation) && (
              <div>
                <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>TTL (ms)</Text>
                <InputNumber
                  size="small"
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="0 = no expiry"
                  value={properties.ttl || undefined}
                  onChange={(val) => updateProp('ttl', val)}
                />
              </div>
            )}

            {/* Start/Stop for LRANGE */}
            {properties.operation === 'LRANGE' && (
              <>
                <div>
                  <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Start Index</Text>
                  <InputNumber
                    size="small"
                    style={{ width: '100%' }}
                    value={properties.start ?? 0}
                    onChange={(val) => updateProp('start', val)}
                  />
                </div>
                <div>
                  <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Stop Index</Text>
                  <InputNumber
                    size="small"
                    style={{ width: '100%' }}
                    value={properties.stop ?? -1}
                    onChange={(val) => updateProp('stop', val)}
                  />
                  <Text type="secondary" style={{ fontSize: 10 }}>-1 = all elements</Text>
                </div>
              </>
            )}
          </>
        )}

        {nodeType === 'cron' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Preset</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                placeholder="Choose a preset..."
                value={undefined}
                onChange={(val) => updateProp('expression', val)}
                options={[
                  { value: '* * * * *', label: 'Every minute' },
                  { value: '*/5 * * * *', label: 'Every 5 minutes' },
                  { value: '*/15 * * * *', label: 'Every 15 minutes' },
                  { value: '*/30 * * * *', label: 'Every 30 minutes' },
                  { value: '0 * * * *', label: 'Every hour' },
                  { value: '0 */6 * * *', label: 'Every 6 hours' },
                  { value: '0 */12 * * *', label: 'Every 12 hours' },
                  { value: '0 0 * * *', label: 'Daily at midnight' },
                  { value: '0 9 * * *', label: 'Daily at 9 AM' },
                  { value: '0 0 * * 1', label: 'Weekly (Monday midnight)' },
                  { value: '0 0 1 * *', label: 'Monthly (1st midnight)' },
                ]}
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Cron Expression</Text>
              <Input
                size="small"
                style={{ fontFamily: 'monospace' }}
                placeholder="* * * * *"
                value={properties.expression || ''}
                onChange={(e) => updateProp('expression', e.target.value)}
              />
              <Text type="secondary" style={{ fontSize: 9, display: 'block', marginTop: 2 }}>
                min hour dom month dow
              </Text>
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Timezone</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                showSearch
                value={properties.timezone || 'UTC'}
                onChange={(val) => updateProp('timezone', val)}
                options={[
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/New_York', label: 'US Eastern' },
                  { value: 'America/Chicago', label: 'US Central' },
                  { value: 'America/Denver', label: 'US Mountain' },
                  { value: 'America/Los_Angeles', label: 'US Pacific' },
                  { value: 'Europe/London', label: 'London' },
                  { value: 'Europe/Paris', label: 'Paris' },
                  { value: 'Europe/Berlin', label: 'Berlin' },
                  { value: 'Asia/Kolkata', label: 'India (IST)' },
                  { value: 'Asia/Tokyo', label: 'Tokyo' },
                  { value: 'Asia/Shanghai', label: 'Shanghai' },
                  { value: 'Asia/Singapore', label: 'Singapore' },
                  { value: 'Australia/Sydney', label: 'Sydney' },
                ]}
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Payload (optional)</Text>
              <TextArea
                size="small"
                rows={2}
                style={{ fontFamily: 'monospace', fontSize: 10 }}
                placeholder='{"key": "value"}'
                value={properties.payload || ''}
                onChange={(e) => updateProp('payload', e.target.value)}
              />
              <Text type="secondary" style={{ fontSize: 10 }}>
                JSON payload passed to downstream nodes.
              </Text>
            </div>
          </>
        )}

        {nodeType === 'redis_subscribe' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Server Config</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                placeholder="Select Redis server..."
                value={properties.configId || undefined}
                onChange={(val) => updateProp('configId', val)}
                options={configs
                  .filter((c) => c.type === 'redis')
                  .map((c) => ({
                    value: c.id,
                    label: `${c.name} (${c.config?.host || '127.0.0.1'}:${c.config?.port || 6379})`,
                  }))}
                notFoundContent={
                  <Text type="secondary" style={{ fontSize: 10, padding: 4 }}>
                    No Redis configs. Add one in ⚙ Configs.
                  </Text>
                }
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Channel / Pattern</Text>
              <Input
                size="small"
                placeholder="my-channel or my-*"
                value={properties.channel || ''}
                onChange={(e) => updateProp('channel', e.target.value)}
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Mode</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                value={properties.isPattern ? 'pattern' : 'channel'}
                onChange={(val) => updateProp('isPattern', val === 'pattern')}
                options={[
                  { value: 'channel', label: 'SUBSCRIBE — exact channel' },
                  { value: 'pattern', label: 'PSUBSCRIBE — glob pattern' },
                ]}
              />
              <Text type="secondary" style={{ fontSize: 9 }}>
                Pattern mode supports * and ? wildcards.
              </Text>
            </div>
          </>
        )}

        {nodeType === 'email' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Email Config</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                placeholder="Select email server..."
                value={properties.configId || undefined}
                onChange={(val) => updateProp('configId', val)}
                options={configs
                  .filter((c) => c.type === 'email')
                  .map((c) => ({
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
        )}

        {nodeType === 'email_receive' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Email Config</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                placeholder="Select email server..."
                value={properties.configId || undefined}
                onChange={(val) => updateProp('configId', val)}
                options={configs
                  .filter((c) => c.type === 'email')
                  .map((c) => ({
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
        )}

        {nodeType === 'read_file' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>File Path</Text>
              <Input
                size="small"
                placeholder="/path/to/file.txt"
                value={properties.path || ''}
                onChange={(e) => updateProp('path', e.target.value)}
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Encoding</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                value={properties.encoding || 'utf-8'}
                onChange={(val) => updateProp('encoding', val)}
                options={[
                  { value: 'utf-8', label: 'UTF-8' },
                  { value: 'ascii', label: 'ASCII' },
                  { value: 'binary', label: 'Binary' },
                ]}
              />
            </div>
          </>
        )}

        {nodeType === 'write_file' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>File Path</Text>
              <Input
                size="small"
                placeholder="/path/to/output.txt"
                value={properties.path || ''}
                onChange={(e) => updateProp('path', e.target.value)}
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Content</Text>
              <TextArea
                size="small"
                rows={3}
                placeholder="Content to write..."
                value={properties.content || ''}
                onChange={(e) => updateProp('content', e.target.value)}
              />
              <Text type="secondary" style={{ fontSize: 9 }}>
                Leave empty to use upstream "content" field.
              </Text>
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Mode</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                value={properties.mode || 'overwrite'}
                onChange={(val) => updateProp('mode', val)}
                options={[
                  { value: 'overwrite', label: 'Overwrite' },
                  { value: 'append', label: 'Append' },
                ]}
              />
            </div>
          </>
        )}

        {nodeType === 'exec' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Command</Text>
              <TextArea
                size="small"
                rows={2}
                placeholder='echo "Hello World"'
                value={properties.command || ''}
                onChange={(e) => updateProp('command', e.target.value)}
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Shell</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                value={properties.shell || ''}
                onChange={(val) => updateProp('shell', val)}
                options={[
                  { value: '', label: 'Auto (sh on Unix, cmd on Windows)' },
                  { value: '/bin/sh', label: '/bin/sh' },
                  { value: '/bin/bash', label: '/bin/bash' },
                  { value: '/bin/zsh', label: '/bin/zsh' },
                  { value: 'cmd', label: 'cmd (Windows)' },
                  { value: 'powershell', label: 'PowerShell' },
                ]}
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Working Directory</Text>
              <Input
                size="small"
                placeholder="(optional)"
                value={properties.workingDir || ''}
                onChange={(e) => updateProp('workingDir', e.target.value)}
              />
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Timeout (ms)</Text>
              <InputNumber
                size="small"
                style={{ width: '100%' }}
                min={1000}
                max={300000}
                value={properties.timeoutMs || 30000}
                onChange={(val) => updateProp('timeoutMs', val)}
              />
            </div>
          </>
        )}

        {nodeType === 'switch' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Expression</Text>
              <Input
                size="small"
                placeholder="statusCode or json.type"
                value={properties.expression || ''}
                onChange={(e) => updateProp('expression', e.target.value)}
              />
              <Text type="secondary" style={{ fontSize: 9 }}>
                Evaluated against input. Result is matched to cases.
              </Text>
            </div>
            <Divider style={{ margin: '4px 0', fontSize: 9 }}>Cases</Divider>
            {(properties.cases || []).map((c: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Input
                  size="small"
                  placeholder="Label"
                  style={{ width: '45%' }}
                  value={c.label || ''}
                  onChange={(e) => {
                    const cases = [...(properties.cases || [])];
                    cases[i] = { ...cases[i], label: e.target.value };
                    updateProp('cases', cases);
                  }}
                />
                <Input
                  size="small"
                  placeholder="Value"
                  style={{ width: '45%' }}
                  value={c.value || ''}
                  onChange={(e) => {
                    const cases = [...(properties.cases || [])];
                    cases[i] = { ...cases[i], value: e.target.value };
                    updateProp('cases', cases);
                  }}
                />
                <span
                  style={{ cursor: 'pointer', color: '#e8647c', fontSize: 12, fontWeight: 700 }}
                  onClick={() => {
                    const cases = [...(properties.cases || [])];
                    cases.splice(i, 1);
                    updateProp('cases', cases);
                  }}
                >✕</span>
              </div>
            ))}
            <Button
              size="small"
              type="dashed"
              style={{ width: '100%', fontSize: 10 }}
              onClick={() => {
                const cases = [...(properties.cases || []), { label: '', value: '' }];
                updateProp('cases', cases);
              }}
            >+ Add Case</Button>
            <Text type="secondary" style={{ fontSize: 9 }}>
              Non-matching values route to the "Default" handle.
            </Text>
          </>
        )}

        {nodeType === 'flow' && (
          <>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Target Workflow</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                placeholder="Select a workflow to run"
                value={properties.workflow_id || undefined}
                onChange={(val) => {
                  const wf = workflows.find((w) => w.id === val);
                  updateProp('workflow_id', val);
                  if (wf) updateProp('workflow_name', wf.name);
                }}
                options={workflows
                  .filter((wf) => !currentWorkflow || wf.id !== currentWorkflow.id)
                  .map((wf) => ({ value: wf.id, label: `#${wf.id} — ${wf.name}` }))}
                showSearch
                optionFilterProp="label"
                allowClear
                onClear={() => {
                  updateProp('workflow_id', undefined);
                  updateProp('workflow_name', undefined);
                }}
              />
              <Text type="secondary" style={{ fontSize: 9 }}>
                The selected workflow will be executed as a sub-flow. Current workflow is excluded.
              </Text>
            </div>
            <div>
              <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Pass Input to Sub-Flow</Text>
              <Select
                size="small"
                style={{ width: '100%' }}
                value={properties.pass_input ? 'yes' : 'no'}
                onChange={(val) => updateProp('pass_input', val === 'yes')}
                options={[
                  { value: 'yes', label: 'Yes — forward all input data' },
                  { value: 'no', label: 'No — start sub-flow with empty input' },
                ]}
              />
              <Text type="secondary" style={{ fontSize: 9 }}>
                When enabled, all data from upstream nodes is passed as input to the sub-flow's start node.
              </Text>
            </div>
          </>
        )}
      </Space>
              </div>
            ),
          },
          {
            key: 'docs',
            label: 'Documentation',
            children: <NodeDocumentation nodeType={nodeType} />,
          },
        ]}
      />
    </div>
  );
}

/* ── Documentation Tab Component ── */

function NodeDocumentation({ nodeType }: { nodeType: string }) {
  const doc = NODE_DOCS[nodeType];

  if (!doc) {
    return (
      <div style={{ padding: '12px 4px', color: '#706e6b', fontSize: 11 }}>
        No documentation available for this node type.
      </div>
    );
  }

  const codeBlockStyle: React.CSSProperties = {
    background: '#f5f5f5',
    border: '1px solid #e8e8e8',
    borderRadius: 4,
    padding: '6px 8px',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: 10,
    lineHeight: '15px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    overflowX: 'auto',
    color: '#1e1e1e',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#16325c',
    marginBottom: 3,
    display: 'block',
  };

  return (
    <div style={{ paddingBottom: 12 }}>
      {/* Title & Description */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#16325c', marginBottom: 4 }}>{doc.title}</div>
        <div style={{ fontSize: 11, color: '#444', lineHeight: '16px' }}>{doc.description}</div>
      </div>

      {/* How to Use */}
      <div style={{ marginBottom: 10 }}>
        <span style={sectionTitle}>📖 How to Use</span>
        <div style={{ fontSize: 10, color: '#555', lineHeight: '15px' }}>{doc.usage}</div>
      </div>

      {/* Properties Table */}
      <div style={{ marginBottom: 10 }}>
        <span style={sectionTitle}>⚙ Properties</span>
        <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e8e8e8', textAlign: 'left' }}>
              <th style={{ padding: '3px 4px', color: '#706e6b', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '3px 4px', color: '#706e6b', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '3px 4px', color: '#706e6b', fontWeight: 600 }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {doc.properties.map((p) => (
              <tr key={p.name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '3px 4px', fontFamily: 'monospace', color: PRIMARY }}>
                  {p.name}{p.required && <span style={{ color: '#e8647c' }}>*</span>}
                </td>
                <td style={{ padding: '3px 4px', color: '#706e6b' }}>{p.type}</td>
                <td style={{ padding: '3px 4px', color: '#444' }}>{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sample Input */}
      <div style={{ marginBottom: 10 }}>
        <span style={sectionTitle}>📥 Sample Input</span>
        <div style={codeBlockStyle}>{JSON.stringify(doc.sampleInput, null, 2)}</div>
      </div>

      {/* Sample Output */}
      <div style={{ marginBottom: 10 }}>
        <span style={sectionTitle}>📤 Sample Output</span>
        <div style={codeBlockStyle}>{JSON.stringify(doc.sampleOutput, null, 2)}</div>
      </div>

      {/* Tips */}
      {doc.tips && doc.tips.length > 0 && (
        <div>
          <span style={sectionTitle}>💡 Tips</span>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: '#555', lineHeight: '16px' }}>
            {doc.tips.map((tip, i) => (
              <li key={i} style={{ marginBottom: 2 }}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
