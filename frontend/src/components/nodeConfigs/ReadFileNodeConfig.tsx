import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';
import TextField from '@atlaskit/textfield';

export const READ_FILE_NODE_DOC: NodeDoc = {
  title: 'Read File',
  description:
    'Reads a file from the server filesystem and outputs its text content, size, filename, and modification time. Useful for reading config files, logs, data files, etc.',
  usage:
    'Set the file path (absolute or relative to the server working directory). The file content is output as the "content" field for downstream nodes. The path can also come from an upstream node.',
  properties: [
    { name: 'path', type: 'string', desc: 'Absolute or relative file path to read', required: true },
    { name: 'encoding', type: 'select', desc: 'File encoding (utf-8, ascii, binary)', required: false },
  ],
  sampleInput: { path: '/tmp/data.json' },
  sampleOutput: {
    content: '{"users":[{"id":1,"name":"Alice"}]}',
    path: '/tmp/data.json',
    size: 36,
    filename: 'data.json',
    encoding: 'utf-8',
    isDir: false,
    modTime: '2026-02-25 10:00:00 +0000 UTC',
  },
  tips: [
    'The path can be set in properties or passed from an upstream node as "path".',
    'File content is always returned as a string.',
    'Use a Transform node after this to parse JSON content: json.content',
    'Ensure the server process has read permissions for the target file.',
  ],
};

export default function ReadFileNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <>
      <div>
        <Text strong className="text-[10px] block mb-0.5">File Path</Text>
        <TextField placeholder="/path/to/file.txt" value={(properties.path as string) || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('path', e.target.value)} />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Encoding</Text>
        <select className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white" value={(properties.encoding as string) || 'utf-8'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('encoding', e.target.value)}>
          <option value="utf-8">UTF-8</option>
          <option value="ascii">ASCII</option>
          <option value="binary">Binary</option>
        </select>
      </div>
    </>
  );
}
