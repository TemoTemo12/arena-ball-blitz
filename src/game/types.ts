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
}

export interface Ball {
  pos: Vec2;
  vel: Vec2;
  radius: number;
}

export interface GameState {
  players: [Player, Player];
  ball: Ball;
  timeLeft: number;
  matchDuration: number;
  status: 'waiting' | 'playing' | 'goal' | 'finished' | 'overtime';
  lastScorer: 'A' | 'B' | null;
}

export interface ArenaConfig {
  width: number;
  height: number;
  goalWidth: number;
  goalDepth: number;
}

export const ARENA: ArenaConfig = {
  width: 900,
  height: 500,
  goalWidth: 130,
  goalDepth: 30,
};

export const MATCH_DURATION = 180; // 3 minutes

export const PLAYER_RADIUS = 18;
export const BALL_RADIUS = 12;
export const PLAYER_SPEED = 3.5;
export const SPRINT_SPEED = 5;
export const BALL_FRICTION = 0.985;
export const PLAYER_FRICTION = 0.88;
export const KICK_FORCE = 8;
export const MAX_STAMINA = 100;
export const STAMINA_DRAIN = 0.8;
export const STAMINA_REGEN = 0.3;
