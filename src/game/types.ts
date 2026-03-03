export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  team: 'A' | 'B';
  score: number;
  sprinting: boolean;
  stamina: number;
  dashCooldown: number;
  dashActive: number;
  kickChargeStart: number | null;
  shotType: ShotType;
}

export interface Ball {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  spin: number; // lateral spin for curve
  wobble: number; // knuckle wobble timer
}

export type ShotType = 'normal' | 'curve' | 'power' | 'knuckle';

export type GameMode = '1v1-local' | '1v1-ai' | '2v2-local';
export type ArenaType = 'classic' | 'wide' | 'futsal';

export interface ArenaConfig {
  width: number;
  height: number;
  goalWidth: number;
  goalDepth: number;
  name: string;
  description: string;
  bgHue: number;
}

export const ARENAS: Record<ArenaType, ArenaConfig> = {
  classic: {
    width: 1100,
    height: 620,
    goalWidth: 160,
    goalDepth: 40,
    name: 'Classic Arena',
    description: 'Standard competitive pitch',
    bgHue: 220,
  },
  wide: {
    width: 1300,
    height: 560,
    goalWidth: 140,
    goalDepth: 40,
    name: 'Wide Stadium',
    description: 'Extra-wide for fast breaks',
    bgHue: 200,
  },
  futsal: {
    width: 900,
    height: 520,
    goalWidth: 180,
    goalDepth: 45,
    name: 'Futsal Court',
    description: 'Small pitch, big goals, chaos',
    bgHue: 160,
  },
};

export interface GameState {
  players: [Player, Player];
  ball: Ball;
  timeLeft: number;
  matchDuration: number;
  status: 'waiting' | 'playing' | 'goal' | 'finished' | 'overtime' | 'freekick' | 'penalty';
  lastScorer: 'A' | 'B' | null;
  arena: ArenaConfig;
  arenaType: ArenaType;
  mode: GameMode;
  foulTeam: 'A' | 'B' | null;
  setPiecePos: Vec2 | null;
}

export const MATCH_DURATION = 180;
export const PLAYER_RADIUS = 22;
export const BALL_RADIUS = 14;
export const PLAYER_SPEED = 4;
export const SPRINT_SPEED = 5.8;
export const DASH_SPEED = 14;
export const DASH_DURATION = 8; // frames
export const DASH_COOLDOWN = 90; // frames
export const BALL_FRICTION = 0.986;
export const PLAYER_FRICTION = 0.88;
export const KICK_FORCE = 9;
export const POWER_KICK_FORCE = 15;
export const CURVE_SPIN = 0.35;
export const KNUCKLE_WOBBLE = 0.6;
export const MAX_STAMINA = 100;
export const STAMINA_DRAIN = 0.8;
export const STAMINA_REGEN = 0.3;
export const MAX_KICK_CHARGE = 40; // frames for full power
