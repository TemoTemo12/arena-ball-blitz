import { useState } from 'react';
import GameMenu from '@/components/GameMenu';
import GameArena from '@/components/GameArena';
import { ArenaType, GameMode } from '@/game/types';

const Index = () => {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [arenaType, setArenaType] = useState<ArenaType>('classic');
  const [mode, setMode] = useState<GameMode>('1v1-ai');

  const handleStart = (arena: ArenaType, gameMode: GameMode) => {
    setArenaType(arena);
    setMode(gameMode);
    setScreen('game');
  };

  if (screen === 'game') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
        <GameArena arenaType={arenaType} mode={mode} onBackToMenu={() => setScreen('menu')} />
      </div>
    );
  }

  return <GameMenu onStart={handleStart} />;
};

export default Index;
