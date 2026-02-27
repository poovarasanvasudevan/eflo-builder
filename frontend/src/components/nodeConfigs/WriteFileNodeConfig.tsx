import { Input, Select, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;
const { TextArea } = Input;

export const WRITE_FILE_NODE_DOC: NodeDoc = {
  title: 'Write File',
  description:
    'Writes text content to a file on the server filesystem. Supports overwrite and append modes. Automatically creates parent directories if they do not exist.',
  usage:
    "Set the file path and content to write. Choose \"overwrite\" to replace or \"append\" to add to existing content. The content can also come from an upstream node's output.",
  properties: [
    { name: 'path', type: 'string', desc: 'Absolute or relative file path to write', required: true },
    { name: 'content', type: 'string', desc: 'Text content to write (or use upstream "content" field)', required: false },
    { name: 'mode', type: 'select', desc: 'Write mode: overwrite or append', required: false },
  ],
  sampleInput: { content: 'Hello World\n', path: '/tmp/output.txt' },
  sampleOutput: {
    written: true,
    path: '/tmp/output.txt',
    bytes: 12,
    mode: 'overwrite',
    filename: 'output.txt',
  },
  tips: [
    'Parent directories are created automatically.',
    'Leave "content" empty in properties to use the upstream "content" field.',
    'Use "append" mode to build log files or accumulate data.',
    'Ensure the server process has write permissions for the target directory.',
  ],
};

export default function WriteFileNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
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
  );
}
