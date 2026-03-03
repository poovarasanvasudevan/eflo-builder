import { Handle, Position, type NodeProps } from '@xyflow/react';
import { PRIMARY } from '../theme';
import { Icons } from '../components/ui/Icons';

function FlowNode({
  icon,
  bg,
  label,
  subtitle,
  hasTarget = true,
  hasSource = true,
  sourceHandles,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  subtitle?: string;
  hasTarget?: boolean;
  hasSource?: boolean;
  sourceHandles?: { id: string; left: string; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
      {hasTarget && <Handle type="target" position={Position.Top} style={{ background: '#b0b0b0' }} />}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          boxShadow: '0 1px 4px rgba(0,0,0,0.13)',
          cursor: 'grab',
        }}
      >
        {icon}
      </div>
      <div style={{ marginTop: 3, textAlign: 'center', maxWidth: 100 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#16325c', lineHeight: '12px' }}>{label}</div>
        {subtitle && (
          <div style={{ fontSize: 8, color: '#706e6b', lineHeight: '10px', marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
      {sourceHandles ? (
        <>
          {sourceHandles.map((sh) => (
            <Handle
              key={sh.id}
              type="source"
              position={Position.Bottom}
              id={sh.id}
              style={{ left: sh.left, background: '#b0b0b0' }}
            />
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 1, padding: '0 2px' }}>
            {sourceHandles.map((sh) => (
              <span key={sh.id} style={{ fontSize: 7, color: '#706e6b' }}>{sh.label}</span>
            ))}
          </div>
        </>
      ) : hasSource ? (
        <Handle type="source" position={Position.Bottom} style={{ background: '#b0b0b0' }} />
      ) : null}
    </div>
  );
}

function StartNode({ data }: NodeProps) {
  return (
    <FlowNode
      icon={<Icons.Play />}
      bg="#4bc076"
      label={(data as Record<string, unknown>).label as string || 'Start'}
      hasTarget={false}
    />
  );
}

function EndNode({ data }: NodeProps) {
  return (
    <FlowNode
      icon={<Icons.Stop />}
      bg="#e8647c"
      label={(data as Record<string, unknown>).label as string || 'End'}
      hasSource={false}
    />
  );
}

function HttpRequestNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Globe />}
      bg={PRIMARY}
      label={(data as Record<string, unknown>).label as string || 'HTTP Request'}
      subtitle={`${props.method || 'GET'} ${props.url ? String(props.url).substring(0, 18) : ''}`}
    />
  );
}

function DelayNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Clock />}
      bg="#f4c542"
      label={(data as Record<string, unknown>).label as string || 'Delay'}
      subtitle={`${props.durationMs || 1000}ms`}
    />
  );
}

function ConditionNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Branch />}
      bg="#f49756"
      label={(data as Record<string, unknown>).label as string || 'Decision'}
      subtitle={(props.expression as string) || ''}
      sourceHandles={[
        { id: 'true', left: '30%', label: 'Yes' },
        { id: 'false', left: '70%', label: 'No' },
      ]}
    />
  );
}

function LogNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.FileText />}
      bg="#54b7d3"
      label={(data as Record<string, unknown>).label as string || 'Log'}
      subtitle={props.message ? String(props.message).substring(0, 20) : ''}
    />
  );
}

function TransformNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Tool />}
      bg="#f49756"
      label={(data as Record<string, unknown>).label as string || 'Transform'}
      subtitle={props.expression ? String(props.expression).substring(0, 20) : ''}
    />
  );
}

function FunctionNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  const code = (props.code as string) || '';
  return (
    <FlowNode
      icon={<Icons.Code />}
      bg="#9b59b6"
      label={(data as Record<string, unknown>).label as string || 'Function'}
      subtitle={code ? code.substring(0, 20) + (code.length > 20 ? '...' : '') : 'JavaScript'}
    />
  );
}

function RedisNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Database />}
      bg="#d63031"
      label={(data as Record<string, unknown>).label as string || 'Redis'}
      subtitle={`${props.operation || ''} ${props.key || ''}`}
    />
  );
}

function CronNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Schedule />}
      bg="#2e7d32"
      label={(data as Record<string, unknown>).label as string || 'Cron'}
      subtitle={(props.expression as string) || '* * * * *'}
      hasTarget={false}
    />
  );
}

function RedisSubscribeNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Bell />}
      bg="#c0392b"
      label={(data as Record<string, unknown>).label as string || 'Redis Subscribe'}
      subtitle={(props.channel as string) || 'channel'}
      hasTarget={false}
    />
  );
}

function EmailNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Mail />}
      bg="#8e44ad"
      label={(data as Record<string, unknown>).label as string || 'Send Email'}
      subtitle={props.to ? String(props.to).substring(0, 18) : 'to@...'}
    />
  );
}

function EmailReceiveNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Inbox />}
      bg="#6c3483"
      label={(data as Record<string, unknown>).label as string || 'Receive Email'}
      subtitle={(props.mailbox as string) || 'INBOX'}
      hasTarget={false}
    />
  );
}

function ReadFileNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Folder />}
      bg="#2980b9"
      label={(data as Record<string, unknown>).label as string || 'Read File'}
      subtitle={props.path ? String(props.path).split('/').pop() : 'file...'}
    />
  );
}

function WriteFileNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Edit />}
      bg="#27ae60"
      label={(data as Record<string, unknown>).label as string || 'Write File'}
      subtitle={props.path ? String(props.path).split('/').pop() : 'file...'}
    />
  );
}

function ExecNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Code />}
      bg="#2c3e50"
      label={(data as Record<string, unknown>).label as string || 'Exec'}
      subtitle={props.command ? String(props.command).substring(0, 20) : 'command...'}
    />
  );
}

function SshNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.CloudServer />}
      bg="#16a085"
      label={(data as Record<string, unknown>).label as string || 'SSH'}
      subtitle={props.command ? String(props.command).substring(0, 20) : 'command...'}
    />
  );
}

function HttpInNode({ data }: NodeProps) {
  return (
    <FlowNode
      icon={<Icons.Globe />}
      bg="#3498db"
      label={(data as Record<string, unknown>).label as string || 'HTTP In'}
      subtitle="/api/in/..."
      hasTarget={false}
    />
  );
}

function HttpOutNode({ data }: NodeProps) {
  return (
    <FlowNode
      icon={<Icons.Globe />}
      bg="#2ecc71"
      label={(data as Record<string, unknown>).label as string || 'HTTP Out'}
      subtitle="Send response"
    />
  );
}

function DatabaseNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  const q = (props.query as string) || '';
  return (
    <FlowNode
      icon={<Icons.Database />}
      bg="#2980b9"
      label={(data as Record<string, unknown>).label as string || 'Database'}
      subtitle={q ? q.replace(/\s+/g, ' ').trim().substring(0, 24) : 'SQL...'}
    />
  );
}

function SwitchNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  const cases: { label: string; value: string }[] = (props.cases as { label: string; value: string }[]) || [];
  const handles = cases.map((c, i) => ({
    id: c.label || c.value || `case_${i}`,
    left: `${((i + 1) / (cases.length + 2)) * 100}%`,
    label: c.label || c.value,
  }));
  handles.push({
    id: 'default',
    left: `${((cases.length + 1) / (cases.length + 2)) * 100}%`,
    label: 'Default',
  });
  return (
    <FlowNode
      icon={<Icons.Apartment />}
      bg="#e67e22"
      label={(data as Record<string, unknown>).label as string || 'Switch'}
      subtitle={(props.expression as string) || ''}
      sourceHandles={handles.length > 1 ? handles : undefined}
    />
  );
}

function SubFlowNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Partition />}
      bg="#1a5276"
      label={(data as Record<string, unknown>).label as string || 'Flow'}
      subtitle={(props.workflow_name as string) || `ID: ${props.workflow_id || '?'}`}
    />
  );
}

function ContinueNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Forward />}
      bg="#16a085"
      label={(data as Record<string, unknown>).label as string || 'Continue'}
      subtitle={props.after_node_label ? `after: ${props.after_node_label}` : 'after node'}
    />
  );
}

function GraphQLNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  const url = (props.url as string) || '';
  return (
    <FlowNode
      icon={<Icons.Api />}
      bg="#e535ab"
      label={(data as Record<string, unknown>).label as string || 'GraphQL'}
      subtitle={url ? url.replace(/^https?:\/\//, '').substring(0, 24) : 'endpoint'}
    />
  );
}

function GetConfigStoreNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Safety />}
      bg="#16a085"
      label={(data as Record<string, unknown>).label as string || 'Get Config Store'}
      subtitle={(props.key as string) || 'key'}
    />
  );
}

function SetConfigStoreNode({ data }: NodeProps) {
  const props = ((data as Record<string, unknown>).properties as Record<string, unknown>) || {};
  return (
    <FlowNode
      icon={<Icons.Safety />}
      bg="#1abc9c"
      label={(data as Record<string, unknown>).label as string || 'Set Config Store'}
      subtitle={(props.key as string) || 'key'}
    />
  );
}

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  http_request: HttpRequestNode,
  delay: DelayNode,
  condition: ConditionNode,
  log: LogNode,
  transform: TransformNode,
  function: FunctionNode,
  redis: RedisNode,
  cron: CronNode,
  redis_subscribe: RedisSubscribeNode,
  email: EmailNode,
  email_receive: EmailReceiveNode,
  read_file: ReadFileNode,
  write_file: WriteFileNode,
  exec: ExecNode,
  ssh: SshNode,
  database: DatabaseNode,
  http_in: HttpInNode,
  http_out: HttpOutNode,
  switch: SwitchNode,
  flow: SubFlowNode,
  continue: ContinueNode,
  graphql: GraphQLNode,
  get_config_store: GetConfigStoreNode,
  set_config_store: SetConfigStoreNode,
};
