import React from 'react';
import { Undo, Redo, Plus, Trash2, Sun, Moon, Zap } from 'lucide-react';
import { ThemeMode } from '../types';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAdd: () => void;
  onDelete: () => void;
  currentTheme: ThemeMode;
  onSetTheme: (t: ThemeMode) => void;
}

export const Toolbar: React.FC<Props> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAdd,
  onDelete,
  currentTheme,
  onSetTheme
}) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700">
      
      <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
        <button
          onClick={onAdd}
          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
          title="Add Child (Tab)"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
          title="Delete Node (Del)"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 pl-2">
         <button
            onClick={() => onSetTheme(ThemeMode.LIGHT)}
            className={`p-2 rounded-lg transition-colors ${currentTheme === ThemeMode.LIGHT ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
         >
             <Sun size={16} className="text-amber-500" />
         </button>
         <button
            onClick={() => onSetTheme(ThemeMode.DARK)}
            className={`p-2 rounded-lg transition-colors ${currentTheme === ThemeMode.DARK ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
         >
             <Moon size={16} className="text-indigo-400" />
         </button>
         <button
            onClick={() => onSetTheme(ThemeMode.MIDNIGHT)}
            className={`p-2 rounded-lg transition-colors ${currentTheme === ThemeMode.MIDNIGHT ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
         >
             <Zap size={16} className="text-emerald-500" />
         </button>
      </div>
    </div>
  );
};
