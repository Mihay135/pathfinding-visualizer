// Navbar.jsx
import './Navbar.css';

export default function Navbar({
  mode, setMode,
  algorithm, setAlgorithm,
  speed, setSpeed,
  animateMaze, setAnimateMaze,
  darkMode, setDarkMode,
  onClear, onRun, onGenerateMaze
}) {
  return (
    <nav className="navbar">
      <div className="mode-group">
        {['wall', 'erase', 'start', 'goal'].map(m => (
          <button
            key={m}
            className={`nav-btn ${mode === m ? 'active' : ''}`}
            onClick={() => setMode(m)}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="control-group">
        <select value={algorithm} onChange={e => setAlgorithm(e.target.value)} className="algo-select">
          <option value="dijkstra">Dijkstra</option>
          <option value="astar">A*</option>
          <option value="dfs">DFS</option>
        </select>

        <label className="speed-label">
          Speed:
          <input type="range" min="1" max="100" value={speed} onChange={e => setSpeed(+e.target.value)} />
          <span>{speed}ms</span>
        </label>

        <label className="darkmode-label">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={e => setDarkMode(e.target.checked)}
          />
          Dark Mode
        </label>

        <label className="animate-label">
          <input
            type="checkbox"
            checked={animateMaze}
            onChange={e => setAnimateMaze(e.target.checked)}
          />
          Animate Maze Generation
        </label>

        <button className="maze-btn" onClick={onGenerateMaze}>Generate Random Maze</button>
        <button className="clear-btn" onClick={onClear}>Clear</button>
        <button className="run-btn" onClick={onRun}>Run</button>
      </div>
    </nav>
  );
}