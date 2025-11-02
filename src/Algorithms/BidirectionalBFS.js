// src/Algorithms/BidirectionalBFS.js
export function bidirectional(grid, start, goal) {
  const rows = grid.length, cols = grid[0].length;
  const queueStart = [{ row: start.row, col: start.col }];
  const queueGoal = [{ row: goal.row, col: goal.col }];
  const parentStart = {}, parentGoal = {};
  const visitedStart = Array.from({ length: rows }, () => Array(cols).fill(false));
  const visitedGoal = Array.from({ length: rows }, () => Array(cols).fill(false));
  const visitedInOrder = [];

  visitedStart[start.row][start.col] = true;
  visitedGoal[goal.row][goal.col] = true;
  parentStart[`${start.row}-${start.col}`] = null;
  parentGoal[`${goal.row}-${goal.col}`] = null;

  let intersection = null;

  while (queueStart.length && queueGoal.length && !intersection) {
    // Expand from start
    const currentStart = queueStart.shift();
    const idS = `${currentStart.row}-${currentStart.col}`;
    visitedInOrder.push({ ...currentStart, side: 'start' });

    if (visitedGoal[currentStart.row][currentStart.col]) {
      intersection = currentStart;
      break;
    }

    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = currentStart.row + dr, nc = currentStart.col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].isWall && !visitedStart[nr][nc]) {
        const nid = `${nr}-${nc}`;
        visitedStart[nr][nc] = true;
        parentStart[nid] = idS;
        queueStart.push({ row: nr, col: nc });
      }
    }

    // Expand from goal
    if (!intersection && queueGoal.length) {
      const currentGoal = queueGoal.shift();
      const idG = `${currentGoal.row}-${currentGoal.col}`;
      visitedInOrder.push({ ...currentGoal, side: 'goal' });

      if (visitedStart[currentGoal.row][currentGoal.col]) {
        intersection = currentGoal;
        break;
      }

      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = currentGoal.row + dr, nc = currentGoal.col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].isWall && !visitedGoal[nr][nc]) {
          const nid = `${nr}-${nc}`;
          visitedGoal[nr][nc] = true;
          parentGoal[nid] = idG;
          queueGoal.push({ row: nr, col: nc });
        }
      }
    }
  }

  if (!intersection) return { visitedInOrder, path: [] };

  const path = [];
  let cur = `${intersection.row}-${intersection.col}`;

  // Start → intersection
  while (cur) {
    const [r, c] = cur.split('-').map(Number);
    path.unshift({ row: r, col: c });
    cur = parentStart[cur];
  }

  // Goal → intersection (skip duplicate)
  cur = parentGoal[`${intersection.row}-${intersection.col}`];
  while (cur) {
    const [r, c] = cur.split('-').map(Number);
    path.push({ row: r, col: c });
    cur = parentGoal[cur];
  }

  return { visitedInOrder, path };
}