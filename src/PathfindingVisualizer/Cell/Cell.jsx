// Cell.jsx
import { memo } from 'react';
import './Cell.css';

function Cell({ id, isWall, isStart, isGoal, onActivate }) {
  return (
    <div
      className={`cell ${isWall ? 'wall' : ''} ${isStart ? 'start' : ''} ${isGoal ? 'goal' : ''}`}
      data-id={id}
      role="gridcell"
      aria-label={`Cell ${id}`}
      onMouseDown={onActivate}
      onMouseEnter={onActivate}
      onTouchStart={onActivate}
      onTouchMove={onActivate}
    >
      
    </div>
  );
}

export default memo(Cell);