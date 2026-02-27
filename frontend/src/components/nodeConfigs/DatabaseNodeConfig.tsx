import { Select, InputNumber, Typography } from 'antd';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

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
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Database Config</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Select database..."
          value={properties.configId ?? undefined}
          onChange={(val) => updateProp('configId', val)}
          options={dbConfigs.map((c) => ({
            value: c.id,
            label: `${c.name} (${c.config?.driver || 'mysql'}: ${c.config?.host || ''}:${c.config?.port ?? 3306}/${c.config?.database || ''})`,
          }))}
          notFoundContent={
            <Text type="secondary" style={{ fontSize: 10, padding: 4 }}>
              No database configs. Add one in ⚙ Configs.
            </Text>
          }
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Mode</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          value={properties.mode ?? 'query'}
          onChange={(val) => updateProp('mode', val)}
          options={[
            { value: 'query', label: 'Query (SELECT, INSERT, UPDATE, etc.)' },
            { value: 'procedure', label: 'Procedure (CALL / EXEC)' },
          ]}
        />
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
        <Text type="secondary" style={{ fontSize: 9, display: 'block', marginTop: 4 }}>
          Use {'{{key}}'} or {'{{input.key}}'} to inject values from the previous node (e.g. {'{{userId}}'}, {'{{input.orderId}}'}).
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
