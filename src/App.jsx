import { useState } from 'react';
import GameUI from './components/GameUI';
import './StartScreen.css'; 

function App() {
  const [playerName, setPlayerName] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [nameInput, setNameInput] = useState('');
  
  const leaderboard = JSON.parse(localStorage.getItem('cosmicMergeLeaderboard') || '[]');

  const handleStart = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
      setIsStarted(true);
    }
  };

  if (isStarted) {
    return <GameUI playerName={playerName} />;
  }

  return (
    <div className="start-screen-container">
      <div className="start-card">
        <h1>Cosmic Merge ✨</h1>
        <p>A special surprise puzzle just for you!</p>
        <form onSubmit={handleStart}>
          <input 
            type="text" 
            placeholder="Enter your cute name..." 
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            autoFocus
            required
          />
          <button type="submit">Play Now 💖</button>
        </form>

        {leaderboard.length > 0 && (
          <div className="start-leaderboard">
            <h3>Top Players 🌟</h3>
            {leaderboard.map((entry, idx) => (
              <div key={entry.id} className="start-leaderboard-entry">
                <span>{idx + 1}. {entry.name}</span>
                <span>{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
