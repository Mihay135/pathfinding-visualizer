// src/PathfindingVisualizer/Grid/Grid.jsx
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Cell from '../Cell/Cell.jsx';
import { dijkstra } from '../../Algorithms/Dijkstra';
import { astar } from '../../Algorithms/Astar';
import { bfs } from '../../Algorithms/BFS';
import { dfs } from '../../Algorithms/DFS.js';
import { bidirectional } from '../../Algorithms/BidirectionalBFS';
import './Grid.css';

const DEBOUNCE_MS = 40;

export default function Grid({ mode, algorithm, speed }) {
  //Initial setup and hooks
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
  const [bidirectionalVisited, setBidirectionalVisited] = useState(new Set());
  const [pathCells, setPathCells] = useState(new Set());
  const [currentCell, setCurrentCell] = useState(null);
  const [isAnimationRunning, setIsAnimationRunning] = useState(false);
  const [noPath, setNoPath] = useState(false);

  //Initial css values cached
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

  //Cache function to update number of cells and their css in the grid based on screen zoom size
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

  //Grid resize and cells update scheduler
  const scheduleUpdate = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const { cols, rows, size } = calculate();
        setCols(cols);
        setRows(rows);
        setCellSize(size);
        setGap(css.gap);
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

  //Resize Observer on screen resize
  useEffect(() => {
    scheduleUpdate();
    const ro = new ResizeObserver(scheduleUpdate);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [scheduleUpdate]);

  //Enable Click-and-drag to draw on the grid
  const isDragging = useRef(false);
  useEffect(() => {
    const up = () => { isDragging.current = false; };
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, []);

  //Handle Cell type placing on click or drag
  const handleCellClick = useCallback((e) => {
    if (isAnimationRunning) return;
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
  }, [mode, isAnimationRunning, startCell, goalCell]);

  //Run the animation of the algorithm
  const run = useCallback(() => {
    //don't play animation if there's no start or goal cell of if the animation is running
    if (!startCell || !goalCell || isAnimationRunning) return;
    //prepare for new animation
    setIsAnimationRunning(true);
    setVisitedCells(new Set());
    setBidirectionalVisited(new Set());
    setPathCells(new Set());
    setCurrentCell(null);
    setNoPath(false);
    
    //Prepare array by converting the UI state into an 2d array of cells with walls and weighted cells
    const grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const id = `${r}-${c}`;
        return { isWall: wallCells.has(id), weight: weightCells.get(id) || 1 };
      })
    );

    //get rows and cols of start and goal cells
    const [sr, sc] = startCell.split('-').map(Number);
    const [gr, gc] = goalCell.split('-').map(Number);

    //Get the chosen algorithm and run it once to get order visit and shortest path
    const algoFn = { dijkstra, astar, bfs, dfs, bidirectional }[algorithm];
    const { visitedInOrder, path } = algoFn(grid, { row: sr, col: sc }, { row: gr, col: gc });

    //Animation start
    let i = 0;
    intervalRef.current = setInterval(() => {

      //Animate visited cells
      if (i >= visitedInOrder.length) {
        clearInterval(intervalRef.current);
        setCurrentCell(null);

        //Animate path cells to goal if it is found
        if (path.length > 0) {
          let j = 0;
          const pathInt = setInterval(() => {
            if (j >= path.length) {
              clearInterval(pathInt);
              setIsAnimationRunning(false);
              return;
            }
            const cell = path[j];
            const id = `${cell.row}-${cell.col}`;
            setPathCells(prev => new Set(prev).add(id));
            j++;
          }, speed);
        } else {
          setNoPath(true); //Show no path overlay
          setIsAnimationRunning(false);
        }
        return;
      }

      //Highlight current cell being explored (core animation step)
      const cell = visitedInOrder[i];
      const id = `${cell.row}-${cell.col}`;
      const isBidirectional = algorithm === 'bidirectional';

      //For bidirectional we need to keep track if the animated cell is from the start or goal side
      if (isBidirectional) {
        setBidirectionalVisited(prev => new Set(prev).add(`${id}:${cell.side}`));
      } else {
        setVisitedCells(prev => new Set(prev).add(id));
      }

      setCurrentCell(id);
      i++;
    }, speed);
  }, [rows, cols, startCell, goalCell, wallCells, weightCells, algorithm, speed, isAnimationRunning]);

  //Clear the grid cells and animation if it is running
  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimationRunning(false);
    setVisitedCells(new Set());
    setBidirectionalVisited(new Set());
    setPathCells(new Set());
    setCurrentCell(null);
    setNoPath(false);
    setWallCells(new Set());
    setWeightCells(new Map());
    setStartCell(null);
    setGoalCell(null);
  }, []);

  //Generate a random maze with or without animation
  const generateMaze = useCallback((e) => {
    const animate = e.detail?.animate ?? true; //checks if maze generation animation is checked (it is by default) 
    if (isAnimationRunning || rows < 5 || cols < 5) return; //doesn't generate maze if the grid is very small
    clear(); //resets grid if it had any elements placed

    //considers wall cells only those of odd index
    const cellRows = Math.floor((rows + 1) / 2);
    const cellCols = Math.floor((cols + 1) / 2);
    if (cellRows < 3 || cellCols < 3) return;

    //open cells every even row/col
    const passageCells = new Set();
    for (let r = 0; r < rows; r += 2) {
      for (let c = 0; c < cols; c += 2) {
        if (r < rows && c < cols) passageCells.add(`${r}-${c}`);
      }
    }

    //Prevent cycles in the maze by using Union-Find (DSU) with path compression and union by rank
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

    //initialize each passage cell as its own "set"
    for (const id of passageCells) { parent[id] = id; rank[id] = 0; }

    //build a list of possible walls between adjacent passage cells only on right and down direction to avoid duplicates
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

    //shuffle walls to get a random maze
    for (let i = walls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [walls[i], walls[j]] = [walls[j], walls[i]];
    }

    const finalWalls = new Set();

    //if animation is not selected build the maze instantly
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

      const weightOptions = [5, 10, 20];
      const weightChance = 0.45; // 15% of passage cells get weight
      const newWeightCells = new Map();

      for (const passageId of passageCells) {
        if (Math.random() < weightChance) {
          const weight = weightOptions[Math.floor(Math.random() * weightOptions.length)];
          newWeightCells.set(passageId, weight);
        }
      }

      setWeightCells(newWeightCells);
      return;
    }

    //Animate the maze generation build process
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
  }, [rows, cols, isAnimationRunning, clear, speed]);

  //Run, clear and Generate maze buttons event listeners 
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

  //Cache the grid of cells to avoid re-rendering each animation frame
  const cells = useMemo(() => {
    if (!cols || !rows) return null;
    const arr = [];
    //Loop on the cells of the grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = `${r}-${c}`;
        const weight = weightCells.get(id);

        let isVisited = null;
        if (algorithm === 'bidirectional') {
          for (const entry of bidirectionalVisited) {
            const [vid, side] = entry.split(':');
            if (vid === id) {
              isVisited = entry;
              break;
            }
          }
        } else if (visitedCells.has(id)) {
          isVisited = id;
        }

        //Create the cell with all the props needed
        arr.push(
          <Cell
            key={id}
            id={id}
            isWall={wallCells.has(id)}
            weight={weight}
            isStart={startCell === id}
            isGoal={goalCell === id}
            isVisited={isVisited}
            isPath={pathCells.has(id)}
            isCurrent={currentCell === id}
            onActivate={handleCellClick}
          />
        );
      }
    }
    return arr;
  }, [//Dependencies
    rows, cols, wallCells, weightCells, startCell, goalCell,
    visitedCells, pathCells, currentCell, handleCellClick,
    algorithm, bidirectionalVisited
  ]);

  //Render grid and the no-path hidden overlay
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

//Filter cells' IDs that are out of the screen
function filterOutOfBounds(set, rows, cols) {
  const next = new Set();
  for (const id of set) {
    const [r, c] = id.split('-').map(Number);
    if (r >= 0 && r < rows && c >= 0 && c < cols) next.add(id);
  }
  return next;
}

//Checks if a cell is withind the boundries of the screen
function isInBounds(id, rows, cols) {
  const [r, c] = id.split('-').map(Number);
  return r >= 0 && r < rows && c >= 0 && c < cols;
}