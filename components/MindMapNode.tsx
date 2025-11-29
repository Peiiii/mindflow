
import React, { useRef, useEffect } from 'react';
import { MindMapNode, ThemeMode, THEMES } from '../types';
import { MIN_NODE_HEIGHT, MIN_NODE_WIDTH, NODE_STYLES } from '../constants';

interface Props {
  node: MindMapNode;
  theme: ThemeMode;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (id: string) => void;
  onEditStart: (id: string) => void;
  onEditChange: (id: string, text: string) => void;
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
  onEditChange,
  onEditEnd,
  onToggleCollapse,
  onAddChild
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const styles = THEMES[theme];

  // Dimensions from layout
  const width = node.width || MIN_NODE_WIDTH;
  const height = node.height || MIN_NODE_HEIGHT;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Only select all on initial focus to avoid interrupting typing
      // We can check if selectionStart is 0 and value equals node.text to guess it's initial
      // But for simplicity, we'll just focus. 
      // If we want select all on start, we need a flag or logic.
      // Usually users expect cursor at end or selected all. 
      // Since we re-render on every keystroke, we rely on React to keep focus.
    }
  }, [isEditing]);
  
  // When entering edit mode, select text
  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to save, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEditEnd(node.id, node.text);
    }
    if (e.key === 'Escape') {
      // Revert is complex here because we've been updating draft.
      // Ideally we should have an onCancel that reverts draft.
      // For now, commit current state or we can pass original text?
      // Let's just commit.
      onEditEnd(node.id, node.text);
    }
    e.stopPropagation(); // Prevent canvas shortcuts
  };

  const hasChildren = node.children && node.children.length > 0;

  // Shared text styles
  const textStyle: React.CSSProperties = {
    fontFamily: NODE_STYLES.fontFamily,
    fontSize: NODE_STYLES.fontSize,
    fontWeight: NODE_STYLES.fontWeight,
    lineHeight: NODE_STYLES.lineHeight,
    padding: NODE_STYLES.padding,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    textAlign: 'left',
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
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={8}
        className={`
          ${styles.nodeBg} 
          ${isSelected ? `stroke-2 ${styles.highlight}` : `stroke-1 stroke-slate-200 dark:stroke-slate-700`}
          shadow-sm
          transition-all duration-200
        `}
      />

      {/* Content */}
      <foreignObject
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        className="pointer-events-none" 
      >
        <div className="w-full h-full">
          {isEditing ? (
             <textarea
               ref={inputRef}
               value={node.text}
               onChange={(e) => onEditChange(node.id, e.target.value)}
               onKeyDown={handleKeyDown}
               onBlur={() => onEditEnd(node.id, node.text)}
               className="pointer-events-auto w-full h-full bg-transparent resize-none outline-none text-slate-800 dark:text-white border-0 m-0 overflow-hidden"
               style={{ 
                   ...textStyle,
                   // Reset defaults
                   margin: 0,
                }}
             />
          ) : (
            <div 
                className={`w-full h-full ${styles.text}`}
                style={textStyle}
            >
              {node.text}
            </div>
          )}
        </div>
      </foreignObject>

      {/* Expand/Collapse Button */}
      {hasChildren && (
        <g
          transform={`translate(${width / 2 + 12}, 0)`}
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

      {/* Add Child Hover Button */}
      <g
          transform={`translate(0, ${height/2 + 12})`}
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
