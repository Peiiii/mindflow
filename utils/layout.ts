
import { MindMapData, MindMapNode } from '../types';
import { 
  MAX_NODE_WIDTH,
  MIN_NODE_WIDTH,
  MIN_NODE_HEIGHT, 
  VERTICAL_SPACING, 
  HORIZONTAL_GAP,
  NODE_STYLES
} from '../constants';

interface LayoutNode extends MindMapNode {
  subtreeHeight: number;
}

// Hidden DOM element for accurate text measurement
let measureEl: HTMLDivElement | null = null;

const getMeasureElement = () => {
  if (!measureEl) {
    measureEl = document.createElement('div');
    measureEl.id = 'mindmap-measure-el';
    measureEl.style.position = 'absolute';
    measureEl.style.visibility = 'hidden';
    measureEl.style.top = '-9999px';
    measureEl.style.left = '-9999px';
    measureEl.style.width = 'auto';
    measureEl.style.height = 'auto';
    measureEl.style.whiteSpace = 'pre-wrap';
    measureEl.style.wordBreak = 'break-word';
    measureEl.style.overflowWrap = 'break-word';
    measureEl.style.boxSizing = 'border-box';
    
    // Apply shared styles
    measureEl.style.fontFamily = NODE_STYLES.fontFamily;
    measureEl.style.fontSize = NODE_STYLES.fontSize;
    measureEl.style.fontWeight = NODE_STYLES.fontWeight;
    measureEl.style.lineHeight = NODE_STYLES.lineHeight;
    measureEl.style.padding = NODE_STYLES.padding;
    
    document.body.appendChild(measureEl);
  }
  return measureEl;
};

const calculateNodeDimensions = (text: string) => {
  const el = getMeasureElement();
  
  // Constrain max width for natural flow measurement
  el.style.maxWidth = `${MAX_NODE_WIDTH}px`;
  el.style.width = 'fit-content';
  
  // Set text
  el.textContent = text || ' '; // Ensure empty string has height
  
  // Get dimensions
  const rect = el.getBoundingClientRect();
  
  // Calculate width: clamped between MIN and MAX
  // Add a small buffer to prevent wrapping issues due to sub-pixel rendering differences
  const naturalWidth = rect.width + 2; 
  const width = Math.max(Math.min(naturalWidth, MAX_NODE_WIDTH), MIN_NODE_WIDTH);
  
  // Enforce the calculated width to get the exact height at that width
  el.style.width = `${width}px`;
  
  // Re-measure height
  const height = Math.max(el.getBoundingClientRect().height, MIN_NODE_HEIGHT);
  
  return { width, height };
};

export const computeLayout = (data: MindMapData, drafts?: Record<string, string>): Record<string, MindMapNode> => {
  const nodes = { ...data.nodes };
  
  // Apply drafts if any
  if (drafts) {
    Object.entries(drafts).forEach(([id, text]) => {
      if (nodes[id]) {
        nodes[id] = { ...nodes[id], text };
      }
    });
  }
  
  // 1. Calculate subtree heights and Node Dimensions (Post-order traversal)
  const calculateHeight = (nodeId: string, depth: number): number => {
    const node = nodes[nodeId];
    if (!node) return 0;
    
    node.depth = depth;

    // Compute dynamic dimensions based on text content
    const { width, height } = calculateNodeDimensions(node.text);
    node.width = width;
    node.height = height;

    if (!node.children || node.children.length === 0 || !node.isExpanded) {
      (node as LayoutNode).subtreeHeight = height;
      return height;
    }

    let totalChildrenHeight = 0;
    node.children.forEach(childId => {
      totalChildrenHeight += calculateHeight(childId, depth + 1);
    });

    // Add spacing between children
    totalChildrenHeight += (node.children.length - 1) * VERTICAL_SPACING;

    // Subtree height is max of node's own height or its children's total height
    (node as LayoutNode).subtreeHeight = Math.max(height, totalChildrenHeight);
    return (node as LayoutNode).subtreeHeight;
  };

  calculateHeight(data.rootId, 0);

  // 2. Assign Coordinates (Pre-order traversal)
  const assignCoordinates = (nodeId: string, x: number, y: number) => {
    const node = nodes[nodeId] as LayoutNode;
    if (!node) return;
    
    node.x = x;
    node.y = y;

    if (!node.children || node.children.length === 0 || !node.isExpanded) return;

    let currentY = y - node.subtreeHeight / 2;

    node.children.forEach(childId => {
      const child = nodes[childId] as LayoutNode;
      const childHeight = child.subtreeHeight;
      
      // Center the child vertically within its allocated slot
      const childY = currentY + childHeight / 2;
      
      // Calculate X position dynamically based on parent and child widths
      const childX = x + (node.width! / 2) + HORIZONTAL_GAP + (child.width! / 2);
      
      assignCoordinates(childId, childX, childY);
      
      currentY += childHeight + VERTICAL_SPACING;
    });
  };

  assignCoordinates(data.rootId, 0, 0);

  return nodes;
};
