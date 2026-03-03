import { useRef } from 'react';
import { useGameLoop } from '@/game/useGameLoop';

const GameArena = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameStatus, scores, timeLeft, startGame } = useGameLoop(canvasRef);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* HUD */}
      <div className="flex items-center justify-between w-full max-w-[960px] px-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-primary" />
          <span className="font-display text-3xl font-bold text-primary">{scores[0]}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="font-display text-sm tracking-widest text-muted-foreground uppercase">
            {gameStatus === 'overtime' ? 'Overtime' : gameStatus === 'goal' ? 'Goal!' : ''}
          </span>
          <span className="font-display text-2xl font-bold text-foreground tabular-nums">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl font-bold text-secondary">{scores[1]}</span>
          <div className="w-4 h-4 rounded-full bg-secondary" />
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl">
        <canvas ref={canvasRef} className="block" />
        
        {/* Overlays */}
        {gameStatus === 'waiting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <h2 className="font-display text-4xl font-black text-primary mb-2 tracking-wider">MAMOBALL</h2>
            <p className="font-body text-muted-foreground mb-6 text-lg">Local 1v1 Arena</p>
            <button
              onClick={startGame}
              className="font-display text-lg font-bold px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity tracking-wider"
            >
              START MATCH
            </button>
          </div>
        )}
        
        {gameStatus === 'finished' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <h2 className="font-display text-3xl font-black mb-1 tracking-wider" style={{
              color: scores[0] > scores[1] ? 'hsl(150, 80%, 50%)' : scores[1] > scores[0] ? 'hsl(200, 80%, 55%)' : 'hsl(35, 95%, 55%)'
            }}>
              {scores[0] > scores[1] ? 'GREEN WINS!' : scores[1] > scores[0] ? 'BLUE WINS!' : 'DRAW!'}
            </h2>
            <p className="font-display text-5xl font-black text-foreground mb-6">
              {scores[0]} – {scores[1]}
            </p>
            <button
              onClick={startGame}
              className="font-display text-lg font-bold px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity tracking-wider"
            >
              REMATCH
            </button>
          </div>
        )}
      </div>

      {/* Controls guide */}
      <div className="flex gap-8 font-body text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-xs text-primary tracking-wider">GREEN</span>
          <span>WASD move · Shift sprint · Space kick</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-xs text-secondary tracking-wider">BLUE</span>
          <span>Arrows move · / sprint · . kick</span>
        </div>
      </div>
    </div>
  );
};

export default GameArena;
