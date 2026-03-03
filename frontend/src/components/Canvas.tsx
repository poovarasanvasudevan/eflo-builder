import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type ReactFlowInstance,
  type Edge,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ModalDialog, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button';

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

export default function Canvas({ darkMode = false }: { darkMode?: boolean }) {
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
    setEdges,
    currentWorkflow,
  } = useWorkflowStore();

  const [edgeCommentModal, setEdgeCommentModal] = useState<{ edge: Edge; description: string } | null>(null);

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

  const onEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const desc = (edge.data as { description?: string } | undefined)?.description ?? '';
      setEdgeCommentModal({ edge, description: desc });
    },
    []
  );

  const saveEdgeComment = useCallback(() => {
    if (!edgeCommentModal) return;
    const { edge, description } = edgeCommentModal;
    setEdges(
      edges.map((e) =>
        e.id === edge.id ? { ...e, data: { ...e.data, description } } : e
      )
    );
    setEdgeCommentModal(null);
  }, [edgeCommentModal, edges, setEdges]);

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
          background: darkMode ? '#14161a' : '#f4f6f9',
          color: darkMode ? '#c3cbd8' : '#706e6b',
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
        onEdgeDoubleClick={onEdgeDoubleClick}
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
        snapGrid={[5, 5]}
        colorMode={darkMode ? 'dark' : 'light'}
      >
        {/* <Background color="#d8dde6" gap={32} size={1} /> */}
        <Background />
        {edgeCommentModal && (
          <ModalDialog onClose={() => setEdgeCommentModal(null)}>
            <ModalHeader>
              <ModalTitle>Edge description / comment</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <p className="text-xs text-neutral-500 mb-2">
                Add a description or comment for this connection (e.g. when to take this path).
              </p>
              <textarea
                className="w-full min-h-[80px] p-2 border border-[#dfe1e6] rounded text-sm resize-y"
                placeholder="Describe when this edge is used..."
                value={edgeCommentModal.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEdgeCommentModal((prev) => (prev ? { ...prev, description: e.target.value } : null))
                }
                rows={4}
              />
            </ModalBody>
            <ModalFooter>
              <Button appearance="primary" onClick={saveEdgeComment}>
                Save
              </Button>
              <Button appearance="subtle" onClick={() => setEdgeCommentModal(null)}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalDialog>
        )}
        <Controls
          position="bottom-right"
          style={{ boxShadow: `0 2px 6px ${darkMode ? '#2e3138' : 'rgba(0,0,0,0.1)'}`, border: darkMode ? '1px solid #2e3138' : '1px solid #d8dde6' }}
        />
      </ReactFlow>
    </div>
  );
}

