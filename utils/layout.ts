import { MindMapData, MindMapNode } from '../types';
import { NODE_HEIGHT, VERTICAL_SPACING, HORIZONTAL_SPACING } from '../constants';

// We perform a tree traversal to calculate positions
// This is a simplified Reingold-Tilford algorithm adapted for Mind Maps (Horizontal Layout)

interface LayoutNode extends MindMapNode {
  subtreeHeight: number;
}

export const computeLayout = (data: MindMapData): Record<string, MindMapNode> => {
  const nodes = { ...data.nodes };
  
  // 1. Calculate subtree heights (Post-order traversal)
  const calculateHeight = (nodeId: string, depth: number): number => {
    const node = nodes[nodeId];
    node.depth = depth;

    if (!node.children || node.children.length === 0 || !node.isExpanded) {
      (node as LayoutNode).subtreeHeight = NODE_HEIGHT;
      return NODE_HEIGHT;
    }

    let totalHeight = 0;
    node.children.forEach(childId => {
      totalHeight += calculateHeight(childId, depth + 1);
    });

    // Add spacing between children
    totalHeight += (node.children.length - 1) * VERTICAL_SPACING;

    (node as LayoutNode).subtreeHeight = Math.max(NODE_HEIGHT, totalHeight);
    return (node as LayoutNode).subtreeHeight;
  };

  calculateHeight(data.rootId, 0);

  // 2. Assign Coordinates (Pre-order traversal)
  const assignCoordinates = (nodeId: string, x: number, y: number) => {
    const node = nodes[nodeId] as LayoutNode;
    
    node.x = x;
    node.y = y;

    if (!node.children || node.children.length === 0 || !node.isExpanded) return;

    let currentY = y - node.subtreeHeight / 2;

    node.children.forEach(childId => {
      const child = nodes[childId] as LayoutNode;
      const childHeight = child.subtreeHeight;
      const childY = currentY + childHeight / 2;
      
      assignCoordinates(childId, x + HORIZONTAL_SPACING, childY);
      
      currentY += childHeight + VERTICAL_SPACING;
    });
  };

  assignCoordinates(data.rootId, 0, 0);

  return nodes;
};
