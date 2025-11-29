export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 50;
export const HORIZONTAL_SPACING = 240;
export const VERTICAL_SPACING = 20;
export const ANIMATION_DURATION = 0.3;

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
