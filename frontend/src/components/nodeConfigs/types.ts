export interface NodeConfigProps {
  nodeId: string;
  nodeType: string;
  properties: Record<string, any>;
  updateProp: (key: string, value: any) => void;
  updateLabel: (label: string) => void;
  configs?: Array<{ id: number; name: string; type: string; config?: Record<string, any> }>;
  workflows?: Array<{ id: number; name: string }>;
  currentWorkflowId?: number | null;
}

export interface NodeDoc {
  title: string;
  description: string;
  usage: string;
  properties: { name: string; type: string; desc: string; required?: boolean }[];
  sampleInput: Record<string, any>;
  sampleOutput: Record<string, any>;
  tips?: string[];
}
