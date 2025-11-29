
export const MAX_NODE_WIDTH = 400;
export const MIN_NODE_WIDTH = 50;
export const MIN_NODE_HEIGHT = 40;
export const HORIZONTAL_GAP = 60;
export const VERTICAL_SPACING = 20;
export const ANIMATION_DURATION = 0.3;

export const NODE_STYLES = {
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '1.5',
  padding: '8px 12px',
};

export const INITIAL_DATA = {
  rootId: 'root',
  nodes: {
    'root': {
      id: 'root',
      text: 'Central Topic',
      parentId: null,
      children: ['child-1', 'child-2', 'child-3'],
      isExpanded: true,
      depth: 0
    },
    'child-1': {
      id: 'child-1',
      text: 'Strategy',
      parentId: 'root',
      children: ['sub-1', 'sub-2'],
      isExpanded: true,
      depth: 1
    },
    'child-2': {
      id: 'child-2',
      text: 'Design',
      parentId: 'root',
      children: [],
      isExpanded: true,
      depth: 1
    },
    'child-3': {
      id: 'child-3',
      text: 'Development',
      parentId: 'root',
      children: ['sub-3'],
      isExpanded: true,
      depth: 1
    },
    'sub-1': {
      id: 'sub-1',
      text: 'Market Analysis',
      parentId: 'child-1',
      children: [],
      isExpanded: true,
      depth: 2
    },
    'sub-2': {
      id: 'sub-2',
      text: 'Goals 2024',
      parentId: 'child-1',
      children: [],
      isExpanded: true,
      depth: 2
    },
    'sub-3': {
      id: 'sub-3',
      text: 'React Stack',
      parentId: 'child-3',
      children: [],
      isExpanded: true,
      depth: 2
    },
  }
};
