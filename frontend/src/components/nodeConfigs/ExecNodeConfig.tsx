import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';
import TextField from '@atlaskit/textfield';

export const EXEC_NODE_DOC: NodeDoc = {
  title: 'Exec Command',
  description:
    'Executes a system shell command on the server. Captures stdout, stderr, exit code, and execution duration. Supports configurable shell, working directory, and timeout.',
  usage:
    'Enter the command to run. Select the shell (auto-detected by OS if left blank). Optionally set a working directory and timeout. The stdout and stderr are available as output fields.',
  properties: [
    { name: 'command', type: 'string', desc: 'Shell command to execute', required: true },
    { name: 'shell', type: 'select', desc: 'Shell to use (/bin/sh, /bin/bash, cmd, powershell)', required: false },
    { name: 'workingDir', type: 'string', desc: 'Working directory for the command', required: false },
    { name: 'timeoutMs', type: 'number', desc: 'Timeout in milliseconds (default: 30000)', required: false },
  ],
  sampleInput: { filename: 'report.csv' },
  sampleOutput: {
    stdout: 'total 42\n-rw-r--r-- 1 user staff 1024 Feb 25 10:00 report.csv\n',
    stderr: '',
    exitCode: 0,
    command: 'ls -la report.csv',
    shell: '/bin/sh',
    durationMs: 15,
    success: true,
  },
  tips: [
    '⚠️ Security: Be careful with user-supplied input in commands to avoid injection.',
    'On macOS/Linux: defaults to /bin/sh. On Windows: defaults to cmd.',
    'Non-zero exit codes are captured (not treated as node failure) — check "exitCode" or "success".',
    'Use timeout to prevent long-running commands from blocking the workflow.',
    'The command can reference upstream data if set dynamically.',
  ],
};

export default function ExecNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Command</Text>
        <textarea className="w-full min-h-[40px] p-2 border border-[#dfe1e6] rounded text-xs resize-y" placeholder='echo "Hello World"' value={(properties.command as string) || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProp('command', e.target.value)} rows={2} />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Shell</Text>
        <select className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white" value={(properties.shell as string) ?? ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('shell', e.target.value || undefined)}>
          <option value="">Auto (sh on Unix, cmd on Windows)</option>
          <option value="/bin/sh">/bin/sh</option>
          <option value="/bin/bash">/bin/bash</option>
          <option value="/bin/zsh">/bin/zsh</option>
          <option value="cmd">cmd (Windows)</option>
          <option value="powershell">PowerShell</option>
        </select>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Working Directory</Text>
        <TextField placeholder="(optional)" value={(properties.workingDir as string) || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('workingDir', e.target.value)} />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Timeout (ms)</Text>
        <input type="number" min={1000} max={300000} className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1" value={properties.timeoutMs ?? 30000} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('timeoutMs', e.target.value === '' ? undefined : Number(e.target.value))} />
      </div>
    </>
  );
}
