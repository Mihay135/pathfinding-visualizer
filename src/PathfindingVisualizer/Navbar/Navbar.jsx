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
  const weights = [1, 5, 10, 20];

  return (
    <nav className="navbar">
      {/* TOOLS */}
      <div className="nav-section">
        <div className="section-title-wrapper" title="Draw walls, start, goal, or erase">
          <h3 className="section-title">Tools</h3>
        </div>
        <div className="section-content">
          {['wall', 'erase', 'start', 'goal'].map(m => (
            <button
              key={m}
              className={`nav-btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
              title={
                m === 'wall' ? 'Draw impassable walls' :
                m === 'erase' ? 'Erase any cell' :
                m === 'start' ? 'Place start node' :
                'Place goal node'
              }
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* WEIGHTS */}
      <div className="nav-section">
        <div className="section-title-wrapper" title="Paint cell cost (affects pathfinding)">
          <h3 className="section-title">Weights</h3>
        </div>
        <div className="section-content">
          {weights.map(w => (
            <button
              key={w}
              className={`weight-btn ${mode === `weight-${w}` ? 'active' : ''}`}
              onClick={() => setMode(`weight-${w}`)}
              title={`Movement cost: ${w}`}
            >
              {w === 1 ? 'Path' : w}
            </button>
          ))}
        </div>
      </div>

      {/* SETTINGS */}
      <div className="nav-section">
        <div className="section-title-wrapper" title="Algorithm, speed, and display options">
          <h3 className="section-title">Settings</h3>
        </div>
        <div className="section-content">
          <select
            value={algorithm}
            onChange={e => setAlgorithm(e.target.value)}
            className="algo-select"
            title="Select pathfinding algorithm"
          >
            <optgroup label="Unweighted">
              <option value="bfs">BFS</option>
              <option value="bidirectional">Bidirectional BFS</option>
            </optgroup>
            <optgroup label="Weighted">
              <option value="dijkstra">Dijkstra</option>
              <option value="astar">A*</option>
              <option value="dfs">DFS (exploration)</option>
            </optgroup>
          </select>

          <label className="speed-label" title="Animation speed">
            Speed: <input type="range" min="1" max="100" value={speed} onChange={e => setSpeed(+e.target.value)} />
            <span>{speed}ms</span>
          </label>

          <label className="animate-label" title="Show maze generation steps">
            <input type="checkbox" checked={animateMaze} onChange={e => setAnimateMaze(e.target.checked)} />
            Animate Maze Generation
          </label>

          <label className="darkmode-label" title="Toggle dark theme">
            <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
            Dark Mode
          </label>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="nav-section">
        <div className="section-title-wrapper" title="Run, reset, or generate maze">
          <h3 className="section-title">Controls</h3>
        </div>
        <div className="section-content">
          <button className="run-btn" onClick={onRun} title="Start algorithm">Run</button>
          <button className="clear-btn" onClick={onClear} title="Clear grid">Clear</button>
          <button className="maze-btn" onClick={onGenerateMaze} title="Generate random maze">Generate Random Maze</button>
        </div>
      </div>
    </nav>
  );
}