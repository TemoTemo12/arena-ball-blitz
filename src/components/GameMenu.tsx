import { useState } from 'react';
import { ArenaType, GameMode, ARENAS } from '@/game/types';

interface GameMenuProps {
  onStart: (arena: ArenaType, mode: GameMode) => void;
}

const MODES: { value: GameMode; label: string; desc: string }[] = [
  { value: '1v1-local', label: '1v1 LOCAL', desc: 'Two players, one keyboard' },
  { value: '1v1-ai', label: 'VS AI', desc: 'Play against the computer' },
];

const ARENA_LIST: { value: ArenaType; config: (typeof ARENAS)[ArenaType] }[] = [
  { value: 'classic', config: ARENAS.classic },
  { value: 'wide', config: ARENAS.wide },
  { value: 'futsal', config: ARENAS.futsal },
];

const GameMenu = ({ onStart }: GameMenuProps) => {
  const [selectedArena, setSelectedArena] = useState<ArenaType>('classic');
  const [selectedMode, setSelectedMode] = useState<GameMode>('1v1-ai');
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 font-body">
      {/* Title */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-6xl md:text-7xl font-black text-primary tracking-widest mb-2"
            style={{ textShadow: '0 0 40px hsla(150, 80%, 50%, 0.4)' }}>
          MAMOBALL
        </h1>
        <p className="text-muted-foreground text-lg tracking-wider">ARENA BALL GAME</p>
      </div>

      {/* Mode Selection */}
      <div className="mb-8 w-full max-w-md">
        <h2 className="font-display text-sm tracking-widest text-muted-foreground mb-3 text-center">GAME MODE</h2>
        <div className="flex gap-3">
          {MODES.map(mode => (
            <button
              key={mode.value}
              onClick={() => setSelectedMode(mode.value)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                selectedMode === mode.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              }`}
            >
              <span className={`font-display text-lg font-bold block ${
                selectedMode === mode.value ? 'text-primary' : 'text-foreground'
              }`}>
                {mode.label}
              </span>
              <span className="text-xs text-muted-foreground">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Arena Selection */}
      <div className="mb-8 w-full max-w-md">
        <h2 className="font-display text-sm tracking-widest text-muted-foreground mb-3 text-center">ARENA</h2>
        <div className="flex gap-3">
          {ARENA_LIST.map(({ value, config }) => (
            <button
              key={value}
              onClick={() => setSelectedArena(value)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                selectedArena === value
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              }`}
            >
              <span className={`font-display text-sm font-bold block ${
                selectedArena === value ? 'text-accent' : 'text-foreground'
              }`}>
                {config.name}
              </span>
              <span className="text-xs text-muted-foreground">{config.description}</span>
              <div className="mt-2 flex justify-center">
                <div
                  className="border border-border/50 rounded-sm"
                  style={{
                    width: config.width / 20,
                    height: config.height / 20,
                    backgroundColor: `hsla(${config.bgHue}, 25%, 14%, 0.8)`,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={() => onStart(selectedArena, selectedMode)}
        className="font-display text-xl font-black px-12 py-4 bg-primary text-primary-foreground rounded-xl hover:scale-105 transition-transform tracking-widest mb-6"
        style={{ boxShadow: '0 0 30px hsla(150, 80%, 50%, 0.3)' }}
      >
        START MATCH
      </button>

      {/* Controls Toggle */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors underline"
      >
        {showControls ? 'Hide controls' : 'Show controls'}
      </button>

      {showControls && (
        <div className="mt-4 bg-card border border-border rounded-xl p-6 w-full max-w-lg">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-display text-sm text-primary tracking-wider mb-3">PLAYER 1 (GREEN)</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">WASD</kbd> Move</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">Space</kbd> Kick</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">Shift</kbd> Sprint</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">E</kbd> Dash</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">Q</kbd> + Kick = Curve</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">R</kbd> + Kick = Power</p>
              </div>
            </div>
            <div>
              <h3 className="font-display text-sm text-secondary tracking-wider mb-3">PLAYER 2 (BLUE)</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">Arrows</kbd> Move</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">.</kbd> Kick</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">/</kbd> Sprint</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">,</kbd> Dash</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">;</kbd> + Kick = Curve</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">'</kbd> + Kick = Power</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <h3 className="font-display text-sm text-accent tracking-wider mb-2">SHOT TYPES</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><span className="text-foreground">Normal:</span> Standard kick toward ball direction</p>
              <p><span className="text-foreground">Curve:</span> Hold curve key + kick for spin</p>
              <p><span className="text-foreground">Power:</span> Hold power key + kick for maximum force</p>
              <p><span className="text-foreground">Knuckle:</span> Random wobble on power shots</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameMenu;
