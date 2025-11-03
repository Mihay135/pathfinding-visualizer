// src/PathfindingVisualizer/Cell/Cell.jsx
import { memo } from 'react';
import './Cell.css';

//Memo for cell caching
export default memo(function Cell({ 
  id, 
  isWall, 
  weight, 
  isStart, 
  isGoal, 
  isVisited, 
  isPath, 
  isCurrent, 
  onActivate 
}) {

  // isVisited is either: "id" or "id:side" (for bidirectional)
  let visitedId = null;
  let side = null;

  if (typeof isVisited === 'string') {
    if (isVisited.includes(':')) {
      [visitedId, side] = isVisited.split(':');
    } else {
      visitedId = isVisited;
    }
  }

  //Check if it's a cell the start side of goal side for the bidirectional algorithm
  const isStartSide = side === 'start';
  const isGoalSide = side === 'goal';

  //Render the cell with weight inside if 
  return (
    <div
      className={`
        cell
        ${isWall ? 'wall' : ''}
        ${isStart ? 'start' : ''}
        ${isGoal ? 'goal' : ''}
        ${visitedId && !isPath ? 'visited' : ''}
        ${isStartSide ? 'visited-start' : ''}
        ${isGoalSide ? 'visited-goal' : ''}
        ${isPath ? 'path' : ''}
        ${isCurrent ? 'current' : ''}
      `.trim()}
      data-id={id}
      style={weight && !isWall && !isStart && !isGoal ? { backgroundColor: `var(--weight-color-${weight})` } : {}}
      onMouseDown={onActivate}
      onMouseEnter={onActivate}
      onTouchStart={onActivate}
      onTouchMove={onActivate}
    >
      {weight >= 1 && weight}
    </div>
  );
});