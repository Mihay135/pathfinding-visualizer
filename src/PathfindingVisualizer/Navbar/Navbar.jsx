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
      {/* PAINTING TOOLS */}
      <div className="nav-section">
        <div className='section-title-wrapper'>
          <h3 className="section-title">Painting Tools</h3>
        </div>
        <div className="section-content">
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
      </div>

      {/* WEIGHTED BRUSH */}
      <div className="nav-section">
        <div className='section-title-wrapper'>
          <h3 className="section-title">Weighted Brush</h3>
        </div>
        <div className="section-content">
          {weights.map(w => (
            <button
              key={w}
              className={`weight-btn ${mode === `weight-${w}` ? 'active' : ''}`}
              onClick={() => setMode(`weight-${w}`)}
            >
              {w === 1 ? 'Path' : w}
            </button>
          ))}
        </div>
      </div>

      {/* OPTIONS */}
      <div className="nav-section">
        <div className='section-title-wrapper'>
          <h3 className="section-title">Options</h3>
        </div>
        
        <div className="section-content">
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

          <label className="animate-label">
            <input type="checkbox" checked={animateMaze} onChange={e => setAnimateMaze(e.target.checked)} />
            Animate Maze
          </label>

          <label className="darkmode-label">
            <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
            Dark Mode
          </label>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="nav-section">
        <div className='section-title-wrapper'>
          <h3 className="section-title">Controls</h3>
        </div>
        
        <div className="section-content">
          <button className="maze-btn" onClick={onGenerateMaze}>Generate Maze</button>
          <button className="clear-btn" onClick={onClear}>Clear</button>
          <button className="run-btn" onClick={onRun}>Run</button>
        </div>
      </div>
    </nav>
  );
}