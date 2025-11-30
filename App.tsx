
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMindMap } from './hooks/useMindMap';
import { MindMapNodeComponent } from './components/MindMapNode';
import { MindMapEdge, PreviewEdge } from './components/MindMapEdge';
import { Toolbar } from './components/Toolbar';
import { Instructions } from './components/Instructions';
import { CanvasControls } from './components/CanvasControls';
import { ThemeMode, ViewportState, MindMapNode, DropPosition, THEMES } from './types';
import { MAX_NODE_WIDTH, MIN_NODE_HEIGHT, NODE_STYLES } from './constants';

function App() {
  const {
    nodes,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    addChild,
    addSibling,
    deleteNode,
    moveNode,
    toggleCollapse,
    undo,
    redo,
    canUndo,
    canRedo,
    updateNodeText,
    updateDraft
  } = useMindMap();

  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.LIGHT);
  const [viewport, setViewport] = useState<ViewportState>({ x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Drag & Drop State
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (editingId) return; // Disable shortcuts while typing

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (selectedId) addChild(selectedId);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedId) addSibling(selectedId);
          break;
        case 'Backspace':
        case 'Delete':
          if (selectedId) deleteNode(selectedId);
          break;
        case ' ':
          e.preventDefault();
          if (selectedId) setEditingId(selectedId);
          break;
        case 'ArrowLeft':
            e.preventDefault();
            navigateSelection('left');
            break;
        case 'ArrowRight':
            e.preventDefault();
            navigateSelection('right');
            break;
        case 'ArrowUp':
            e.preventDefault();
            navigateSelection('up');
            break;
        case 'ArrowDown':
            e.preventDefault();
            navigateSelection('down');
            break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedId, editingId, addChild, addSibling, deleteNode, undo, redo, nodes]);


  const navigateSelection = (direction: 'left' | 'right' | 'up' | 'down') => {
      if(!selectedId) return;
      
      const current = nodes[selectedId];
      if(!current) return;
      
      let nextId: string | null = null;
      const allNodes = Object.values(nodes) as MindMapNode[];

      if (direction === 'left' && current.parentId) {
          nextId = current.parentId;
      } else if (direction === 'right' && current.children.length > 0 && current.isExpanded) {
          nextId = current.children[Math.floor(current.children.length / 2)];
      } else {
          // Geometric navigation
          const cx = current.x || 0;
          const cy = current.y || 0;
          
          let closestDist = Infinity;
          
          allNodes.forEach(n => {
              if(n.id === current.id) return;
              const nx = n.x || 0;
              const ny = n.y || 0;
              
              const dx = nx - cx;
              const dy = ny - cy;

              let valid = false;
              if (direction === 'up') valid = dy < -10 && Math.abs(dx) < 100;
              if (direction === 'down') valid = dy > 10 && Math.abs(dx) < 100;
              if (direction === 'right') valid = dx > 10; 

              if(valid) {
                  const dist = Math.sqrt(dx*dx + dy*dy);
                  if(dist < closestDist) {
                      closestDist = dist;
                      nextId = n.id;
                  }
              }
          });
      }

      if(nextId) setSelectedId(nextId);
  };


  // Pan & Zoom Handlers
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.1, viewport.scale - e.deltaY * zoomSensitivity), 5);
      setViewport(prev => ({ ...prev, scale: newScale }));
    } else {
      setViewport(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  // ---------------- Drag & Drop Logic ----------------

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
      // If we are editing, don't drag
      if (editingId === id) return;
      
      const node = nodes[id];
      if (!node) return;
      
      setDragNodeId(id);
      setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    // 1. Panning Logic
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }

    // 2. Drag Node Logic (Global Spatial Detection)
    if (dragNodeId) {
        setCursorPos({ x: e.clientX, y: e.clientY });

        // Convert cursor to canvas coordinates (World Space)
        const worldX = (e.clientX - viewport.x) / viewport.scale;
        const worldY = (e.clientY - viewport.y) / viewport.scale;

        let bestTargetId: string | null = null;
        let newDropPosition: DropPosition | null = null;

        // Helper to check if a node is a descendant of the dragged node (Cycle Check)
        const isDescendant = (dragId: string, checkId: string): boolean => {
            if (dragId === checkId) return true;
            let current = nodes[checkId];
            while (current && current.parentId) {
                if (current.parentId === dragId) return true;
                current = nodes[current.parentId];
            }
            return false;
        };

        const allNodes = Object.values(nodes) as MindMapNode[];
        
        for (const node of allNodes) {
             // Skip invalid targets
             if (node.x === undefined || node.y === undefined) continue;
             if (isDescendant(dragNodeId, node.id)) continue; // Cannot drop into itself or children
             if (node.id === dragNodeId) continue; // Cannot drop on itself

             const w = node.width || MAX_NODE_WIDTH;
             const h = node.height || MIN_NODE_HEIGHT;
             
             // Define Hit Box with padding
             const padding = 20; 
             const left = node.x - w / 2 - padding;
             const right = node.x + w / 2 + padding;
             const top = node.y - h / 2 - padding;
             const bottom = node.y + h / 2 + padding;

             // Check Intersection
             if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
                 bestTargetId = node.id;
                 
                 // Calculate relative Y position (0 = top, 1 = bottom) within the actual node height
                 const relativeY = (worldY - (node.y - h/2)) / h;
                 
                 // Determine position based on vertical zones
                 if (node.id === 'root') {
                     // Root can only accept children
                     newDropPosition = 'inside';
                 } else {
                     if (relativeY < 0.3) newDropPosition = 'before';
                     else if (relativeY > 0.7) newDropPosition = 'after';
                     else newDropPosition = 'inside';
                 }
                 
                 break; // Found a target, stop searching (first hit)
             }
        }

        setDropTargetId(bestTargetId);
        setDropPosition(newDropPosition);
    }
  };

  const handleGlobalMouseUp = () => {
    setIsPanning(false);

    if (dragNodeId && dropTargetId && dropPosition) {
        moveNode(dragNodeId, dropTargetId, dropPosition);
    }

    setDragNodeId(null);
    setDropTargetId(null);
    setDropPosition(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
      // Start panning if clicking on background
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      // Deselect if clicking canvas
      setSelectedId(null);
      setEditingId(null);
  };

  // Calculate Preview Edge Logic
  const previewEdgeProps = useMemo(() => {
    if (!dragNodeId || !dropTargetId || !dropPosition) return null;
    
    // Ghost node position (mouse cursor transformed)
    const worldMouseX = (cursorPos.x - viewport.x) / viewport.scale;
    const worldMouseY = (cursorPos.y - viewport.y) / viewport.scale;

    let sourceNode: MindMapNode | undefined;

    if (dropPosition === 'inside') {
      sourceNode = nodes[dropTargetId];
    } else {
      // For before/after, the connection comes from the parent of the target
      const targetNode = nodes[dropTargetId];
      if (targetNode && targetNode.parentId) {
        sourceNode = nodes[targetNode.parentId];
      }
    }

    if (!sourceNode) return null;

    return {
      source: sourceNode,
      targetX: worldMouseX,
      targetY: worldMouseY,
      theme
    };
  }, [dragNodeId, dropTargetId, dropPosition, cursorPos, nodes, viewport, theme]);


  return (
    <div 
        ref={containerRef}
        className={`w-screen h-screen overflow-hidden select-none ${THEMES[theme].bg} transition-colors duration-300`}
        onMouseMove={handleGlobalMouseMove}
        onMouseUp={handleGlobalMouseUp}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
    >
      <Toolbar 
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onAdd={() => selectedId && addChild(selectedId)}
        onDelete={() => selectedId && deleteNode(selectedId)}
        currentTheme={theme}
        onSetTheme={setTheme}
      />

      <CanvasControls 
        onZoomIn={() => setViewport(v => ({ ...v, scale: Math.min(v.scale + 0.2, 5) }))}
        onZoomOut={() => setViewport(v => ({ ...v, scale: Math.max(v.scale - 0.2, 0.1) }))}
        onReset={() => setViewport({ x: window.innerWidth/2, y: window.innerHeight/2, scale: 1 })}
      />

      <Instructions />

      <svg className="w-full h-full pointer-events-none">
        <g 
            transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`}
            className="pointer-events-auto"
        >
            {/* Edges */}
            {(Object.values(nodes) as MindMapNode[]).map(node => 
                node.parentId && nodes[node.parentId] ? (
                    <MindMapEdge 
                        key={`${node.parentId}-${node.id}`} 
                        source={nodes[node.parentId]} 
                        target={node} 
                        theme={theme} 
                    />
                ) : null
            )}

            {/* Preview Edge during Drag */}
            {previewEdgeProps && (
              <PreviewEdge {...previewEdgeProps} />
            )}

            {/* Nodes */}
            {(Object.values(nodes) as MindMapNode[]).map(node => (
                <MindMapNodeComponent 
                    key={node.id} 
                    node={node} 
                    theme={theme}
                    isSelected={selectedId === node.id}
                    isEditing={editingId === node.id}
                    isDragging={dragNodeId === node.id}
                    isDropTarget={dropTargetId === node.id}
                    dropPosition={dropTargetId === node.id ? dropPosition : null}
                    onSelect={setSelectedId}
                    onEditStart={setEditingId}
                    onEditChange={updateDraft}
                    onEditEnd={(id, text) => {
                        updateNodeText(id, text);
                        updateDraft(id, null);
                        setEditingId(null);
                    }}
                    onToggleCollapse={toggleCollapse}
                    onAddChild={addChild}
                    onMouseDown={handleNodeMouseDown}
                />
            ))}

            {/* Ghost Node for Dragging */}
            {dragNodeId && nodes[dragNodeId] && (
                <g 
                    transform={`translate(${(cursorPos.x - viewport.x) / viewport.scale}, ${(cursorPos.y - viewport.y) / viewport.scale})`} 
                    className="opacity-80 pointer-events-none"
                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
                >
                     <rect
                        x={-(nodes[dragNodeId].width || MAX_NODE_WIDTH) / 2}
                        y={-(nodes[dragNodeId].height || MIN_NODE_HEIGHT) / 2}
                        width={nodes[dragNodeId].width || MAX_NODE_WIDTH}
                        height={nodes[dragNodeId].height || MIN_NODE_HEIGHT}
                        rx={8}
                        className={`${THEMES[theme].nodeBg} stroke-2 stroke-blue-500`}
                     />
                     <text
                        dy=".3em"
                        textAnchor="middle"
                        className={`${THEMES[theme].text} text-sm font-medium`}
                        style={NODE_STYLES}
                     >
                         {nodes[dragNodeId].text}
                     </text>
                </g>
            )}
        </g>
      </svg>
    </div>
  );
}

export default App;
