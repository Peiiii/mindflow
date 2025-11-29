export type NodeId = string;

export interface Position {
  x: number;
  y: number;
}

export interface MindMapNode {
  id: NodeId;
  text: string;
  parentId: NodeId | null;
  children: NodeId[];
  isExpanded: boolean;
  // Computed properties for layout (not persisted)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  depth?: number;
}

export interface MindMapData {
  rootId: NodeId;
  nodes: Record<NodeId, MindMapNode>;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface HistoryState {
  past: MindMapData[];
  present: MindMapData;
  future: MindMapData[];
}

export enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  MIDNIGHT = 'MIDNIGHT'
}

export const THEMES = {
  [ThemeMode.LIGHT]: {
    bg: 'bg-slate-50',
    nodeBg: 'fill-white',
    text: 'text-slate-900',
    edge: 'stroke-slate-300',
    highlight: 'stroke-blue-500',
  },
  [ThemeMode.DARK]: {
    bg: 'bg-slate-900',
    nodeBg: 'fill-slate-800',
    text: 'text-slate-100',
    edge: 'stroke-slate-600',
    highlight: 'stroke-indigo-400',
  },
  [ThemeMode.MIDNIGHT]: {
    bg: 'bg-black',
    nodeBg: 'fill-zinc-900',
    text: 'text-zinc-200',
    edge: 'stroke-zinc-700',
    highlight: 'stroke-emerald-500',
  }
};
