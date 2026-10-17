import { terrainHeight, blockedByObstacle } from './terrain.js';

/** Bounded terrain-safe patrols and readable, interruptible giant attack phases. */
export function updateEnemy(e, player, dt, level) {
  e.phase += dt;
  const dx = player.x - e.x,
    dz = player.z - e.z,
    distance = Math.hypot(dx, dz);
  const sameHeight = Math.abs(player.y - e.y) < 2;
  const previousX = e.x,
    previousZ = e.z;
  e.fleeing = e.behavior === 'flee' && distance < 9 && sameHeight;
  const attacking = e.type === 'giant' && ['windup', 'strike', 'recover'].includes(e.state);
  if (attacking) {
    e.timer -= dt;
    if (e.timer <= 0) {
      if (e.state === 'windup') {
        e.state = 'strike';
        e.timer = 0.16;
      } else if (e.state === 'strike') {
        e.state = 'recover';
        e.timer = 0.85;
      } else e.state = 'chase';
    }
  } else if (distance < (e.fleeing ? 9 : 7) && sameHeight) {
    e.state = e.fleeing ? 'flee' : 'chase';
    if (e.type === 'giant' && distance < 2.8) {
      e.state = 'windup';
      e.timer = 0.65;
      e.angle = Math.atan2(dx, dz);
    } else if (distance > 1.2) {
      const speed = e.fleeing ? -4.2 : e.type === 'giant' ? 1.2 : 1.8;
      e.x += (dx / distance) * dt * speed;
      e.z += (dz / distance) * dt * speed;
    }
  } else {
    e.state = 'patrol';
    const tx = e.homeX + Math.sin(e.phase) * 1.1 - e.x,
      tz = e.homeZ + Math.cos(e.phase) * 0.8 - e.z,
      d = Math.hypot(tx, tz),
      fraction = d ? Math.min(1, (dt * 1.8) / d) : 0;
    e.x += tx * fraction;
    e.z += tz * fraction;
  }
  const safe = (x, z) => {
    const height = terrainHeight(level, x, z, e.y + 0.65);
    return height !== null && Math.abs(height - e.y) < 0.7 && !blockedByObstacle(level, x, z, e.y);
  };
  if (!safe(e.x, e.z)) {
    const turn = e.phase % 4 < 2 ? 1 : -1,
      mx = e.x - previousX,
      mz = e.z - previousZ;
    e.x = previousX - mz * turn;
    e.z = previousZ + mx * turn;
    if (!safe(e.x, e.z)) {
      e.x = previousX;
      e.z = previousZ;
    }
  }
  const floor = terrainHeight(level, e.x, e.z, e.y + 0.65);
  if (floor !== null) e.y = floor;
  const movement = Math.hypot(e.x - previousX, e.z - previousZ);
  e.speed = dt ? movement / dt : 0;
  if (movement > 0.00001) e.angle = Math.atan2(e.x - previousX, e.z - previousZ);
  const strikeDistance = Math.hypot(player.x - e.x, player.z - e.z);
  return (
    e.state === 'strike' &&
    sameHeight &&
    strikeDistance < 2.65 &&
    (strikeDistance < 0.4 ||
      ((player.x - e.x) * Math.sin(e.angle) + (player.z - e.z) * Math.cos(e.angle)) /
        strikeDistance >
        0.45)
  );
}
