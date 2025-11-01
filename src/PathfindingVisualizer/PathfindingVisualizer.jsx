// PathfindingVisualizer.jsx
import { useState, useEffect } from 'react';
import Navbar from './Navbar/Navbar.jsx';
import Grid from './Grid/Grid.jsx';
import './PathfindingVisualizer.css';

export default function PathfindingVisualizer() {
  const [mode, setMode] = useState('wall');
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [speed, setSpeed] = useState(30);
  const [animateMaze, setAnimateMaze] = useState(true);
  const [darkMode, setDarkMode] = useState(false); // OFF by default

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const handleClear = () => {
    window.dispatchEvent(new Event('clear-pathfinding'));
  };

  const handleRun = () => {
    window.dispatchEvent(new Event('run-pathfinding'));
  };

  const handleGenerateMaze = () => {
    window.dispatchEvent(new CustomEvent('generate-maze', { detail: { animate: animateMaze } }));
  };

  return (
    <div className="pathfinding-visualizer">
      <Navbar
        mode={mode} setMode={setMode}
        algorithm={algorithm} setAlgorithm={setAlgorithm}
        speed={speed} setSpeed={setSpeed}
        animateMaze={animateMaze} setAnimateMaze={setAnimateMaze}
        darkMode={darkMode} setDarkMode={setDarkMode}
        onClear={handleClear}
        onRun={handleRun}
        onGenerateMaze={handleGenerateMaze}
      />
      <Grid mode={mode} algorithm={algorithm} speed={speed} />
    </div>
  );
}