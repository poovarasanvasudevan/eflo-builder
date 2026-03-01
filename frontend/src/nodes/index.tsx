import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  PlayCircleOutlined,
  StopOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  FileTextOutlined,
  ToolOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  NotificationOutlined,
  MailOutlined,
  InboxOutlined,
  FolderOpenOutlined,
  EditOutlined,
  CodeOutlined,
  ApartmentOutlined,
  PartitionOutlined,
  CloudServerOutlined,
  ForwardOutlined,
  ApiOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { PRIMARY } from '../theme';

/* Salesforce Flow Builder style node: big colored icon box + label underneath */
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
      icon={<PlayCircleOutlined />}
      bg="#4bc076"
      label={(data as any).label || 'Start'}
      hasTarget={false}
    />
  );
}

function EndNode({ data }: NodeProps) {
  return (
    <FlowNode
      icon={<StopOutlined />}
      bg="#e8647c"
      label={(data as any).label || 'End'}
      hasSource={false}
    />
  );
}

function HttpRequestNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<GlobalOutlined />}
      bg={PRIMARY}
      label={(data as any).label || 'HTTP Request'}
      subtitle={`${props.method || 'GET'} ${props.url ? props.url.substring(0, 18) : ''}`}
    />
  );
}

function DelayNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<ClockCircleOutlined />}
      bg="#f4c542"
      label={(data as any).label || 'Delay'}
      subtitle={`${props.durationMs || 1000}ms`}
    />
  );
}

function ConditionNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<BranchesOutlined />}
      bg="#f49756"
      label={(data as any).label || 'Decision'}
      subtitle={props.expression || ''}
      sourceHandles={[
        { id: 'true', left: '30%', label: 'Yes' },
        { id: 'false', left: '70%', label: 'No' },
      ]}
    />
  );
}

function LogNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<FileTextOutlined />}
      bg="#54b7d3"
      label={(data as any).label || 'Log'}
      subtitle={props.message ? props.message.substring(0, 20) : ''}
    />
  );
}

function TransformNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<ToolOutlined />}
      bg="#f49756"
      label={(data as any).label || 'Transform'}
      subtitle={props.expression ? props.expression.substring(0, 20) : ''}
    />
  );
}

function FunctionNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  const code = (props.code as string) || '';
  return (
    <FlowNode
      icon={<CodeOutlined />}
      bg="#9b59b6"
      label={(data as any).label || 'Function'}
      subtitle={code ? code.substring(0, 20) + (code.length > 20 ? '...' : '') : 'JavaScript'}
    />
  );
}

function RedisNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<DatabaseOutlined />}
      bg="#d63031"
      label={(data as any).label || 'Redis'}
      subtitle={`${props.operation || ''} ${props.key || ''}`}
    />
  );
}

function CronNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<FieldTimeOutlined />}
      bg="#2e7d32"
      label={(data as any).label || 'Cron'}
      subtitle={props.expression || '* * * * *'}
      hasTarget={false}
    />
  );
}

function RedisSubscribeNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<NotificationOutlined />}
      bg="#c0392b"
      label={(data as any).label || 'Redis Subscribe'}
      subtitle={props.channel || 'channel'}
      hasTarget={false}
    />
  );
}

function EmailNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<MailOutlined />}
      bg="#8e44ad"
      label={(data as any).label || 'Send Email'}
      subtitle={props.to ? props.to.substring(0, 18) : 'to@...'}
    />
  );
}

function EmailReceiveNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<InboxOutlined />}
      bg="#6c3483"
      label={(data as any).label || 'Receive Email'}
      subtitle={props.mailbox || 'INBOX'}
      hasTarget={false}
    />
  );
}

function ReadFileNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<FolderOpenOutlined />}
      bg="#2980b9"
      label={(data as any).label || 'Read File'}
      subtitle={props.path ? props.path.split('/').pop() : 'file...'}
    />
  );
}

function WriteFileNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<EditOutlined />}
      bg="#27ae60"
      label={(data as any).label || 'Write File'}
      subtitle={props.path ? props.path.split('/').pop() : 'file...'}
    />
  );
}

function ExecNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<CodeOutlined />}
      bg="#2c3e50"
      label={(data as any).label || 'Exec'}
      subtitle={props.command ? props.command.substring(0, 20) : 'command...'}
    />
  );
}

function SshNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<CloudServerOutlined />}
      bg="#16a085"
      label={(data as any).label || 'SSH'}
      subtitle={props.command ? props.command.substring(0, 20) : 'command...'}
    />
  );
}

function HttpInNode({ data }: NodeProps) {
  return (
    <FlowNode
      icon={<GlobalOutlined />}
      bg="#3498db"
      label={(data as any).label || 'HTTP In'}
      subtitle="/api/in/..."
      hasTarget={false}
    />
  );
}

function HttpOutNode({ data }: NodeProps) {
  return (
    <FlowNode
      icon={<GlobalOutlined />}
      bg="#2ecc71"
      label={(data as any).label || 'HTTP Out'}
      subtitle="Send response"
    />
  );
}

function DatabaseNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  const q = (props.query as string) || '';
  return (
    <FlowNode
      icon={<DatabaseOutlined />}
      bg="#2980b9"
      label={(data as any).label || 'Database'}
      subtitle={q ? q.replace(/\s+/g, ' ').trim().substring(0, 24) : 'SQL...'}
    />
  );
}

function SwitchNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  const cases: { label: string; value: string }[] = props.cases || [];
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
      icon={<ApartmentOutlined />}
      bg="#e67e22"
      label={(data as any).label || 'Switch'}
      subtitle={props.expression || ''}
      sourceHandles={handles.length > 1 ? handles : undefined}
    />
  );
}

function SubFlowNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<PartitionOutlined />}
      bg="#1a5276"
      label={(data as any).label || 'Flow'}
      subtitle={props.workflow_name || `ID: ${props.workflow_id || '?'}`}
    />
  );
}

function ContinueNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<ForwardOutlined />}
      bg="#16a085"
      label={(data as any).label || 'Continue'}
      subtitle={props.after_node_label ? `after: ${props.after_node_label}` : 'after node'}
    />
  );
}

function GraphQLNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  const url = (props.url as string) || '';
  return (
    <FlowNode
      icon={<ApiOutlined />}
      bg="#e535ab"
      label={(data as any).label || 'GraphQL'}
      subtitle={url ? url.replace(/^https?:\/\//, '').substring(0, 24) : 'endpoint'}
    />
  );
}

function GetConfigStoreNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<SafetyCertificateOutlined />}
      bg="#16a085"
      label={(data as any).label || 'Get Config Store'}
      subtitle={(props.key as string) || 'key'}
    />
  );
}

function SetConfigStoreNode({ data }: NodeProps) {
  const props = (data as any).properties || {};
  return (
    <FlowNode
      icon={<SafetyCertificateOutlined />}
      bg="#1abc9c"
      label={(data as any).label || 'Set Config Store'}
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
