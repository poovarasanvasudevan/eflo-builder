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

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  http_request: HttpRequestNode,
  delay: DelayNode,
  condition: ConditionNode,
  log: LogNode,
  transform: TransformNode,
  redis: RedisNode,
  cron: CronNode,
  redis_subscribe: RedisSubscribeNode,
  email: EmailNode,
  email_receive: EmailReceiveNode,
  read_file: ReadFileNode,
  write_file: WriteFileNode,
  exec: ExecNode,
  switch: SwitchNode,
  flow: SubFlowNode,
};
