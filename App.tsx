
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMindMap } from './hooks/useMindMap';
import { MindMapNodeComponent } from './components/MindMapNode';
import { MindMapEdge, PreviewEdge } from './components/MindMapEdge';
import { Toolbar } from './components/Toolbar';
import { Instructions } from './components/Instructions';
import { CanvasControls } from './components/CanvasControls';
import { ThemeMode, THEMES, ViewportState, MindMapNode, DropPosition } from './types';
import { MAX_NODE_WIDTH, MIN_NODE_HEIGHT, NODE_STYLES } from './constants';

function App() {
  const {
    nodes,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    updateNodeText,
    updateDraft,
    addChild,
    addSibling,
    deleteNode,
    moveNode,
    toggleCollapse,
    undo,
    redo,
    canUndo,
    canRedo
  } = useMindMap();

  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.LIGHT);
  const [viewport, setViewport] = useState<ViewportState>({ x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Drag & Drop State
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
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
      setDragOffset({ x: 0, y: 0 }); 
      setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const handleNodeMouseMove = (e: React.MouseEvent, id: string) => {
     if (!dragNodeId || dragNodeId === id) return;
     
     const targetNode = nodes[id];
     if (!targetNode) return;

     // Calculate drop position based on mouse Y relative to target node height
     const rect = (e.currentTarget as Element).getBoundingClientRect();
     const relY = e.clientY - rect.top;
     const height = rect.height;
     
     // Root cannot have siblings via drag
     if (!targetNode.parentId) {
         setDropTargetId(id);
         setDropPosition('inside');
         return;
     }

     if (relY < height * 0.25) {
         setDropTargetId(id);
         setDropPosition('before');
     } else if (relY > height * 0.75) {
         setDropTargetId(id);
         setDropPosition('after');
     } else {
         setDropTargetId(id);
         setDropPosition('inside');
     }
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    // Panning Logic
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }

    // Drag Node Logic
    if (dragNodeId) {
        setCursorPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleGlobalMouseUp = () => {
    if (dragNodeId && dropTargetId && dropPosition) {
        moveNode(dragNodeId, dropTargetId, dropPosition);
    }
    
    setIsPanning(false);
    setDragNodeId(null);
    setDropTargetId(null);
    setDropPosition(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).tagName === 'svg' || (e.target as Element).id === 'canvas-bg') {
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
        setSelectedId(null); 
    }
  };

  // ---------------- End Drag & Drop Logic ----------------


  const handleZoomIn = () => setViewport(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 5) }));
  const handleZoomOut = () => setViewport(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.1) }));
  
  const handleResetView = useCallback(() => {
    const allNodes = Object.values(nodes) as MindMapNode[];
    const visibleNodes = allNodes.filter(node => {
        if (node.x === undefined || node.y === undefined) return false;
        let current = node;
        while (current.parentId) {
            const parent = nodes[current.parentId];
            if (!parent || !parent.isExpanded) return false;
            current = parent;
        }
        return true;
    });

    if (visibleNodes.length === 0) {
        setViewport({ x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 1 });
        return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    visibleNodes.forEach(node => {
        if (node.x === undefined || node.y === undefined) return;
        const x = node.x;
        const y = node.y;
        const nodeW = node.width || MAX_NODE_WIDTH;
        const nodeH = node.height || MIN_NODE_HEIGHT;
        
        if (x - nodeW / 2 < minX) minX = x - nodeW / 2;
        if (x + nodeW / 2 > maxX) maxX = x + nodeW / 2;
        if (y - nodeH / 2 < minY) minY = y - nodeH / 2;
        if (y + nodeH / 2 > maxY) maxY = y + nodeH / 2;
    });

    const padding = 80;
    const width = Math.max(maxX - minX, 100);
    const height = Math.max(maxY - minY, 100);
    
    const availableWidth = window.innerWidth - padding * 2;
    const availableHeight = window.innerHeight - padding * 2;
    
    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;
    
    let fitScale = Math.min(scaleX, scaleY);
    fitScale = Math.min(fitScale, 1.2); 
    fitScale = Math.max(fitScale, 0.2); 

    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    const newX = (window.innerWidth / 2) - (centerX * fitScale);
    const newY = (window.innerHeight / 2) - (centerY * fitScale);

    setViewport({ x: newX, y: newY, scale: fitScale });
  }, [nodes]);

  const styles = THEMES[theme];

  // Render Ghost Element
  const renderGhost = () => {
    if (!dragNodeId) return null;
    const node = nodes[dragNodeId];
    if (!node) return null;
    
    return (
        <div 
            className={`fixed pointer-events-none z-[100] px-3 py-2 rounded-lg shadow-xl border ${styles.bg} ${styles.text} opacity-90`}
            style={{ 
                left: cursorPos.x + 20, 
                top: cursorPos.y + 10,
                borderColor: 'currentColor',
                fontFamily: NODE_STYLES.fontFamily,
                fontSize: NODE_STYLES.fontSize,
                fontWeight: NODE_STYLES.fontWeight,
            }}
        >
            {node.text}
        </div>
    );
  };

  // Render Preview Connection Edge
  const renderPreviewEdge = () => {
      if (!dragNodeId || !dropTargetId || !dropPosition) return null;

      let sourceNodeId: string | null = null;
      if (dropPosition === 'inside') {
          sourceNodeId = dropTargetId;
      } else {
          // For before/after, connection comes from the parent
          const targetNode = nodes[dropTargetId];
          if (targetNode?.parentId) {
              sourceNodeId = targetNode.parentId;
          }
      }

      const sourceNode = sourceNodeId ? nodes[sourceNodeId] : null;
      if (!sourceNode) return null;

      // Transform cursor/ghost position to SVG coordinates
      // Target the "left-center" of where the ghost is floating
      const ghostX = cursorPos.x + 20; 
      const ghostY = cursorPos.y + 10 + 20; // +10 offset + ~20 half height
      
      const targetX = (ghostX - viewport.x) / viewport.scale;
      const targetY = (ghostY - viewport.y) / viewport.scale;

      return (
          <PreviewEdge 
              source={sourceNode}
              targetX={targetX}
              targetY={targetY}
              theme={theme}
          />
      );
  };

  return (
    <div 
      className={`w-screen h-screen overflow-hidden ${styles.bg} selection:bg-blue-500/30`}
      ref={containerRef}
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
      
      {renderGhost()}

      <div 
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleGlobalMouseMove}
        onMouseUp={handleGlobalMouseUp}
        onMouseLeave={handleGlobalMouseUp}
      >
        <svg 
            id="canvas-bg"
            className="w-full h-full block"
            xmlns="http://www.w3.org/2000/svg"
        >
          <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`}>
            {/* Standard Edges */}
            {(Object.values(nodes) as MindMapNode[]).map(node => node.parentId && nodes[node.parentId] && (
               nodes[node.parentId].isExpanded && (
                <MindMapEdge 
                    key={`edge-${node.id}`} 
                    source={nodes[node.parentId]} 
                    target={node} 
                    theme={theme}
                />
               )
            ))}

            {/* Preview Edge */}
            {renderPreviewEdge()}

            {/* Nodes */}
            {(Object.values(nodes) as MindMapNode[]).map(node => (
               (!node.parentId || (nodes[node.parentId] && nodes[node.parentId].isExpanded && nodes[node.parentId].x !== undefined)) && (
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
                    onMouseMove={dragNodeId ? handleNodeMouseMove : undefined}
                />
               )
            ))}
          </g>
        </svg>
      </div>

      <CanvasControls 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
      />
      <Instructions />
    </div>
  );
}

export default App;
