import {
  GameState, Ball, Player, Vec2, ARENA,
  PLAYER_RADIUS, BALL_RADIUS, PLAYER_SPEED, SPRINT_SPEED,
  BALL_FRICTION, PLAYER_FRICTION, KICK_FORCE,
  MAX_STAMINA, STAMINA_DRAIN, STAMINA_REGEN, MATCH_DURATION,
} from './types';

export interface Keys {
  up: boolean; down: boolean; left: boolean; right: boolean; sprint: boolean; kick: boolean;
}

export function createInitialState(): GameState {
  return {
    players: [createPlayer('A'), createPlayer('B')],
    ball: createBall(),
    timeLeft: MATCH_DURATION,
    matchDuration: MATCH_DURATION,
    status: 'waiting',
    lastScorer: null,
  };
}

function createPlayer(team: 'A' | 'B'): Player {
  const x = team === 'A' ? ARENA.width * 0.25 : ARENA.width * 0.75;
  return {
    pos: { x, y: ARENA.height / 2 },
    vel: { x: 0, y: 0 },
    radius: PLAYER_RADIUS,
    team,
    score: 0,
    sprinting: false,
    stamina: MAX_STAMINA,
  };
}

function createBall(): Ball {
  return {
    pos: { x: ARENA.width / 2, y: ARENA.height / 2 },
    vel: { x: 0, y: 0 },
    radius: BALL_RADIUS,
  };
}

export function resetPositions(state: GameState) {
  state.players[0].pos = { x: ARENA.width * 0.25, y: ARENA.height / 2 };
  state.players[1].pos = { x: ARENA.width * 0.75, y: ARENA.height / 2 };
  state.players[0].vel = { x: 0, y: 0 };
  state.players[1].vel = { x: 0, y: 0 };
  state.ball = createBall();
}

function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x ** 2 + v.y ** 2);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function handlePlayerInput(player: Player, keys: Keys) {
  const speed = player.sprinting && player.stamina > 0 ? SPRINT_SPEED : PLAYER_SPEED;
  
  if (keys.up) player.vel.y -= speed * 0.3;
  if (keys.down) player.vel.y += speed * 0.3;
  if (keys.left) player.vel.x -= speed * 0.3;
  if (keys.right) player.vel.x += speed * 0.3;
  
  player.sprinting = keys.sprint;
  if (player.sprinting && (keys.up || keys.down || keys.left || keys.right)) {
    player.stamina = Math.max(0, player.stamina - STAMINA_DRAIN);
  } else {
    player.stamina = Math.min(MAX_STAMINA, player.stamina + STAMINA_REGEN);
  }
}

function handlePlayerBallCollision(player: Player, ball: Ball, kick: boolean) {
  const d = dist(player.pos, ball.pos);
  const minDist = player.radius + ball.radius;
  
  if (d < minDist) {
    const dir = normalize({ x: ball.pos.x - player.pos.x, y: ball.pos.y - player.pos.y });
    // Separate
    const overlap = minDist - d;
    ball.pos.x += dir.x * overlap;
    ball.pos.y += dir.y * overlap;
    
    // Transfer velocity
    const force = kick ? KICK_FORCE : 3;
    ball.vel.x = dir.x * force + player.vel.x * 0.5;
    ball.vel.y = dir.y * force + player.vel.y * 0.5;
  }
}

function handlePlayerPlayerCollision(a: Player, b: Player) {
  const d = dist(a.pos, b.pos);
  const minDist = a.radius + b.radius;
  if (d < minDist && d > 0) {
    const dir = normalize({ x: b.pos.x - a.pos.x, y: b.pos.y - a.pos.y });
    const overlap = (minDist - d) / 2;
    a.pos.x -= dir.x * overlap;
    a.pos.y -= dir.y * overlap;
    b.pos.x += dir.x * overlap;
    b.pos.y += dir.y * overlap;
    // Bounce
    const relVel = { x: a.vel.x - b.vel.x, y: a.vel.y - b.vel.y };
    const dot = relVel.x * dir.x + relVel.y * dir.y;
    a.vel.x -= dot * dir.x * 0.5;
    a.vel.y -= dot * dir.y * 0.5;
    b.vel.x += dot * dir.x * 0.5;
    b.vel.y += dot * dir.y * 0.5;
  }
}

function clampBall(ball: Ball) {
  const goalTop = (ARENA.height - ARENA.goalWidth) / 2;
  const goalBottom = goalTop + ARENA.goalWidth;
  
  // Top/bottom walls
  if (ball.pos.y - ball.radius < 0) { ball.pos.y = ball.radius; ball.vel.y *= -0.7; }
  if (ball.pos.y + ball.radius > ARENA.height) { ball.pos.y = ARENA.height - ball.radius; ball.vel.y *= -0.7; }
  
  // Left wall (with goal opening)
  if (ball.pos.x - ball.radius < 0) {
    if (ball.pos.y > goalTop && ball.pos.y < goalBottom) {
      // In goal area - allow
      if (ball.pos.x - ball.radius < -ARENA.goalDepth) {
        ball.pos.x = -ARENA.goalDepth + ball.radius;
        ball.vel.x *= -0.5;
      }
    } else {
      ball.pos.x = ball.radius;
      ball.vel.x *= -0.7;
    }
  }
  
  // Right wall (with goal opening)
  if (ball.pos.x + ball.radius > ARENA.width) {
    if (ball.pos.y > goalTop && ball.pos.y < goalBottom) {
      if (ball.pos.x + ball.radius > ARENA.width + ARENA.goalDepth) {
        ball.pos.x = ARENA.width + ARENA.goalDepth - ball.radius;
        ball.vel.x *= -0.5;
      }
    } else {
      ball.pos.x = ARENA.width - ball.radius;
      ball.vel.x *= -0.7;
    }
  }
  
  // Goal post collisions
  if (ball.pos.x - ball.radius < 0 || ball.pos.x + ball.radius > ARENA.width) {
    // Top goal post
    if (Math.abs(ball.pos.y - goalTop) < ball.radius && ball.pos.y < goalTop) {
      ball.vel.y *= -0.7;
      ball.pos.y = goalTop - ball.radius;
    }
    // Bottom goal post
    if (Math.abs(ball.pos.y - goalBottom) < ball.radius && ball.pos.y > goalBottom) {
      ball.vel.y *= -0.7;
      ball.pos.y = goalBottom + ball.radius;
    }
  }
}

function clampPlayer(player: Player) {
  if (player.pos.x - player.radius < 0) { player.pos.x = player.radius; player.vel.x = 0; }
  if (player.pos.x + player.radius > ARENA.width) { player.pos.x = ARENA.width - player.radius; player.vel.x = 0; }
  if (player.pos.y - player.radius < 0) { player.pos.y = player.radius; player.vel.y = 0; }
  if (player.pos.y + player.radius > ARENA.height) { player.pos.y = ARENA.height - player.radius; player.vel.y = 0; }
}

function checkGoal(ball: Ball): 'A' | 'B' | null {
  const goalTop = (ARENA.height - ARENA.goalWidth) / 2;
  const goalBottom = goalTop + ARENA.goalWidth;
  
  if (ball.pos.x < -ARENA.goalDepth / 2 && ball.pos.y > goalTop && ball.pos.y < goalBottom) {
    return 'B'; // Team B scored (ball went into left goal)
  }
  if (ball.pos.x > ARENA.width + ARENA.goalDepth / 2 && ball.pos.y > goalTop && ball.pos.y < goalBottom) {
    return 'A'; // Team A scored (ball went into right goal)
  }
  return null;
}

export function update(state: GameState, keysA: Keys, keysB: Keys, dt: number): GameState {
  if (state.status !== 'playing' && state.status !== 'overtime') return state;
  
  // Input
  handlePlayerInput(state.players[0], keysA);
  handlePlayerInput(state.players[1], keysB);
  
  // Physics
  for (const p of state.players) {
    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
    p.vel.x *= PLAYER_FRICTION;
    p.vel.y *= PLAYER_FRICTION;
    clampPlayer(p);
  }
  
  state.ball.pos.x += state.ball.vel.x;
  state.ball.pos.y += state.ball.vel.y;
  state.ball.vel.x *= BALL_FRICTION;
  state.ball.vel.y *= BALL_FRICTION;
  
  // Collisions
  handlePlayerBallCollision(state.players[0], state.ball, keysA.kick);
  handlePlayerBallCollision(state.players[1], state.ball, keysB.kick);
  handlePlayerPlayerCollision(state.players[0], state.players[1]);
  clampBall(state.ball);
  
  // Goal check
  const scorer = checkGoal(state.ball);
  if (scorer) {
    if (scorer === 'A') state.players[0].score++;
    else state.players[1].score++;
    state.lastScorer = scorer;
    state.status = 'goal';
    setTimeout(() => {
      resetPositions(state);
      state.status = state.timeLeft <= 0 ? 'finished' : 'playing';
    }, 1500);
  }
  
  // Timer
  state.timeLeft -= dt;
  if (state.timeLeft <= 0 && state.status === 'playing') {
    if (state.players[0].score === state.players[1].score) {
      state.status = 'overtime';
      state.timeLeft = 60; // 1 min overtime
    } else {
      state.status = 'finished';
    }
  }
  if (state.timeLeft <= 0 && state.status === 'overtime') {
    state.status = 'finished';
  }
  
  return state;
}
