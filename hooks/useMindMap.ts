
import { useState, useCallback, useMemo } from 'react';
import { MindMapData, MindMapNode, NodeId, HistoryState } from '../types';
import { INITIAL_DATA } from '../constants';
import { computeLayout } from '../utils/layout';

export const useMindMap = () => {
  // History Management
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: { rootId: INITIAL_DATA.rootId, nodes: INITIAL_DATA.nodes },
    future: []
  });

  const [selectedId, setSelectedId] = useState<NodeId | null>(null);
  const [editingId, setEditingId] = useState<NodeId | null>(null);
  const [drafts, setDrafts] = useState<Record<NodeId, string>>({});

  // Compute layout whenever the tree structure changes or drafts change
  const layoutNodes = useMemo(() => {
    return computeLayout(history.present, drafts);
  }, [history.present, drafts]);

  const pushState = useCallback((newData: MindMapData) => {
    setHistory(curr => ({
      past: [...curr.past, curr.present],
      present: newData,
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(curr => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(curr => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  // Operations
  const updateNodeText = useCallback((id: NodeId, text: string) => {
    const newNodes = { ...history.present.nodes };
    if (newNodes[id]) {
      newNodes[id] = { ...newNodes[id], text };
      pushState({ ...history.present, nodes: newNodes });
    }
  }, [history.present, pushState]);

  const updateDraft = useCallback((id: NodeId, text: string | null) => {
    setDrafts(prev => {
        if (text === null) {
            const next = { ...prev };
            delete next[id];
            return next;
        }
        return { ...prev, [id]: text };
    });
  }, []);

  const toggleCollapse = useCallback((id: NodeId) => {
    const newNodes = { ...history.present.nodes };
    if (newNodes[id]) {
        // Toggle
        newNodes[id] = { ...newNodes[id], isExpanded: !newNodes[id].isExpanded };
        pushState({ ...history.present, nodes: newNodes });
    }
  }, [history.present, pushState]);

  const addChild = useCallback((parentId: NodeId) => {
    const id = `node-${Date.now()}`;
    const newNode: MindMapNode = {
      id,
      text: 'New Idea',
      parentId,
      children: [],
      isExpanded: true,
      depth: 0 // Will be recalculated
    };

    const newNodes = { ...history.present.nodes };
    newNodes[id] = newNode;
    newNodes[parentId] = {
      ...newNodes[parentId],
      children: [...newNodes[parentId].children, id],
      isExpanded: true // Auto expand parent
    };

    pushState({ ...history.present, nodes: newNodes });
    setSelectedId(id);
    setEditingId(id);
  }, [history.present, pushState]);

  const addSibling = useCallback((referenceId: NodeId) => {
    const refNode = history.present.nodes[referenceId];
    if (!refNode.parentId) return; // Cannot add sibling to root

    const parentId = refNode.parentId;
    const id = `node-${Date.now()}`;
    const newNode: MindMapNode = {
      id,
      text: 'New Idea',
      parentId,
      children: [],
      isExpanded: true,
      depth: 0
    };

    const newNodes = { ...history.present.nodes };
    newNodes[id] = newNode;
    
    // Insert after current sibling
    const parent = newNodes[parentId];
    const index = parent.children.indexOf(referenceId);
    const newChildren = [...parent.children];
    newChildren.splice(index + 1, 0, id);
    
    newNodes[parentId] = { ...parent, children: newChildren };

    pushState({ ...history.present, nodes: newNodes });
    setSelectedId(id);
    setEditingId(id);
  }, [history.present, pushState]);

  const deleteNode = useCallback((id: NodeId) => {
    const node = history.present.nodes[id];
    if (!node.parentId) return; // Cannot delete root

    const newNodes = { ...history.present.nodes };
    const parentId = node.parentId;
    
    // Remove from parent's children list
    newNodes[parentId] = {
      ...newNodes[parentId],
      children: newNodes[parentId].children.filter(childId => childId !== id)
    };

    // Recursively delete children (simple approach: just remove references, GC handles rest or cleanup later)
    // For a cleaner approach, strictly we should remove keys, but keeping it simple for now.
    delete newNodes[id];

    pushState({ ...history.present, nodes: newNodes });
    setSelectedId(parentId);
  }, [history.present, pushState]);

  return {
    nodes: layoutNodes,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    updateNodeText,
    updateDraft,
    addChild,
    addSibling,
    deleteNode,
    toggleCollapse,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
};
