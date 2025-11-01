// Algorithms/dfs.js
export function dfs(grid, start, goal) {
  const rows = grid.length, cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent = {};
  const visitedInOrder = [];
  const stack = [{ row: start.row, col: start.col }];

  while (stack.length) {
    const { row, col } = stack.pop();
    const id = `${row}-${col}`;
    if (visited[row][col]) continue;
    visited[row][col] = true;
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
        parent[nid] = id;
        stack.push({ row: nr, col: nc });
      }
    }
  }

  return { visitedInOrder, path: [] };
}