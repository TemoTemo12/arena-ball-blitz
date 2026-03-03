import { GameState, ArenaConfig } from './types';

function getColors(arena: ArenaConfig) {
  const h = arena.bgHue;
  return {
    bg: `hsl(${h}, 25%, 14%)`,
    line: `hsla(${h}, 15%, 35%, 0.6)`,
    goalA: 'hsla(150, 80%, 50%, 0.15)',
    goalB: 'hsla(200, 80%, 55%, 0.15)',
    teamA: 'hsl(150, 80%, 50%)',
    teamAGlow: 'hsla(150, 80%, 50%, 0.4)',
    teamB: 'hsl(200, 80%, 55%)',
    teamBGlow: 'hsla(200, 80%, 55%, 0.4)',
    ball: 'hsl(35, 95%, 55%)',
    ballGlow: 'hsla(35, 95%, 55%, 0.5)',
    ballTrail: 'hsla(35, 95%, 55%, 0.15)',
  };
}

export function render(ctx: CanvasRenderingContext2D, state: GameState, scale: number) {
  const { arena } = state;
  const c = getColors(arena);

  ctx.save();
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = c.bg;
  ctx.fillRect(-arena.goalDepth, 0, arena.width + arena.goalDepth * 2, arena.height);

  const goalTop = (arena.height - arena.goalWidth) / 2;

  // Goal areas
  ctx.fillStyle = c.goalA;
  ctx.fillRect(-arena.goalDepth, goalTop, arena.goalDepth, arena.goalWidth);
  ctx.fillStyle = c.goalB;
  ctx.fillRect(arena.width, goalTop, arena.goalDepth, arena.goalWidth);

  // Penalty areas
  const penWidth = arena.width * 0.15;
  const penHeight = arena.goalWidth * 1.8;
  const penTop = (arena.height - penHeight) / 2;
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(0, penTop, penWidth, penHeight);
  ctx.strokeRect(arena.width - penWidth, penTop, penWidth, penHeight);
  ctx.setLineDash([]);

  // Penalty spots
  ctx.fillStyle = c.line;
  ctx.beginPath();
  ctx.arc(arena.width * 0.2, arena.height / 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(arena.width * 0.8, arena.height / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, arena.width, arena.height);

  // Center line
  ctx.beginPath();
  ctx.moveTo(arena.width / 2, 0);
  ctx.lineTo(arena.width / 2, arena.height);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(arena.width / 2, arena.height / 2, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = c.line;
  ctx.beginPath();
  ctx.arc(arena.width / 2, arena.height / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Goal posts
  ctx.lineWidth = 3;
  ctx.strokeStyle = c.teamA;
  ctx.beginPath();
  ctx.moveTo(0, goalTop);
  ctx.lineTo(-arena.goalDepth, goalTop);
  ctx.lineTo(-arena.goalDepth, goalTop + arena.goalWidth);
  ctx.lineTo(0, goalTop + arena.goalWidth);
  ctx.stroke();

  ctx.strokeStyle = c.teamB;
  ctx.beginPath();
  ctx.moveTo(arena.width, goalTop);
  ctx.lineTo(arena.width + arena.goalDepth, goalTop);
  ctx.lineTo(arena.width + arena.goalDepth, goalTop + arena.goalWidth);
  ctx.lineTo(arena.width, goalTop + arena.goalWidth);
  ctx.stroke();

  // Players
  for (const player of state.players) {
    const color = player.team === 'A' ? c.teamA : c.teamB;
    const glow = player.team === 'A' ? c.teamAGlow : c.teamBGlow;

    // Dash trail
    if (player.dashActive > 0) {
      ctx.beginPath();
      ctx.arc(player.pos.x, player.pos.y, player.radius + 12, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }

    // Glow
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, player.radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Inner
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, player.radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = c.bg;
    ctx.fill();

    // Team label
    ctx.font = 'bold 10px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(player.team === 'A' ? 'P1' : 'P2', player.pos.x, player.pos.y);

    // Stamina ring
    if (player.stamina < 100) {
      const staminaAngle = (player.stamina / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(player.pos.x, player.pos.y, player.radius + 3, -Math.PI / 2, -Math.PI / 2 + staminaAngle);
      ctx.strokeStyle = 'hsla(50, 90%, 60%, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Dash cooldown indicator
    if (player.dashCooldown > 0) {
      const cd = player.dashCooldown / 90;
      ctx.beginPath();
      ctx.arc(player.pos.x, player.pos.y, player.radius + 5, -Math.PI / 2, -Math.PI / 2 + (1 - cd) * Math.PI * 2);
      ctx.strokeStyle = 'hsla(280, 70%, 60%, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Ball
  const ballSpeed = Math.sqrt(state.ball.vel.x ** 2 + state.ball.vel.y ** 2);
  const glowSize = Math.min(ballSpeed * 1.5, 18);

  // Spin indicator
  if (Math.abs(state.ball.spin) > 0.05) {
    ctx.beginPath();
    ctx.arc(state.ball.pos.x, state.ball.pos.y, state.ball.radius + glowSize + 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'hsla(280, 80%, 60%, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(state.ball.pos.x, state.ball.pos.y, state.ball.radius + glowSize, 0, Math.PI * 2);
  ctx.fillStyle = c.ballGlow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.ball.pos.x, state.ball.pos.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = c.ball;
  ctx.fill();

  // Wobble indicator (knuckle)
  if (state.ball.wobble > 0) {
    ctx.beginPath();
    const wobbleAngle = Date.now() * 0.01;
    ctx.arc(state.ball.pos.x, state.ball.pos.y, state.ball.radius + 8, wobbleAngle, wobbleAngle + Math.PI);
    ctx.strokeStyle = 'hsla(0, 80%, 60%, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Set piece indicators
  if (state.status === 'freekick' || state.status === 'penalty') {
    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'hsla(50, 90%, 60%, 0.9)';
    const label = state.status === 'penalty' ? 'PENALTY!' : 'FREE KICK';
    ctx.fillText(label, arena.width / 2, 15);

    ctx.font = '12px Rajdhani, sans-serif';
    ctx.fillStyle = 'hsla(0, 0%, 80%, 0.7)';
    ctx.fillText('Press kick to take', arena.width / 2, 40);

    // Circle around ball
    ctx.beginPath();
    ctx.arc(state.ball.pos.x, state.ball.pos.y, 30, 0, Math.PI * 2);
    ctx.strokeStyle = 'hsla(50, 90%, 60%, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Goal celebration
  if (state.status === 'goal') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-arena.goalDepth, 0, arena.width + arena.goalDepth * 2, arena.height);
    ctx.font = 'bold 72px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const goalColor = state.lastScorer === 'A' ? c.teamA : c.teamB;
    ctx.fillStyle = goalColor;
    ctx.shadowColor = goalColor;
    ctx.shadowBlur = 40;
    ctx.fillText('GOAL!', arena.width / 2, arena.height / 2);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}
