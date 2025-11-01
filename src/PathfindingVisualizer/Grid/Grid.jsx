import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Cell from '../Cell/Cell.jsx';
import './Grid.css';

const DEBOUNCE_MS = 50;

export default function Grid({ mode }) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);

  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const [cellSize, setCellSize] = useState(0);
  const [gap, setGap] = useState(0);

  // Cell states
  const [wallCells, setWallCells] = useState(new Set());
  const [startCell, setStartCell] = useState(null); // "r-c" or null
  const [goalCell, setGoalCell] = useState(null);   // "r-c" or null

  // --- CSS vars ---
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

  // --- Layout ---
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

        // Clean up out‑of‑bounds cells
        setWallCells(prev => {
          const next = new Set();
          for (const id of prev) {
            const [r, c] = id.split('-').map(Number);
            if (r >= 0 && r < rows && c >= 0 && c < cols) next.add(id);
          }
          return next;
        });
        if (startCell) {
          const [r, c] = startCell.split('-').map(Number);
          if (r >= rows || c >= cols) setStartCell(null);
        }
        if (goalCell) {
          const [r, c] = goalCell.split('-').map(Number);
          if (r >= rows || c >= cols) setGoalCell(null);
        }
      });
    }, DEBOUNCE_MS);
  }, [calculate, css.gap]);

  useEffect(() => {
    scheduleUpdate();
    const ro = new ResizeObserver(scheduleUpdate);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [scheduleUpdate]);

  // --- Drag state ---
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

  // --- Cell click handler ---
  const handleCellClick = useCallback((e) => {
    const cell = e.currentTarget;
    const id = cell.dataset.id;
    if (!id) return;

    const isMouseDown = e.type === 'mousedown' || e.type === 'touchstart';
    if (isMouseDown) isDragging.current = true;
    if (!isDragging.current) return;

    if (mode === 'wall') {
      setWallCells(prev => new Set(prev).add(id));
    } else if (mode === 'erase') {
      setWallCells(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (startCell === id) setStartCell(null);
      if (goalCell === id) setGoalCell(null);
    } else if (mode === 'start') {
      setStartCell(id);
      // Remove if it was a wall
      setWallCells(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else if (mode === 'goal') {
      setGoalCell(id);
      setWallCells(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [mode, startCell, goalCell]);

  // --- Memoized cells ---
  const cells = useMemo(() => {
    if (!cols || !rows) return null;
    const arr = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = `${r}-${c}`;
        const isWall = wallCells.has(id);
        const isStart = startCell === id;
        const isGoal = goalCell === id;

        arr.push(
          <Cell
            key={id}
            id={id}
            isWall={isWall}
            isStart={isStart}
            isGoal={isGoal}
            onActivate={handleCellClick}
          />
        );
      }
    }
    return arr;
  }, [rows, cols, wallCells, startCell, goalCell, handleCellClick]);

  return (
    <div ref={wrapperRef} className="grid-wrapper">
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