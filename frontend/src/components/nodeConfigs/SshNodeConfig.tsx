import { Select, InputNumber, Typography } from 'antd';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sh';
import 'ace-builds/src-noconflict/theme-github';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

export const SSH_NODE_DOC: NodeDoc = {
  title: 'SSH',
  description:
    'Connects to a remote host via SSH and runs a command. Uses an SSH connection config (host, user, password or private key). Output includes stdout, stderr, exit code, and duration.',
  usage:
    'Create an SSH config in ⚙ Connection Configs (type: SSH) with host, username, and either password or private key. Then add this node, select the config, and enter the command to run on the remote host.',
  properties: [
    { name: 'configId', type: 'select', desc: 'SSH server configuration', required: true },
    { name: 'command', type: 'string', desc: 'Shell command to run on the remote host', required: true },
    { name: 'timeoutMs', type: 'number', desc: 'Timeout in milliseconds (default: 30000)', required: false },
  ],
  sampleInput: { filename: 'report.txt' },
  sampleOutput: {
    stdout: 'total 42\n-rw-r--r-- 1 user staff 1024 Feb 27 10:00 report.txt\n',
    stderr: '',
    exitCode: 0,
    command: 'ls -la report.txt',
    host: '192.168.1.10',
    durationMs: 120,
    success: true,
  },
  tips: [
    'Create an SSH config first in ⚙ Connection Configs (type: SSH).',
    'Use password or PEM private key for authentication.',
    'The command runs in a non-interactive shell on the remote host.',
    'stdout and stderr are captured and passed to the next node.',
    'Non-zero exit codes are captured; check "exitCode" or "success" in conditions.',
  ],
};

export default function SshNodeConfig({ properties, updateProp, configs }: NodeConfigProps) {
  const sshConfigs = configs?.filter((c) => c.type === 'ssh') ?? [];
  return (
    <>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>SSH Config</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Select SSH server..."
          value={properties.configId ?? undefined}
          onChange={(val) => updateProp('configId', val)}
          options={sshConfigs.map((c) => ({
            value: c.id,
            label: `${c.name} (${c.config?.host || 'host'}:${c.config?.port ?? 22})`,
          }))}
          notFoundContent={
            <Text type="secondary" style={{ fontSize: 10, padding: 4 }}>
              No SSH configs. Add one in ⚙ Configs.
            </Text>
          }
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Command</Text>
        <AceEditor
          mode="sh"
          theme="github"
          value={properties.command || ''}
          onChange={(code) => updateProp('command', code)}
          name="ssh-node-command"
          fontSize={10}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          setOptions={{ useWorker: false }}
          style={{ width: '100%', minHeight: 120, borderRadius: 4, border: '1px solid #d9d9d9' }}
          editorProps={{ $blockScrolling: true }}
        />
        <Text type="secondary" style={{ fontSize: 9, display: 'block', marginTop: 4 }}>
          Shell command to run on the remote host.
        </Text>
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Timeout (ms)</Text>
        <InputNumber
          size="small"
          style={{ width: '100%' }}
          min={1000}
          max={300000}
          value={properties.timeoutMs ?? 30000}
          onChange={(val) => updateProp('timeoutMs', val)}
        />
      </div>
    </>
  );
}
