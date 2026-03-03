import { useState } from 'react';
import type { ReactNode } from 'react';

export interface SimpleTreeNode {
  key: string;
  title: ReactNode;
  children?: SimpleTreeNode[];
  isLeaf?: boolean;
}

interface SimpleTreeProps {
  treeData: SimpleTreeNode[];
  defaultExpandAll?: boolean;
  onSelect?: (key: string) => void;
  onRightClick?: (key: string, x: number, y: number) => void;
  className?: string;
}

function TreeNode({
  node,
  level,
  expanded,
  isExpandedKey,
  onToggle,
  onSelect,
  onRightClick,
}: {
  node: SimpleTreeNode;
  level: number;
  expanded: boolean;
  isExpandedKey: (key: string) => boolean;
  onToggle: (key: string) => void;
  onSelect?: (key: string) => void;
  onRightClick?: (key: string, x: number, y: number) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className="select-none">
      <div
        className="flex items-center gap-1 py-0.5 pr-1 cursor-pointer rounded hover:bg-black/5 min-h-[22px]"
        style={{ paddingLeft: level * 12 + 4 }}
        onClick={() => {
          if (hasChildren) onToggle(node.key);
          else onSelect?.(node.key);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onRightClick?.(node.key, e.clientX, e.clientY);
        }}
      >
        {hasChildren && (
          <span className="w-4 text-[10px] text-[#706e6b] flex-shrink-0">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-4 flex-shrink-0" />}
        <span className="flex-1 min-w-0 truncate text-[11px]">{node.title}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              level={level + 1}
              expanded={isExpandedKey(child.key)}
              isExpandedKey={isExpandedKey}
              onToggle={onToggle}
              onSelect={onSelect}
              onRightClick={onRightClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SimpleTree({
  treeData,
  defaultExpandAll = true,
  onSelect,
  onRightClick,
  className = '',
}: SimpleTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const isExpandedKey = (key: string) => defaultExpandAll || !collapsed.has(key);
  return (
    <div className={className}>
      {treeData.map((node) => (
        <TreeNode
          key={node.key}
          node={node}
          level={0}
          expanded={isExpandedKey(node.key)}
          isExpandedKey={isExpandedKey}
          onToggle={toggle}
          onSelect={onSelect}
          onRightClick={onRightClick}
        />
      ))}
    </div>
  );
}
