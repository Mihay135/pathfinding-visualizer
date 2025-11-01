// Cell.jsx
import { memo } from 'react';
import './Cell.css';

export default function Cell({ id, isWall, weight, isStart, isGoal, isVisited, isPath, isCurrent, onActivate }) {
  return (
    <div
      className={`cell ${isWall ? 'wall' : ''} ${isStart ? 'start' : ''} ${isGoal ? 'goal' : ''} ${isVisited ? 'visited' : ''} ${isPath ? 'path' : ''} ${isCurrent ? 'current' : ''}`}
      data-id={id}
      style={weight && !isWall && !isStart && !isGoal ? { backgroundColor: `var(--weight-color-${weight})` } : {}}
      onMouseDown={onActivate}
      onMouseEnter={onActivate}
      onTouchStart={onActivate}
      onTouchMove={onActivate}
    >
      {weight && weight > 1 && ! {weight}}
    </div>
  );
}