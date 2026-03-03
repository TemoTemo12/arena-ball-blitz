import { GameState, ARENA } from './types';

const TEAM_A_COLOR = 'hsl(150, 80%, 50%)';
const TEAM_A_GLOW = 'hsla(150, 80%, 50%, 0.4)';
const TEAM_B_COLOR = 'hsl(200, 80%, 55%)';
const TEAM_B_GLOW = 'hsla(200, 80%, 55%, 0.4)';
const BALL_COLOR = 'hsl(35, 95%, 55%)';
const BALL_GLOW = 'hsla(35, 95%, 55%, 0.5)';
const ARENA_BG = 'hsl(220, 25%, 14%)';
const LINE_COLOR = 'hsla(220, 15%, 35%, 0.6)';
const GOAL_COLOR_A = 'hsla(150, 80%, 50%, 0.15)';
const GOAL_COLOR_B = 'hsla(200, 80%, 55%, 0.15)';

export function render(ctx: CanvasRenderingContext2D, state: GameState, scale: number) {
  ctx.save();
  ctx.scale(scale, scale);
  
  // Arena background
  ctx.fillStyle = ARENA_BG;
  ctx.fillRect(-ARENA.goalDepth, 0, ARENA.width + ARENA.goalDepth * 2, ARENA.height);
  
  const goalTop = (ARENA.height - ARENA.goalWidth) / 2;
  
  // Goal areas
  ctx.fillStyle = GOAL_COLOR_A;
  ctx.fillRect(-ARENA.goalDepth, goalTop, ARENA.goalDepth, ARENA.goalWidth);
  ctx.fillStyle = GOAL_COLOR_B;
  ctx.fillRect(ARENA.width, goalTop, ARENA.goalDepth, ARENA.goalWidth);
  
  // Field lines
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 2;
  
  // Border
  ctx.strokeRect(0, 0, ARENA.width, ARENA.height);
  
  // Center line
  ctx.beginPath();
  ctx.moveTo(ARENA.width / 2, 0);
  ctx.lineTo(ARENA.width / 2, ARENA.height);
  ctx.stroke();
  
  // Center circle
  ctx.beginPath();
  ctx.arc(ARENA.width / 2, ARENA.height / 2, 60, 0, Math.PI * 2);
  ctx.stroke();
  
  // Center dot
  ctx.fillStyle = LINE_COLOR;
  ctx.beginPath();
  ctx.arc(ARENA.width / 2, ARENA.height / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Goal posts
  ctx.strokeStyle = TEAM_A_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, goalTop);
  ctx.lineTo(-ARENA.goalDepth, goalTop);
  ctx.lineTo(-ARENA.goalDepth, goalTop + ARENA.goalWidth);
  ctx.lineTo(0, goalTop + ARENA.goalWidth);
  ctx.stroke();
  
  ctx.strokeStyle = TEAM_B_COLOR;
  ctx.beginPath();
  ctx.moveTo(ARENA.width, goalTop);
  ctx.lineTo(ARENA.width + ARENA.goalDepth, goalTop);
  ctx.lineTo(ARENA.width + ARENA.goalDepth, goalTop + ARENA.goalWidth);
  ctx.lineTo(ARENA.width, goalTop + ARENA.goalWidth);
  ctx.stroke();
  
  // Players
  for (const player of state.players) {
    const color = player.team === 'A' ? TEAM_A_COLOR : TEAM_B_COLOR;
    const glow = player.team === 'A' ? TEAM_A_GLOW : TEAM_B_GLOW;
    
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
    
    // Inner circle
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, player.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = ARENA_BG;
    ctx.fill();
    
    // Stamina ring
    if (player.stamina < 100) {
      const staminaAngle = (player.stamina / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(player.pos.x, player.pos.y, player.radius + 3, -Math.PI / 2, -Math.PI / 2 + staminaAngle);
      ctx.strokeStyle = 'hsla(50, 90%, 60%, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  // Ball
  const ballSpeed = Math.sqrt(state.ball.vel.x ** 2 + state.ball.vel.y ** 2);
  const glowSize = Math.min(ballSpeed * 1.5, 15);
  
  ctx.beginPath();
  ctx.arc(state.ball.pos.x, state.ball.pos.y, state.ball.radius + glowSize, 0, Math.PI * 2);
  ctx.fillStyle = BALL_GLOW;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(state.ball.pos.x, state.ball.pos.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = BALL_COLOR;
  ctx.fill();
  
  // Goal celebration
  if (state.status === 'goal') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-ARENA.goalDepth, 0, ARENA.width + ARENA.goalDepth * 2, ARENA.height);
    
    ctx.font = 'bold 60px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = state.lastScorer === 'A' ? TEAM_A_COLOR : TEAM_B_COLOR;
    ctx.shadowColor = state.lastScorer === 'A' ? TEAM_A_GLOW : TEAM_B_GLOW;
    ctx.shadowBlur = 30;
    ctx.fillText('GOAL!', ARENA.width / 2, ARENA.height / 2);
    ctx.shadowBlur = 0;
  }
  
  ctx.restore();
}
