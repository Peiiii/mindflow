import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMindMap } from './hooks/useMindMap';
import { MindMapNodeComponent } from './components/MindMapNode';
import { MindMapEdge } from './components/MindMapEdge';
import { Toolbar } from './components/Toolbar';
import { Instructions } from './components/Instructions';
import { CanvasControls } from './components/CanvasControls';
import { ThemeMode, THEMES, ViewportState, MindMapNode } from './types';

function App() {
  const {
    nodes,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    updateNodeText,
    addChild,
    addSibling,
    deleteNode,
    toggleCollapse,
    undo,
    redo,
    canUndo,
    canRedo
  } = useMindMap();

  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.DARK);
  const [viewport, setViewport] = useState<ViewportState>({ x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

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
          // Geometric navigation for Up/Down or Sibling navigation
          // Find closest node in visual direction
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
              if (direction === 'right') valid = dx > 10; // Fallback if no children

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

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on background (target is the svg itself)
    if ((e.target as Element).tagName === 'svg' || (e.target as Element).id === 'canvas-bg') {
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
        setSelectedId(null); // Deselect on background click
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Canvas Control Handlers
  const handleZoomIn = () => setViewport(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 5) }));
  const handleZoomOut = () => setViewport(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.1) }));
  const handleResetView = () => setViewport({ x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 1 });

  const styles = THEMES[theme];

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

      <div 
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
            id="canvas-bg"
            className="w-full h-full block"
            xmlns="http://www.w3.org/2000/svg"
        >
          <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`}>
            {/* Render Edges first so they are behind nodes */}
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

            {/* Render Nodes */}
            {(Object.values(nodes) as MindMapNode[]).map(node => (
               // Simple visibility check based on parent expansion
               (!node.parentId || (nodes[node.parentId] && nodes[node.parentId].isExpanded && nodes[node.parentId].x !== undefined)) && (
                <MindMapNodeComponent 
                    key={node.id}
                    node={node}
                    theme={theme}
                    isSelected={selectedId === node.id}
                    isEditing={editingId === node.id}
                    onSelect={setSelectedId}
                    onEditStart={setEditingId}
                    onEditEnd={(id, text) => {
                        updateNodeText(id, text);
                        setEditingId(null);
                    }}
                    onToggleCollapse={toggleCollapse}
                    onAddChild={addChild}
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