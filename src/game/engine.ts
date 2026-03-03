import {
  GameState, Ball, Player, Vec2,
  PLAYER_RADIUS, BALL_RADIUS, PLAYER_SPEED, SPRINT_SPEED,
  BALL_FRICTION, PLAYER_FRICTION, KICK_FORCE, POWER_KICK_FORCE,
  MAX_STAMINA, STAMINA_DRAIN, STAMINA_REGEN, MATCH_DURATION,
  DASH_SPEED, DASH_DURATION, DASH_COOLDOWN, CURVE_SPIN, KNUCKLE_WOBBLE,
  MAX_KICK_CHARGE, ArenaConfig, ArenaType, ARENAS, GameMode, ShotType,
} from './types';
import { playSound } from './sound';

export interface Keys {
  up: boolean; down: boolean; left: boolean; right: boolean;
  sprint: boolean; kick: boolean; dash: boolean;
  curveLeft: boolean; curveRight: boolean; powerShot: boolean;
}

export function createInitialState(arenaType: ArenaType = 'classic', mode: GameMode = '1v1-local'): GameState {
  const arena = ARENAS[arenaType];
  return {
    players: [createPlayer('A', arena), createPlayer('B', arena)],
    ball: createBall(arena),
    timeLeft: MATCH_DURATION,
    matchDuration: MATCH_DURATION,
    status: 'waiting',
    lastScorer: null,
    arena,
    arenaType,
    mode,
    foulTeam: null,
    setPiecePos: null,
  };
}

function createPlayer(team: 'A' | 'B', arena: ArenaConfig): Player {
  const x = team === 'A' ? arena.width * 0.25 : arena.width * 0.75;
  return {
    pos: { x, y: arena.height / 2 },
    vel: { x: 0, y: 0 },
    radius: PLAYER_RADIUS,
    team,
    score: 0,
    sprinting: false,
    stamina: MAX_STAMINA,
    dashCooldown: 0,
    dashActive: 0,
    kickChargeStart: null,
    shotType: 'normal',
  };
}

function createBall(arena: ArenaConfig): Ball {
  return {
    pos: { x: arena.width / 2, y: arena.height / 2 },
    vel: { x: 0, y: 0 },
    radius: BALL_RADIUS,
    spin: 0,
    wobble: 0,
  };
}

export function resetPositions(state: GameState) {
  const { arena } = state;
  state.players[0].pos = { x: arena.width * 0.25, y: arena.height / 2 };
  state.players[1].pos = { x: arena.width * 0.75, y: arena.height / 2 };
  state.players[0].vel = { x: 0, y: 0 };
  state.players[1].vel = { x: 0, y: 0 };
  state.players[0].dashActive = 0;
  state.players[1].dashActive = 0;
  state.ball = createBall(arena);
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
  // Dash
  if (player.dashCooldown > 0) player.dashCooldown--;
  if (keys.dash && player.dashCooldown <= 0 && player.stamina > 20 && player.dashActive <= 0) {
    player.dashActive = DASH_DURATION;
    player.dashCooldown = DASH_COOLDOWN;
    player.stamina -= 20;
    const dir = normalize(player.vel);
    if (dir.x !== 0 || dir.y !== 0) {
      player.vel.x = dir.x * DASH_SPEED;
      player.vel.y = dir.y * DASH_SPEED;
    }
    playSound('dash');
  }
  if (player.dashActive > 0) {
    player.dashActive--;
    return; // no control during dash
  }

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

  // Determine shot type
  if (keys.powerShot) player.shotType = 'power';
  else if (keys.curveLeft || keys.curveRight) player.shotType = 'curve';
  else player.shotType = 'normal';
}

function handlePlayerBallCollision(player: Player, ball: Ball, keys: Keys) {
  const d = dist(player.pos, ball.pos);
  const minDist = player.radius + ball.radius;

  if (d < minDist) {
    const dir = normalize({ x: ball.pos.x - player.pos.x, y: ball.pos.y - player.pos.y });
    const overlap = minDist - d;
    ball.pos.x += dir.x * overlap;
    ball.pos.y += dir.y * overlap;

    if (keys.kick) {
      // Active kick with shot type
      let force = KICK_FORCE;
      let shotType: ShotType = player.shotType;

      if (shotType === 'power') {
        force = POWER_KICK_FORCE;
        playSound('powerKick');
      } else {
        playSound('kick');
      }

      ball.vel.x = dir.x * force + player.vel.x * 0.4;
      ball.vel.y = dir.y * force + player.vel.y * 0.4;

      if (shotType === 'curve') {
        // Add spin based on which curve key
        ball.spin = keys.curveLeft ? -CURVE_SPIN : CURVE_SPIN;
      } else if (shotType === 'power') {
        // Random chance of knuckle on power shots
        if (Math.random() < 0.3) {
          ball.wobble = 60;
        }
      } else {
        ball.spin = 0;
        ball.wobble = 0;
      }
    } else if (player.dashActive > 0) {
      // Dash into ball = strong hit
      ball.vel.x = dir.x * KICK_FORCE * 1.2 + player.vel.x * 0.6;
      ball.vel.y = dir.y * KICK_FORCE * 1.2 + player.vel.y * 0.6;
      playSound('kick');
    } else {
      // Gentle dribble - just nudge
      ball.vel.x += dir.x * 0.8 + player.vel.x * 0.15;
      ball.vel.y += dir.y * 0.8 + player.vel.y * 0.15;
    }
  }
}

function handlePlayerPlayerCollision(a: Player, b: Player): boolean {
  const d = dist(a.pos, b.pos);
  const minDist = a.radius + b.radius;
  let foul = false;
  if (d < minDist && d > 0) {
    const dir = normalize({ x: b.pos.x - a.pos.x, y: b.pos.y - a.pos.y });
    const overlap = (minDist - d) / 2;
    a.pos.x -= dir.x * overlap;
    a.pos.y -= dir.y * overlap;
    b.pos.x += dir.x * overlap;
    b.pos.y += dir.y * overlap;
    const relVel = { x: a.vel.x - b.vel.x, y: a.vel.y - b.vel.y };
    const dot = relVel.x * dir.x + relVel.y * dir.y;
    a.vel.x -= dot * dir.x * 0.5;
    a.vel.y -= dot * dir.y * 0.5;
    b.vel.x += dot * dir.x * 0.5;
    b.vel.y += dot * dir.y * 0.5;

    // Foul detection: if either is dashing
    if (a.dashActive > 0 || b.dashActive > 0) {
      const speed = Math.sqrt(dot * dot);
      if (speed > 6) {
        foul = true;
        playSound('whistle');
      }
    }
    playSound('collision');
  }
  return foul;
}

function applyBallPhysics(ball: Ball) {
  // Curve (spin)
  if (Math.abs(ball.spin) > 0.01) {
    const speed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);
    if (speed > 0.5) {
      // Perpendicular force
      ball.vel.x += -ball.vel.y / speed * ball.spin;
      ball.vel.y += ball.vel.x / speed * ball.spin;
    }
    ball.spin *= 0.97;
  }

  // Knuckle wobble
  if (ball.wobble > 0) {
    ball.vel.x += (Math.random() - 0.5) * KNUCKLE_WOBBLE;
    ball.vel.y += (Math.random() - 0.5) * KNUCKLE_WOBBLE;
    ball.wobble--;
  }

  ball.vel.x *= BALL_FRICTION;
  ball.vel.y *= BALL_FRICTION;
}

function clampBall(ball: Ball, arena: ArenaConfig) {
  const goalTop = (arena.height - arena.goalWidth) / 2;
  const goalBottom = goalTop + arena.goalWidth;

  if (ball.pos.y - ball.radius < 0) { ball.pos.y = ball.radius; ball.vel.y *= -0.7; playSound('wall'); }
  if (ball.pos.y + ball.radius > arena.height) { ball.pos.y = arena.height - ball.radius; ball.vel.y *= -0.7; playSound('wall'); }

  if (ball.pos.x - ball.radius < 0) {
    if (ball.pos.y > goalTop && ball.pos.y < goalBottom) {
      if (ball.pos.x - ball.radius < -arena.goalDepth) {
        ball.pos.x = -arena.goalDepth + ball.radius; ball.vel.x *= -0.5;
      }
    } else {
      ball.pos.x = ball.radius; ball.vel.x *= -0.7; playSound('wall');
    }
  }

  if (ball.pos.x + ball.radius > arena.width) {
    if (ball.pos.y > goalTop && ball.pos.y < goalBottom) {
      if (ball.pos.x + ball.radius > arena.width + arena.goalDepth) {
        ball.pos.x = arena.width + arena.goalDepth - ball.radius; ball.vel.x *= -0.5;
      }
    } else {
      ball.pos.x = arena.width - ball.radius; ball.vel.x *= -0.7; playSound('wall');
    }
  }

  if (ball.pos.x - ball.radius < 0 || ball.pos.x + ball.radius > arena.width) {
    if (Math.abs(ball.pos.y - goalTop) < ball.radius && ball.pos.y < goalTop) {
      ball.vel.y *= -0.7; ball.pos.y = goalTop - ball.radius;
    }
    if (Math.abs(ball.pos.y - goalBottom) < ball.radius && ball.pos.y > goalBottom) {
      ball.vel.y *= -0.7; ball.pos.y = goalBottom + ball.radius;
    }
  }
}

function clampPlayer(player: Player, arena: ArenaConfig) {
  if (player.pos.x - player.radius < 0) { player.pos.x = player.radius; player.vel.x = 0; }
  if (player.pos.x + player.radius > arena.width) { player.pos.x = arena.width - player.radius; player.vel.x = 0; }
  if (player.pos.y - player.radius < 0) { player.pos.y = player.radius; player.vel.y = 0; }
  if (player.pos.y + player.radius > arena.height) { player.pos.y = arena.height - player.radius; player.vel.y = 0; }
}

function checkGoal(ball: Ball, arena: ArenaConfig): 'A' | 'B' | null {
  const goalTop = (arena.height - arena.goalWidth) / 2;
  const goalBottom = goalTop + arena.goalWidth;

  if (ball.pos.x < -arena.goalDepth / 2 && ball.pos.y > goalTop && ball.pos.y < goalBottom) {
    return 'B';
  }
  if (ball.pos.x > arena.width + arena.goalDepth / 2 && ball.pos.y > goalTop && ball.pos.y < goalBottom) {
    return 'A';
  }
  return null;
}

let goalTimeout: ReturnType<typeof setTimeout> | null = null;

export function update(state: GameState, keysA: Keys, keysB: Keys, dt: number): GameState {
  if (state.status !== 'playing' && state.status !== 'overtime' && state.status !== 'freekick' && state.status !== 'penalty') return state;

  // In freekick/penalty, only the kicker can move until ball is kicked
  if (state.status === 'freekick' || state.status === 'penalty') {
    const kickerKeys = state.foulTeam === 'B' ? keysA : keysB;
    if (kickerKeys.kick) {
      state.status = 'playing';
      playSound('whistle');
    } else {
      // Only the kicker can position, other player frozen
      if (state.foulTeam === 'B') {
        handlePlayerInput(state.players[0], keysA);
        state.players[0].pos.x += state.players[0].vel.x;
        state.players[0].pos.y += state.players[0].vel.y;
        state.players[0].vel.x *= PLAYER_FRICTION;
        state.players[0].vel.y *= PLAYER_FRICTION;
        clampPlayer(state.players[0], state.arena);
      } else {
        handlePlayerInput(state.players[1], keysB);
        state.players[1].pos.x += state.players[1].vel.x;
        state.players[1].pos.y += state.players[1].vel.y;
        state.players[1].vel.x *= PLAYER_FRICTION;
        state.players[1].vel.y *= PLAYER_FRICTION;
        clampPlayer(state.players[1], state.arena);
      }
      state.timeLeft -= dt;
      return state;
    }
  }

  handlePlayerInput(state.players[0], keysA);
  handlePlayerInput(state.players[1], keysB);

  for (const p of state.players) {
    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
    p.vel.x *= PLAYER_FRICTION;
    p.vel.y *= PLAYER_FRICTION;
    clampPlayer(p, state.arena);
  }

  state.ball.pos.x += state.ball.vel.x;
  state.ball.pos.y += state.ball.vel.y;
  applyBallPhysics(state.ball);

  handlePlayerBallCollision(state.players[0], state.ball, keysA);
  handlePlayerBallCollision(state.players[1], state.ball, keysB);

  const foul = handlePlayerPlayerCollision(state.players[0], state.players[1]);
  if (foul) {
    // Award free kick to the team that was fouled
    const fouler = state.players[0].dashActive > 0 ? 'A' : 'B';
    state.foulTeam = fouler;
    state.status = 'freekick';
    state.setPiecePos = { ...state.ball.pos };
    state.ball.vel = { x: 0, y: 0 };
    state.ball.spin = 0;
    state.ball.wobble = 0;

    // Check if foul was in penalty area
    const penaltyAreaX = state.arena.width * 0.15;
    if ((fouler === 'A' && state.ball.pos.x < penaltyAreaX) ||
        (fouler === 'B' && state.ball.pos.x > state.arena.width - penaltyAreaX)) {
      state.status = 'penalty';
      // Place ball at penalty spot
      if (fouler === 'A') {
        state.ball.pos = { x: state.arena.width * 0.2, y: state.arena.height / 2 };
      } else {
        state.ball.pos = { x: state.arena.width * 0.8, y: state.arena.height / 2 };
      }
    }
  }

  clampBall(state.ball, state.arena);

  const scorer = checkGoal(state.ball, state.arena);
  if (scorer && state.status === 'playing') {
    if (scorer === 'A') state.players[0].score++;
    else state.players[1].score++;
    state.lastScorer = scorer;
    state.status = 'goal';
    playSound('goal');

    if (goalTimeout) clearTimeout(goalTimeout);
    goalTimeout = setTimeout(() => {
      resetPositions(state);
      state.status = state.timeLeft <= 0 ? 'finished' : 'playing';
      if (state.status === 'playing') playSound('whistle');
      goalTimeout = null;
    }, 1500);
  }

  state.timeLeft -= dt;
  if (state.timeLeft <= 0 && state.status === 'playing') {
    if (state.players[0].score === state.players[1].score) {
      state.status = 'overtime';
      state.timeLeft = 60;
      playSound('whistle');
    } else {
      state.status = 'finished';
      playSound('whistle');
    }
  }
  if (state.timeLeft <= 0 && state.status === 'overtime') {
    state.status = 'finished';
    playSound('whistle');
  }

  return state;
}
