import React, { useRef, useEffect, useState } from 'react';
import { MindMapNode, ThemeMode, THEMES } from '../types';
import { NODE_WIDTH, NODE_HEIGHT } from '../constants';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface Props {
  node: MindMapNode;
  theme: ThemeMode;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (id: string) => void;
  onEditStart: (id: string) => void;
  onEditEnd: (id: string, text: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddChild: (id: string) => void;
}

export const MindMapNodeComponent: React.FC<Props> = ({
  node,
  theme,
  isSelected,
  isEditing,
  onSelect,
  onEditStart,
  onEditEnd,
  onToggleCollapse,
  onAddChild
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localText, setLocalText] = useState(node.text);
  const styles = THEMES[theme];

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalText(node.text);
  }, [node.text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEditEnd(node.id, localText);
    }
    if (e.key === 'Escape') {
      setLocalText(node.text);
      onEditEnd(node.id, node.text);
    }
    e.stopPropagation(); // Prevent canvas shortcuts
  };

  const hasChildren = node.children && node.children.length > 0;
  
  // Dynamic color generation based on depth/branch
  const getBranchColor = () => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];
    // Use a hash of the ID or depth for stability, simplified here
    if (node.depth === 0) return styles.edge; 
    return colors[(node.depth || 0) % colors.length];
  };

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className="transition-transform duration-300 ease-in-out cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEditStart(node.id);
      }}
    >
      {/* Node Background */}
      <rect
        x={-NODE_WIDTH / 2}
        y={-NODE_HEIGHT / 2}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={12}
        className={`
          ${styles.nodeBg} 
          ${isSelected ? `stroke-2 ${styles.highlight}` : `stroke-1 stroke-slate-200 dark:stroke-slate-700`}
          shadow-sm
          transition-all duration-200
        `}
      />

      {/* Content */}
      {isEditing ? (
        <foreignObject
          x={-NODE_WIDTH / 2 + 5}
          y={-NODE_HEIGHT / 2}
          width={NODE_WIDTH - 10}
          height={NODE_HEIGHT}
        >
          <div className="flex items-center justify-center h-full">
            <input
              ref={inputRef}
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => onEditEnd(node.id, localText)}
              className="w-full bg-transparent text-center outline-none text-slate-800 dark:text-white font-medium"
            />
          </div>
        </foreignObject>
      ) : (
        <text
          dy=".3em"
          textAnchor="middle"
          className={`
            pointer-events-none select-none text-sm font-medium
            ${styles.text}
          `}
        >
          {node.text.length > 20 ? node.text.substring(0, 18) + '...' : node.text}
        </text>
      )}

      {/* Expand/Collapse Button */}
      {hasChildren && (
        <g
          transform={`translate(${NODE_WIDTH / 2 + 12}, 0)`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(node.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <circle r="8" className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600" />
          <text 
             dy=".3em" 
             textAnchor="middle" 
             className="text-[10px] fill-slate-500 font-bold select-none pointer-events-none"
          >
              {node.isExpanded ? '-' : '+'}
          </text>
        </g>
      )}

      {/* Add Child Hover Button (Bottom) */}
      <g
          transform={`translate(0, ${NODE_HEIGHT/2 + 12})`}
          onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
          }}
          className={`opacity-0 ${isSelected ? 'opacity-100' : 'group-hover:opacity-50'} transition-opacity cursor-pointer`}
      >
           <circle r="8" className="fill-blue-500 stroke-none" />
           <path d="M-3 0 H3 M0 -3 V3" stroke="white" strokeWidth="1.5" />
      </g>

    </g>
  );
};
