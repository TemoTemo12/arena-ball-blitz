import { GameState, PLAYER_SPEED, SPRINT_SPEED } from './types';
import { Keys } from './engine';

// Simple AI that chases ball, kicks toward goal, and defends
export function getAIKeys(state: GameState): Keys {
  const keys: Keys = {
    up: false, down: false, left: false, right: false,
    sprint: false, kick: false, dash: false,
    curveLeft: false, curveRight: false, powerShot: false,
  };

  const ai = state.players[1]; // AI is always player B
  const ball = state.ball;
  const arena = state.arena;

  const ballDist = Math.sqrt((ai.pos.x - ball.pos.x) ** 2 + (ai.pos.y - ball.pos.y) ** 2);
  const goalX = 0; // AI attacks left goal
  const goalY = arena.height / 2;
  const ownGoalX = arena.width;

  // Determine target position
  let targetX: number;
  let targetY: number;

  // If ball is on our side (right half), defend
  if (ball.pos.x > arena.width * 0.6) {
    // Get between ball and our goal
    targetX = Math.min(ball.pos.x + 30, arena.width - ai.radius);
    targetY = ball.pos.y;
  } else {
    // Chase ball with offset to push it toward opponent goal
    targetX = ball.pos.x + 20; // approach from the right
    targetY = ball.pos.y;

    // If we're close, position to kick toward goal
    if (ballDist < 80) {
      targetX = ball.pos.x + 15;
      // Aim slightly toward goal center
      const angleToGoal = Math.atan2(goalY - ball.pos.y, goalX - ball.pos.x);
      targetY = ball.pos.y - Math.sin(angleToGoal) * 10;
    }
  }

  // Move toward target
  const dx = targetX - ai.pos.x;
  const dy = targetY - ai.pos.y;
  const threshold = 5;

  if (dx > threshold) keys.right = true;
  if (dx < -threshold) keys.left = true;
  if (dy > threshold) keys.down = true;
  if (dy < -threshold) keys.up = true;

  // Sprint when far from ball
  if (ballDist > 150) keys.sprint = true;

  // Kick when close to ball and facing roughly toward goal
  if (ballDist < ai.radius + ball.radius + 15) {
    const angleToBall = Math.atan2(ball.pos.y - ai.pos.y, ball.pos.x - ai.pos.x);
    const angleToGoal = Math.atan2(goalY - ai.pos.y, goalX - ai.pos.x);
    const angleDiff = Math.abs(angleToBall - angleToGoal);

    if (angleDiff < Math.PI * 0.6 || ball.pos.x < arena.width * 0.3) {
      keys.kick = true;
      // Use power shot sometimes
      if (ball.pos.x < arena.width * 0.35 && Math.random() < 0.3) {
        keys.powerShot = true;
      }
      // Use curve sometimes
      if (Math.random() < 0.2) {
        if (ball.pos.y > arena.height / 2) keys.curveRight = true;
        else keys.curveLeft = true;
      }
    }
  }

  // Dash when ball is moving away and we're chasing
  if (ballDist > 120 && ballDist < 250 && ai.dashCooldown <= 0 && Math.random() < 0.02) {
    keys.dash = true;
  }

  return keys;
}
