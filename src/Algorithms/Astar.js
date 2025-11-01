// astar.js
function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

export function astar(grid, start, goal) {
  const rows = grid.length, cols = grid[0].length;
  const openSet = [{ f: 0, g: 0, row: start.row, col: start.col }];
  const cameFrom = {};
  const gScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  gScore[start.row][start.col] = 0;
  const visitedInOrder = [];

  while (openSet.length) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    const { row, col } = current;

    if (row === goal.row && col === goal.col) {
      const path = [];
      let cur = current;
      while (cur) {
        path.unshift({ row: cur.row, col: cur.col });
        cur = cameFrom[`${cur.row}-${cur.col}`];
      }
      return { visitedInOrder, path };
    }

    visitedInOrder.push({ row, col });

    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].isWall) {
        const weight = grid[nr][nc].weight || 1;
        const tentativeG = gScore[row][col] + weight;
        if (tentativeG < gScore[nr][nc]) {
          cameFrom[`${nr}-${nc}`] = current;
          gScore[nr][nc] = tentativeG;
          const h = heuristic({ row: nr, col: nc }, goal);
          const f = tentativeG + h;
          openSet.push({ f, g: tentativeG, row: nr, col: nc });
        }
      }
    }
  }

  return { visitedInOrder, path: [] };
}