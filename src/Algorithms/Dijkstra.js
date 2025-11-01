// dijkstra.js
export function dijkstra(grid, start, goal) {
  const rows = grid.length, cols = grid[0].length;
  const dist = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const prev = Array.from({ length: rows }, () => Array(cols).fill(null));
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const pq = [[0, start.row, start.col]];

  dist[start.row][start.col] = 0;
  const visitedInOrder = [];

  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, r, c] = pq.shift();
    if (visited[r][c]) continue;
    visited[r][c] = true;
    visitedInOrder.push({ row: r, col: c });
    if (r === goal.row && c === goal.col) break;

    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].isWall && !visited[nr][nc]) {
        const weight = grid[nr][nc].weight || 1;
        const nd = d + weight;
        if (nd < dist[nr][nc]) {
          dist[nr][nc] = nd;
          prev[nr][nc] = { row: r, col: c };
          pq.push([nd, nr, nc]);
        }
      }
    }
  }

  const path = [];
  let cur = goal;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur.row][cur.col];
  }
  if (path[0]?.row !== start.row || path[0]?.col !== start.col) return { visitedInOrder, path: [] };
  return { visitedInOrder, path };
}