import { useEffect, useRef, useCallback, useState } from 'react';
import { GameState, ArenaType, GameMode } from './types';
import { createInitialState, update, Keys } from './engine';
import { render } from './renderer';
import { getAIKeys } from './ai';
import { playSound } from './sound';

const KEY_MAP_A: Record<string, keyof Keys> = {
  w: 'up', s: 'down', a: 'left', d: 'right',
  shift: 'sprint', ' ': 'kick', e: 'dash',
  q: 'curveLeft', r: 'powerShot',
};

const KEY_MAP_B: Record<string, keyof Keys> = {
  arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
  '/': 'sprint', '.': 'kick', ',': 'dash',
  ';': 'curveLeft', "'": 'powerShot',
};

function emptyKeys(): Keys {
  return {
    up: false, down: false, left: false, right: false,
    sprint: false, kick: false, dash: false,
    curveLeft: false, curveRight: false, powerShot: false,
  };
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

  const startGame = useCallback((arenaType: ArenaType = 'classic', mode: GameMode = '1v1-local') => {
    stateRef.current = createInitialState(arenaType, mode);
    stateRef.current.status = 'playing';
    lastTimeRef.current = 0;
    setGameStatus('playing');
    setScores([0, 0]);
    setTimeLeft(stateRef.current.matchDuration);
    playSound('whistle');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in KEY_MAP_A) keysARef.current[KEY_MAP_A[key]] = true;
      if (key in KEY_MAP_B) keysBRef.current[KEY_MAP_B[key]] = true;
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

      // AI controls
      let keysB = keysBRef.current;
      if (state.mode === '1v1-ai' && (state.status === 'playing' || state.status === 'overtime')) {
        keysB = getAIKeys(state);
      }

      update(state, keysARef.current, keysB, dt);

      setGameStatus(state.status);
      setScores([state.players[0].score, state.players[1].score]);
      setTimeLeft(Math.max(0, Math.ceil(state.timeLeft)));

      const arena = state.arena;
      const dpr = window.devicePixelRatio || 1;
      const totalWidth = arena.width + arena.goalDepth * 2;
      const containerWidth = canvas.parentElement?.clientWidth || totalWidth;
      const containerHeight = canvas.parentElement?.clientHeight || arena.height;
      const scale = Math.min(containerWidth / totalWidth, containerHeight / arena.height, 1.4);

      canvas.width = totalWidth * scale * dpr;
      canvas.height = arena.height * scale * dpr;
      canvas.style.width = `${totalWidth * scale}px`;
      canvas.style.height = `${arena.height * scale}px`;

      ctx.setTransform(dpr, 0, 0, dpr, arena.goalDepth * scale, 0);
      ctx.clearRect(-arena.goalDepth, 0, totalWidth, arena.height);

      render(ctx, state, scale);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [canvasRef]);

  return { gameStatus, scores, timeLeft, startGame };
}
