import React from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const CanvasControls: React.FC<Props> = ({ onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      <div className="flex flex-col rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
          onClick={onZoomIn}
          className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border-b border-slate-200 dark:border-slate-700 active:bg-slate-200 dark:active:bg-slate-600"
          title="Zoom In"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={onZoomOut}
          className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border-b border-slate-200 dark:border-slate-700 active:bg-slate-200 dark:active:bg-slate-600"
          title="Zoom Out"
        >
          <Minus size={20} />
        </button>
        <button
          onClick={onReset}
          className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors active:bg-slate-200 dark:active:bg-slate-600"
          title="Reset View"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};