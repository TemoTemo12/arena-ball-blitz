import { useEffect, useRef, useCallback, useState } from 'react';
import { GameState } from './types';
import { createInitialState, update, Keys } from './engine';
import { render } from './renderer';
import { ARENA } from './types';

const KEY_MAP_A: Record<string, keyof Keys> = {
  w: 'up', s: 'down', a: 'left', d: 'right', shift: 'sprint', ' ': 'kick',
};

const KEY_MAP_B: Record<string, keyof Keys> = {
  arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
  '/': 'sprint', '.': 'kick',
};

function emptyKeys(): Keys {
  return { up: false, down: false, left: false, right: false, sprint: false, kick: false };
}

export function useGameLoop(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const stateRef = useRef<GameState>(createInitialState());
  const keysARef = useRef<Keys>(emptyKeys());
  const keysBRef = useRef<Keys>(emptyKeys());
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [gameStatus, setGameStatus] = useState<GameState['status']>('waiting');
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [timeLeft, setTimeLeft] = useState(stateRef.current.matchDuration);

  const startGame = useCallback(() => {
    stateRef.current = createInitialState();
    stateRef.current.status = 'playing';
    setGameStatus('playing');
    setScores([0, 0]);
    setTimeLeft(stateRef.current.matchDuration);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in KEY_MAP_A) keysARef.current[KEY_MAP_A[key]] = true;
      if (key in KEY_MAP_B) keysBRef.current[KEY_MAP_B[key]] = true;
      // Prevent scrolling
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in KEY_MAP_A) keysARef.current[KEY_MAP_A[key]] = false;
      if (key in KEY_MAP_B) keysBRef.current[KEY_MAP_B[key]] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      const state = stateRef.current;
      update(state, keysARef.current, keysBRef.current, dt);
      
      // Update React state periodically
      setGameStatus(state.status);
      setScores([state.players[0].score, state.players[1].score]);
      setTimeLeft(Math.max(0, Math.ceil(state.timeLeft)));

      // Render
      const dpr = window.devicePixelRatio || 1;
      const totalWidth = ARENA.width + ARENA.goalDepth * 2;
      const containerWidth = canvas.parentElement?.clientWidth || totalWidth;
      const containerHeight = canvas.parentElement?.clientHeight || ARENA.height;
      const scale = Math.min(containerWidth / totalWidth, containerHeight / ARENA.height, 1.2);
      
      canvas.width = totalWidth * scale * dpr;
      canvas.height = ARENA.height * scale * dpr;
      canvas.style.width = `${totalWidth * scale}px`;
      canvas.style.height = `${ARENA.height * scale}px`;
      
      ctx.setTransform(dpr, 0, 0, dpr, ARENA.goalDepth * scale, 0);
      ctx.clearRect(-ARENA.goalDepth, 0, totalWidth, ARENA.height);
      
      render(ctx, state, scale);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [canvasRef]);

  return { gameStatus, scores, timeLeft, startGame };
}
