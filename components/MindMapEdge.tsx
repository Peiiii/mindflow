
import React from 'react';
import { MindMapNode, ThemeMode, THEMES } from '../types';
import { MIN_NODE_WIDTH } from '../constants';

interface Props {
  source: MindMapNode;
  target: MindMapNode;
  theme: ThemeMode;
}

export const MindMapEdge: React.FC<Props> = ({ source, target, theme }) => {
  if (source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return null;

  const styles = THEMES[theme];

  // Bezier Calculation with dynamic widths
  const sourceWidth = source.width || MIN_NODE_WIDTH;
  const targetWidth = target.width || MIN_NODE_WIDTH;

  const startX = source.x + sourceWidth / 2;
  const startY = source.y;
  const endX = target.x - targetWidth / 2;
  const endY = target.y;

  const controlPointOffset = (endX - startX) / 2;
  
  const pathData = `
    M ${startX} ${startY}
    C ${startX + controlPointOffset} ${startY},
      ${endX - controlPointOffset} ${endY},
      ${endX} ${endY}
  `;

  return (
    <path
      d={pathData}
      fill="none"
      strokeWidth="2"
      className={`${styles.edge} transition-all duration-300 ease-in-out`}
    />
  );
};
