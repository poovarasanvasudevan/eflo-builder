import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';
import TextField from '@atlaskit/textfield';

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
        <Text strong className="text-[10px] block mb-0.5">File Path</Text>
        <TextField placeholder="/path/to/output.txt" value={(properties.path as string) || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('path', e.target.value)} />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Content</Text>
        <textarea className="w-full min-h-[60px] p-2 border border-[#dfe1e6] rounded text-xs resize-y" placeholder="Content to write..." value={(properties.content as string) || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProp('content', e.target.value)} rows={3} />
        <Text className="text-[9px] text-[#706e6b]">Leave empty to use upstream &quot;content&quot; field.</Text>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Mode</Text>
        <select className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white" value={(properties.mode as string) || 'overwrite'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('mode', e.target.value)}>
          <option value="overwrite">Overwrite</option>
          <option value="append">Append</option>
        </select>
      </div>
    </>
  );
}
