/** Walkable surfaces can overlap vertically; a ceiling selects the reachable floor. */
export function terrainHeight(level, x, z, ceiling = Infinity) {
  let height = null;
  const consider = (y) => {
    if (y <= ceiling) height = Math.max(height ?? -Infinity, y);
  };
  for (const p of level.islands) if (Math.hypot(x - p.x, z - p.z) <= p.r) consider(p.y);
  for (const p of level.platforms || [])
    if (Math.abs(x - p.x) <= p.halfX && Math.abs(z - p.z) <= p.halfZ) consider(p.y);
  for (const b of [...level.bridges, ...(level.ramps || [])]) {
    const dx = b.bx - b.ax,
      dz = b.bz - b.az,
      t = ((x - b.ax) * dx + (z - b.az) * dz) / (dx * dx + dz * dz);
    if (t >= 0 && t <= 1 && Math.hypot(x - b.ax - t * dx, z - b.az - t * dz) < b.width / 2)
      consider(b.ay + t * (b.by - b.ay));
  }
  return height;
}

export function obstacleBlocks(obstacle, feetY) {
  const bottom = obstacle.y ?? 0;
  return feetY < bottom + (obstacle.height ?? 3.2) && feetY + 1.4 > bottom;
}

export function blockedByObstacle(level, x, z, feetY, radius = 0.6) {
  return level.obstacles.some(
    (o) =>
      obstacleBlocks(o, feetY) &&
      (o.r
        ? Math.hypot(x - o.x, z - o.z) < o.r + radius
        : Math.abs(x - o.x) < o.halfX + radius && Math.abs(z - o.z) < o.halfZ + radius),
  );
}
