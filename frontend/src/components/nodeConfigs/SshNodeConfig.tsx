import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sh';
import 'ace-builds/src-noconflict/theme-github';
import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

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
        <Text strong className="text-[10px] block mb-0.5">SSH Config</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={properties.configId != null ? String(properties.configId) : ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('configId', e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">Select SSH server...</option>
          {sshConfigs.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({(c.config as { host?: string })?.host || 'host'}:{(c.config as { port?: number })?.port ?? 22})</option>
          ))}
        </select>
        {sshConfigs.length === 0 && <Text className="text-[10px] text-[#706e6b] block mt-0.5">No SSH configs. Add one in ⚙ Configs.</Text>}
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Command</Text>
        <AceEditor
          mode="sh"
          theme="github"
          value={(properties.command as string) || ''}
          onChange={(code: string) => updateProp('command', code)}
          name="ssh-node-command"
          fontSize={10}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          setOptions={{ useWorker: false }}
          style={{ width: '100%', minHeight: 120, borderRadius: 4, border: '1px solid #d9d9d9' }}
          editorProps={{ $blockScrolling: true }}
        />
        <Text className="text-[9px] text-[#706e6b] block mt-1">Shell command to run on the remote host.</Text>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Timeout (ms)</Text>
        <input type="number" min={1000} max={300000} className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1" value={properties.timeoutMs ?? 30000} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('timeoutMs', e.target.value === '' ? undefined : Number(e.target.value))} />
      </div>
    </>
  );
}
