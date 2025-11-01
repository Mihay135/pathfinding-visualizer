// Navbar.jsx
import './Navbar.css';

export default function Navbar({ mode, setMode }) {
  const buttons = [
    { id: 'wall', label: 'Wall' },
    { id: 'erase', label: 'Eraser' },
    { id: 'start', label: 'Start' },
    { id: 'goal', label: 'Goal' },
  ];

  return (
    <nav className="navbar">
      {buttons.map(btn => (
        <button
          key={btn.id}
          className={`nav-btn ${mode === btn.id ? 'active' : ''}`}
          onClick={() => setMode(btn.id)}
        >
          {btn.label}
        </button>
      ))}
    </nav>
  );
}