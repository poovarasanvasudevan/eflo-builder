import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';
import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

export const DATABASE_NODE_DOC: NodeDoc = {
  title: 'Database',
  description:
    'Executes a SQL query or stored procedure against MySQL or SQL Server. Uses a database connection config. You can reference data from the previous node in the SQL using {{key}} or {{input.key}} placeholders.',
  usage:
    'Create a Database config in ⚙ Connection Configs (type: Database) with driver (MySQL or SQL Server), host, port, database name, and credentials. Add this node, select the config, choose Query or Procedure mode, and write your SQL. Use {{userId}}, {{input.orderId}}, or {{payload.name}} to inject values from the previous node; values are passed as parameters (safe from SQL injection).',
  properties: [
    { name: 'configId', type: 'select', desc: 'Database connection configuration', required: true },
    { name: 'mode', type: 'select', desc: 'Query (SELECT/INSERT/...) or Procedure (CALL/EXEC)', required: false },
    { name: 'query', type: 'string', desc: 'SQL query or procedure call with optional {{placeholder}} from input', required: true },
    { name: 'timeoutMs', type: 'number', desc: 'Timeout in milliseconds (default: 30000)', required: false },
  ],
  sampleInput: { userId: 42, orderId: 'ORD-001' },
  sampleOutput: {
    rows: [{ id: 42, name: 'John', email: 'john@example.com' }],
    rowCount: 1,
    query: 'SELECT * FROM users WHERE id = ?',
  },
  tips: [
    'Create a Database config first in ⚙ Connection Configs (type: Database).',
    'Use {{key}} or {{input.key}} in SQL to inject values from the previous node (e.g. {{userId}}, {{input.orderId}}).',
    'Nested input is supported: use {{user.id}} when the previous node outputs { user: { id: 123 } }.',
    'Placeholders are replaced with parameterized values (safe from SQL injection).',
    'For procedures: write the procedure name and params, e.g. my_proc({{param1}}, {{param2}}); mode "Procedure" adds CALL/EXEC.',
    'Output "rows" is an array of objects; "rowCount" is the number of rows returned.',
  ],
};

export default function DatabaseNodeConfig({ properties, updateProp, configs }: NodeConfigProps) {
  const dbConfigs = configs?.filter((c) => c.type === 'database') ?? [];
  return (
    <>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Database Config</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={properties.configId != null ? String(properties.configId) : ''}
          onChange={(e) => updateProp('configId', e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">Select database...</option>
          {dbConfigs.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({(c.config as { driver?: string; host?: string; port?: number; database?: string })?.driver || 'mysql'}: {(c.config as { host?: string })?.host || ''}:{(c.config as { port?: number })?.port ?? 3306}/{(c.config as { database?: string })?.database || ''})</option>
          ))}
        </select>
        {dbConfigs.length === 0 && <Text className="text-[10px] text-[#706e6b] block mt-0.5">No database configs. Add one in ⚙ Configs.</Text>}
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Mode</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={(properties.mode as string) ?? 'query'}
          onChange={(e) => updateProp('mode', e.target.value)}
        >
          <option value="query">Query (SELECT, INSERT, UPDATE, etc.)</option>
          <option value="procedure">Procedure (CALL / EXEC)</option>
        </select>
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>SQL</Text>
        <AceEditor
          mode="sql"
          theme="github"
          value={(properties.query as string) || ''}
          onChange={(code) => updateProp('query', code)}
          name="database-node-query"
          fontSize={10}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          setOptions={{ useWorker: false }}
          style={{ width: '100%', minHeight: 180, borderRadius: 4, border: '1px solid #d9d9d9' }}
          editorProps={{ $blockScrolling: true }}
        />
        <Text className="text-[9px] text-[#706e6b] block mt-1">Use {'{{key}}'} or {'{{input.key}}'} to inject values from the previous node (e.g. {'{{userId}}'}, {'{{input.orderId}}'}).</Text>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Timeout (ms)</Text>
        <input
          type="number"
          min={1000}
          max={300000}
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1"
          value={properties.timeoutMs ?? 30000}
          onChange={(e) => updateProp('timeoutMs', e.target.value === '' ? undefined : Number(e.target.value))}
        />
      </div>
    </>
  );
}
