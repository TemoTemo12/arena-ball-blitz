import { useRef, useState } from 'react';
import { useGameLoop } from '@/game/useGameLoop';
import { ArenaType, GameMode } from '@/game/types';

interface GameArenaProps {
  arenaType: ArenaType;
  mode: GameMode;
  onBackToMenu: () => void;
}

const GameArena = ({ arenaType, mode, onBackToMenu }: GameArenaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameStatus, scores, timeLeft, startGame } = useGameLoop(canvasRef);
  const [started, setStarted] = useState(false);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    startGame(arenaType, mode);
    setStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* HUD */}
      <div className="flex items-center justify-between w-full max-w-[1200px] px-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-primary" />
          <span className="font-display text-4xl font-bold text-primary">{scores[0]}</span>
          <span className="font-body text-sm text-muted-foreground">
            {mode === '1v1-ai' ? 'YOU' : 'P1'}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="font-display text-xs tracking-widest text-muted-foreground uppercase">
            {gameStatus === 'overtime' ? 'OVERTIME' : gameStatus === 'goal' ? 'GOAL!' : 
             gameStatus === 'freekick' ? 'FREE KICK' : gameStatus === 'penalty' ? 'PENALTY' : ''}
          </span>
          <span className="font-display text-3xl font-bold text-foreground tabular-nums">
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-body text-sm text-muted-foreground">
            {mode === '1v1-ai' ? 'AI' : 'P2'}
          </span>
          <span className="font-display text-4xl font-bold text-secondary">{scores[1]}</span>
          <div className="w-5 h-5 rounded-full bg-secondary" />
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border-2 border-border shadow-2xl">
        <canvas ref={canvasRef} className="block" />

        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm">
            <h2 className="font-display text-5xl font-black text-primary mb-2 tracking-wider"
                style={{ textShadow: '0 0 30px hsla(150, 80%, 50%, 0.4)' }}>
              MAMOBALL
            </h2>
            <p className="font-body text-muted-foreground mb-6 text-lg">
              {mode === '1v1-ai' ? 'VS AI' : 'Local 1v1'}
            </p>
            <button
              onClick={handleStart}
              className="font-display text-xl font-bold px-10 py-4 bg-primary text-primary-foreground rounded-xl hover:scale-105 transition-transform tracking-widest"
            >
              KICK OFF
            </button>
          </div>
        )}

        {gameStatus === 'finished' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm">
            <h2 className="font-display text-4xl font-black mb-1 tracking-wider" style={{
              color: scores[0] > scores[1] ? 'hsl(150, 80%, 50%)' : scores[1] > scores[0] ? 'hsl(200, 80%, 55%)' : 'hsl(35, 95%, 55%)'
            }}>
              {scores[0] > scores[1]
                ? (mode === '1v1-ai' ? 'YOU WIN!' : 'GREEN WINS!')
                : scores[1] > scores[0]
                  ? (mode === '1v1-ai' ? 'AI WINS!' : 'BLUE WINS!')
                  : 'DRAW!'}
            </h2>
            <p className="font-display text-6xl font-black text-foreground mb-8">
              {scores[0]} – {scores[1]}
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleStart}
                className="font-display text-lg font-bold px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:scale-105 transition-transform tracking-widest"
              >
                REMATCH
              </button>
              <button
                onClick={onBackToMenu}
                className="font-display text-lg font-bold px-8 py-3 bg-muted text-foreground rounded-xl hover:scale-105 transition-transform tracking-widest"
              >
                MENU
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between w-full max-w-[1200px] px-4">
        <button
          onClick={onBackToMenu}
          className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Menu
        </button>
        <div className="flex gap-6 font-body text-xs text-muted-foreground">
          <span><span className="text-primary">P1:</span> WASD · Space kick · E dash · Q curve · R power</span>
          {mode === '1v1-local' && (
            <span><span className="text-secondary">P2:</span> Arrows · . kick · , dash · ; curve · ' power</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameArena;
