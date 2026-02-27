import { Input, Select, InputNumber, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;
const { TextArea } = Input;

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
          value={properties.shell ?? ''}
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
  );
}
