// Algorithms/BFS.js
export function bfs(grid, start, goal) {
  const rows = grid.length, cols = grid[0].length;
  const queue = [{ row: start.row, col: start.col }];
  const parent = {};
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const visitedInOrder = [];

  visited[start.row][start.col] = true;
  parent[`${start.row}-${start.col}`] = null;

  while (queue.length) {
    const { row, col } = queue.shift();
    const id = `${row}-${col}`;
    visitedInOrder.push({ row, col });

    if (row === goal.row && col === goal.col) {
      const path = [];
      let cur = id;
      while (cur) {
        const [r, c] = cur.split('-').map(Number);
        path.unshift({ row: r, col: c });
        cur = parent[cur];
      }
      return { visitedInOrder, path };
    }

    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].isWall && !visited[nr][nc]) {
        const nid = `${nr}-${nc}`;
        visited[nr][nc] = true;
        parent[nid] = id;
        queue.push({ row: nr, col: nc });
      }
    }
  }

  return { visitedInOrder, path: [] };
}