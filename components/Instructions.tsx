import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';

export const Instructions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="p-4 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 select-none animate-in fade-in slide-in-from-bottom-4 duration-200 origin-bottom-right">
          <h4 className="font-bold mb-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">Shortcuts</h4>
          <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <span>Select</span> <span className="text-slate-800 dark:text-slate-200 font-medium text-right">Click</span>
            <span>Edit</span> <span className="text-slate-800 dark:text-slate-200 font-medium text-right">Double Click / Space</span>
            <span>Add Child</span> <span className="text-slate-800 dark:text-slate-200 font-medium text-right">Tab</span>
            <span>Add Sibling</span> <span className="text-slate-800 dark:text-slate-200 font-medium text-right">Enter</span>
            <span>Delete</span> <span className="text-slate-800 dark:text-slate-200 font-medium text-right">Del / Backspace</span>
            <span>Navigation</span> <span className="text-slate-800 dark:text-slate-200 font-medium text-right">Arrows</span>
            <span>Pan</span> <span className="text-slate-800 dark:text-slate-200 font-medium text-right">Drag Canvas</span>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
            p-3 rounded-full shadow-lg border transition-all duration-300
            flex items-center justify-center
            ${isOpen 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rotate-90' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            }
        `}
        title={isOpen ? "Close Shortcuts" : "Show Shortcuts"}
      >
        {isOpen ? <X size={24} /> : <Keyboard size={24} />}
      </button>
    </div>
  );
};