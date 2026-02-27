import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type ReactFlowInstance,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '../store/workflowStore';
import { nodeTypes } from '../nodes';
import { PRIMARY } from '../theme';

let idCounter = 0;
const getId = () => `node_${Date.now()}_${idCounter++}`;

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#b0b0b0', strokeWidth: 2 },
};

export default function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
    currentWorkflow,
  } = useWorkflowStore();

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow-type');
      const label = event.dataTransfer.getData('application/reactflow-label');
      if (!type) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds || !reactFlowInstance.current) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: label || type, properties: {} },
      };

      addNode(newNode);
    },
    [addNode]
  );

  if (!currentWorkflow) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6f9',
          color: '#706e6b',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 40, opacity: 0.3 }}>⚡</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: PRIMARY }}>No workflow open</div>
        <div style={{ fontSize: 11 }}>Open a workflow from the <b>Flows</b> tab or create a <b>New</b> one</div>
      </div>
    );
  }

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ maxZoom: 0.8, padding: 0.3 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode={['Backspace', 'Delete']}
        style={{ background: '#f4f6f9' }}
        snapToGrid
        snapGrid={[16, 16]}
      >
        <Background color="#d8dde6" gap={32} size={1} />
        <Controls
          position="bottom-right"
          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1)', borderRadius: 6, border: '1px solid #d8dde6' }}
        />
      </ReactFlow>
    </div>
  );
}

