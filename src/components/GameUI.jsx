import { useEffect, useRef, useState } from 'react';
import { GameEngine, GAME_WIDTH, GAME_HEIGHT, TIERS } from '../game/GameEngine';
import './GameUI.css';

const HEARTFELT_MESSAGES = [
  "You make every day brighter! ☀️",
  "I love you to the stars and back! ✨",
  "You're my favorite person! ❤️",
  "Just a little reminder: you're amazing! 🌸",
  "My world is better with you in it! 🌍",
  "You're the best thing that ever happened to me! 💖",
  "Your smile is my favorite thing! 😊",
  "I'm so lucky to have you! 🍀"
];

const GameUI = ({ playerName }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [score, setScore] = useState(0);
  const [nextTier, setNextTier] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [canDrop, setCanDrop] = useState(true);
  
  // Visual effects state
  const [mergeEffects, setMergeEffects] = useState([]);
  const [specialMessage, setSpecialMessage] = useState(null);
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const handleMerge = (x, y, tier) => {
      const left = (x / GAME_WIDTH) * 100;
      const top = (y / GAME_HEIGHT) * 100;
      const id = Date.now() + Math.random();
      
      setMergeEffects(prev => [...prev, { id, left, top, color: TIERS[tier].color }]);
      
      setTimeout(() => {
        setMergeEffects(prev => prev.filter(effect => effect.id !== id));
      }, 600);
    };

    const handleWhiteOrb = () => {
      const randomMsg = HEARTFELT_MESSAGES[Math.floor(Math.random() * HEARTFELT_MESSAGES.length)];
      setSpecialMessage(randomMsg);
      setTimeout(() => setSpecialMessage(null), 4000);
    };

    const engine = new GameEngine(
      canvasRef.current,
      (newScore) => setScore(newScore),
      () => setGameOver(true),
      handleMerge,
      handleWhiteOrb
    );
    engineRef.current = engine;

    return () => {
      engine.stop();
    };
  }, []);

  // Save to leaderboard on game over
  useEffect(() => {
    if (gameOver) {
      const stored = JSON.parse(localStorage.getItem('cosmicMergeLeaderboard') || '[]');
      const newEntry = { name: playerName, score, id: Date.now() };
      
      // Add, sort descending, keep top 5
      const updated = [...stored, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
        
      localStorage.setItem('cosmicMergeLeaderboard', JSON.stringify(updated));
      setLeaderboard(updated);
    }
  }, [gameOver, playerName, score]);

  const handleDrop = (e) => {
    if (gameOver || !engineRef.current || !canDrop) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const scaleX = GAME_WIDTH / rect.width;
    const gameX = (clientX - rect.left) * scaleX;

    engineRef.current.dropOrb(gameX, nextTier);
    setNextTier(Math.floor(Math.random() * 3));

    setCanDrop(false);
    setTimeout(() => setCanDrop(true), 800);
  };

  const resetGame = () => {
    window.location.reload();
  };

  return (
    <div className="game-container">
      <div className="header">
        <div className="player-info">
          <span>{playerName}'s Score:</span>
          <div className="score-board">{score}</div>
        </div>
        <div className="next-orb-preview">
          <span>Next:</span>
          <div 
            className="orb-preview" 
            style={{ 
              backgroundColor: TIERS[nextTier].color,
              width: `${TIERS[nextTier].radius * 2}px`,
              height: `${TIERS[nextTier].radius * 2}px`,
              transform: 'scale(0.5)'
            }} 
          />
        </div>
      </div>
      
      <div className="canvas-wrapper" onPointerDown={handleDrop}>
        <canvas ref={canvasRef} className="game-canvas"></canvas>
        
        {/* Render merge pop effects */}
        {mergeEffects.map(effect => (
          <div 
            key={effect.id} 
            className="merge-effect"
            style={{
              left: `${effect.left}%`,
              top: `${effect.top}%`,
              boxShadow: `0 0 20px 10px ${effect.color}`
            }}
          >
            ✨
          </div>
        ))}

        {/* Render Special Heartfelt Message */}
        {specialMessage && (
          <div className="special-message-popup">
            <div className="heart-icon">❤️</div>
            <p>{specialMessage}</p>
          </div>
        )}
      </div>

      {gameOver && (
        <div className="game-over-overlay">
          <h2>Oh no!</h2>
          <p>Final Score: {score}</p>
          
          <div className="leaderboard">
            <h3>Leaderboard</h3>
            {leaderboard.map((entry, idx) => (
              <div key={entry.id} className={`leaderboard-entry ${entry.name === playerName && entry.score === score ? 'highlight' : ''}`}>
                <span>{idx + 1}. {entry.name}</span>
                <span>{entry.score}</span>
              </div>
            ))}
          </div>

          <button onClick={resetGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default GameUI;
