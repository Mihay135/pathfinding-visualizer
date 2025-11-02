// Grid.jsx
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Cell from '../Cell/Cell.jsx';
import { dijkstra } from '../../Algorithms/Dijkstra';
import { astar } from '../../Algorithms/Astar';
import { dfs } from '../../Algorithms/DFS.js';
import './Grid.css';

const DEBOUNCE_MS = 50;

export default function Grid({ mode, algorithm, speed }) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const [cellSize, setCellSize] = useState(0);
  const [gap, setGap] = useState(0);

  const [wallCells, setWallCells] = useState(new Set());
  const [weightCells, setWeightCells] = useState(new Map());
  const [startCell, setStartCell] = useState(null);
  const [goalCell, setGoalCell] = useState(null);

  const [visitedCells, setVisitedCells] = useState(new Set());
  const [pathCells, setPathCells] = useState(new Set());
  const [currentCell, setCurrentCell] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [noPath, setNoPath] = useState(false);

  const css = useMemo(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      pad: parseFloat(s.getPropertyValue('--pad')) || 0,
      gap: parseFloat(s.getPropertyValue('--gap')) || 0,
      border: parseFloat(s.getPropertyValue('--border')) || 0,
      min: parseFloat(s.getPropertyValue('--min-cell')) || 30,
      max: parseFloat(s.getPropertyValue('--max-cell')) || 80,
    };
  }, []);

  const calculate = useCallback(() => {
    if (!wrapperRef.current) return { cols: 0, rows: 0, size: css.min };
    const w = wrapperRef.current.clientWidth - css.pad * 2 - css.border * 2;
    const h = wrapperRef.current.clientHeight - css.pad * 2 - css.border * 2;
    let best = { cols: 0, rows: 0, size: css.min };
    for (let s = css.max; s >= css.min; s--) {
      const c = Math.floor((w + css.gap) / (s + css.gap));
      const r = Math.floor((h + css.gap) / (s + css.gap));
      if (c > 0 && r > 0 && c * r > best.cols * best.rows) best = { cols: c, rows: r, size: s };
    }
    return best;
  }, [css]);

  const scheduleUpdate = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const { cols, rows, size } = calculate();
        setCols(cols); setRows(rows); setCellSize(size); setGap(css.gap);
        setWallCells(prev => filterOutOfBounds(prev, rows, cols));
        setWeightCells(prev => {
          const next = new Map();
          for (const [id, w] of prev) {
            const [r, c] = id.split('-').map(Number);
            if (r < rows && c < cols) next.set(id, w);
          }
          return next;
        });
        if (startCell && !isInBounds(startCell, rows, cols)) setStartCell(null);
        if (goalCell && !isInBounds(goalCell, rows, cols)) setGoalCell(null);
      });
    }, DEBOUNCE_MS);
  }, [calculate, css.gap]);

  useEffect(() => {
    scheduleUpdate();
    const ro = new ResizeObserver(scheduleUpdate);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [scheduleUpdate]);

  const isDragging = useRef(false);
  useEffect(() => {
    const up = () => { isDragging.current = false; };
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up); };
  }, []);

  const handleCellClick = useCallback((e) => {
    if (isRunning) return;
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    if (e.type === 'mousedown' || e.type === 'touchstart') isDragging.current = true;
    if (!isDragging.current) return;

    if (mode === 'wall') {
      setWallCells(prev => new Set(prev).add(id));
      setWeightCells(prev => { const n = new Map(prev); n.delete(id); return n; });
    }
    else if (mode.startsWith('weight-')) {
      const weight = parseInt(mode.split('-')[1]);
      setWeightCells(prev => new Map(prev).set(id, weight));
      setWallCells(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
    else if (mode === 'erase') {
      setWallCells(prev => { const n = new Set(prev); n.delete(id); return n; });
      setWeightCells(prev => { const n = new Map(prev); n.delete(id); return n; });
      if (startCell === id) setStartCell(null);
      if (goalCell === id) setGoalCell(null);
    }
    else if (mode === 'start') {
      setStartCell(id);
      setWallCells(prev => { const n = new Set(prev); n.delete(id); return n; });
      setWeightCells(prev => { const n = new Map(prev); n.delete(id); return n; });
    }
    else if (mode === 'goal') {
      setGoalCell(id);
      setWallCells(prev => { const n = new Set(prev); n.delete(id); return n; });
      setWeightCells(prev => { const n = new Map(prev); n.delete(id); return n; });
    }
  }, [mode, isRunning, startCell, goalCell]);

  const run = useCallback(() => {
    if (!startCell || !goalCell || isRunning) return;
    setIsRunning(true);
    setVisitedCells(new Set());
    setPathCells(new Set());
    setCurrentCell(null);
    setNoPath(false);

    const grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const id = `${r}-${c}`;
        return { isWall: wallCells.has(id), weight: weightCells.get(id) || 1 };
      })
    );

    const [sr, sc] = startCell.split('-').map(Number);
    const [gr, gc] = goalCell.split('-').map(Number);

    const algoFn = { dijkstra, astar, dfs }[algorithm];
    const { visitedInOrder, path } = algoFn(grid, { row: sr, col: sc }, { row: gr, col: gc });

    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i >= visitedInOrder.length) {
        clearInterval(intervalRef.current);
        setCurrentCell(null);
        if (path.length > 0) {
          let j = 0;
          const pathInt = setInterval(() => {
            if (j >= path.length) { clearInterval(pathInt); setIsRunning(false); return; }
            const cell = path[j];
            const id = `${cell.row}-${cell.col}`;
            const cellWeight = grid[cell.row][cell.col].weight;
            setPathCells(prev => new Set(prev).add(id));
            j++;
          }, speed);
        } else {
          setNoPath(true);
          setIsRunning(false);
        }
        return;
      }

      const cell = visitedInOrder[i];
     
      const id = `${cell.row}-${cell.col}`;
      const cellWeight = grid[cell.row][cell.col].weight;
      const visitDelay = speed * 0.7 * cellWeight;

      setCurrentCell(id);
      setTimeout(() => setVisitedCells(prev => new Set(prev).add(id)), visitDelay);
      i++;
    }, speed);
  }, [rows, cols, startCell, goalCell, wallCells, weightCells, algorithm, speed, isRunning]);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setVisitedCells(new Set());
    setPathCells(new Set());
    setCurrentCell(null);
    setNoPath(false);
    setWallCells(new Set());
    setWeightCells(new Map());
    setStartCell(null);
    setGoalCell(null);
  }, []);

  const generateMaze = useCallback((e) => {
    const animate = e.detail?.animate ?? true;
    if (isRunning || rows < 7 || cols < 7) return;
    clear();

    const cellRows = Math.floor((rows + 1) / 2);
    const cellCols = Math.floor((cols + 1) / 2);
    if (cellRows < 3 || cellCols < 3) return;

    const passageCells = new Set();
    for (let r = 0; r < rows; r += 2) {
      for (let c = 0; c < cols; c += 2) {
        if (r < rows && c < cols) passageCells.add(`${r}-${c}`);
      }
    }

    const parent = {}, rank = {};
    const find = (id) => parent[id] !== id ? (parent[id] = find(parent[id])) : id;
    const union = (a, b) => {
      const pa = find(a), pb = find(b);
      if (pa === pb) return false;
      if (rank[pa] < rank[pb]) parent[pa] = pb;
      else if (rank[pa] > rank[pb]) parent[pb] = pa;
      else { parent[pb] = pa; rank[pa]++; }
      return true;
    };

    for (const id of passageCells) { parent[id] = id; rank[id] = 0; }

    const walls = [];
    const dirs = [[0,1],[1,0]];
    for (let r = 0; r < cellRows; r++) {
      for (let c = 0; c < cellCols; c++) {
        const id = `${r*2}-${c*2}`;
        if (!passageCells.has(id)) continue;
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          const nid = `${nr*2}-${nc*2}`;
          if (passageCells.has(nid)) {
            const wallR = r*2 + dr, wallC = c*2 + dc;
            if (wallR < rows && wallC < cols) {
              walls.push({ id: `${wallR}-${wallC}`, a: id, b: nid });
            }
          }
        }
      }
    }

    for (let i = walls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [walls[i], walls[j]] = [walls[j], walls[i]];
    }

    const finalWalls = new Set();
    if (!animate) {
      for (const wall of walls) {
        if (find(wall.a) !== find(wall.b)) union(wall.a, wall.b);
        else finalWalls.add(wall.id);
      }
      for (let r = 0; r < rows; r++) { finalWalls.add(`${r}-0`); finalWalls.add(`${r}-${cols-1}`); }
      for (let c = 0; c < cols; c++) { finalWalls.add(`0-${c}`); finalWalls.add(`${rows-1}-${c}`); }
      finalWalls.delete('1-1'); finalWalls.delete(`${rows-2}-${cols-2}`);
      setWallCells(finalWalls);
      setStartCell('1-1'); setGoalCell(`${rows-2}-${cols-2}`);
      return;
    }

    let index = 0;
    const animateBuild = () => {
      if (index >= walls.length) {
        for (let r = 0; r < rows; r++) { finalWalls.add(`${r}-0`); finalWalls.add(`${r}-${cols-1}`); }
        for (let c = 0; c < cols; c++) { finalWalls.add(`0-${c}`); finalWalls.add(`${rows-1}-${c}`); }
        finalWalls.delete('1-1'); finalWalls.delete(`${rows-2}-${cols-2}`);
        setWallCells(finalWalls);
        setStartCell('1-1'); setGoalCell(`${rows-2}-${cols-2}`);
        return;
      }

      const wall = walls[index++];
      if (find(wall.a) !== find(wall.b)) union(wall.a, wall.b);
      else { finalWalls.add(wall.id); setWallCells(new Set(finalWalls)); }

      setTimeout(animateBuild, Math.max(1, speed / 3));
    };

    animateBuild();
  }, [rows, cols, isRunning, clear, speed]);

  useEffect(() => {
    const runHandler = () => run();
    const clearHandler = () => clear();
    const mazeHandler = (e) => generateMaze(e);

    window.addEventListener('run-pathfinding', runHandler);
    window.addEventListener('clear-pathfinding', clearHandler);
    window.addEventListener('generate-maze', mazeHandler);

    return () => {
      window.removeEventListener('run-pathfinding', runHandler);
      window.removeEventListener('clear-pathfinding', clearHandler);
      window.removeEventListener('generate-maze', mazeHandler);
    };
  }, [run, clear, generateMaze]);

  const cells = useMemo(() => {
    if (!cols || !rows) return null;
    const arr = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = `${r}-${c}`;
        const weight = weightCells.get(id);
        arr.push(
          <Cell
            key={id}
            id={id}
            isWall={wallCells.has(id)}
            weight={weight}
            isStart={startCell === id}
            isGoal={goalCell === id}
            isVisited={visitedCells.has(id)}
            isPath={pathCells.has(id)}
            isCurrent={currentCell === id}
            onActivate={handleCellClick}
          />
        );
      }
    }
    return arr;
  }, [rows, cols, wallCells, weightCells, startCell, goalCell, visitedCells, pathCells, currentCell, handleCellClick]);

  return (
    <div ref={wrapperRef} className="grid-wrapper">
      {noPath && (
        <div className="no-path-overlay" onClick={() => setNoPath(false)}>
          <div className="no-path-message" onClick={e => e.stopPropagation()}>
            <div className="no-path-title">No Path Found</div>
            <button className="no-path-close" onClick={() => setNoPath(false)}>Close</button>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="grid-container"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridAutoRows: `${cellSize}px`,
          gap: `${gap}px`,
          willChange: 'contents',
        }}
        role="grid"
      >
        {cells}
      </div>
    </div>
  );
}

function filterOutOfBounds(set, rows, cols) {
  const next = new Set();
  for (const id of set) {
    const [r, c] = id.split('-').map(Number);
    if (r >= 0 && r < rows && c >= 0 && c < cols) next.add(id);
  }
  return next;
}

function isInBounds(id, rows, cols) {
  const [r, c] = id.split('-').map(Number);
  return r >= 0 && r < rows && c >= 0 && c < cols;
}