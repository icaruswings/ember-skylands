import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, terrainHeight } from '../dist/engine/simulation.js';
import { LEVEL } from '../dist/game/level.js';

const flat = {
  islands: [{ x: 0, z: 0, y: 0, r: 30 }],
  bridges: [],
  obstacles: [],
  gems: [],
  enemies: [],
  rescues: [],
  goal: { gems: 1, rescues: 1 },
  spawn: { x: 0, y: 0, z: 0 },
  portal: { x: 20, y: 0, z: 0 },
  platforms: [{ x: 0, z: -2, y: 6, halfX: 3, halfZ: 2 }],
};
test('raised floors do not pull a ground-level player onto their roof', () => {
  const sim = new Simulation(flat);
  for (let i = 0; i < 30; i++) sim.update(1 / 60, { z: -1 });
  assert.equal(sim.player.y, 0);
  assert.equal(terrainHeight(flat, 0, -2), 6);
  assert.equal(terrainHeight(flat, 0, -2, 0.6), 0);
});
test('descending onto a raised terrace lands at the terrace height', () => {
  const sim = new Simulation(flat);
  Object.assign(sim.player, { x: 0, z: -2, y: 8, vy: -2, grounded: false });
  for (let i = 0; i < 60; i++) sim.update(1 / 60);
  assert.equal(sim.player.y, 6);
  assert.equal(sim.player.grounded, true);
});
test('the watchtower glide route reaches hidden treasure from the normal spawn', () => {
  assert.ok(LEVEL.islands.some((i) => i.id === 'secret'));
  const sim = new Simulation(LEVEL);
  // Move through the designed route, never mutate live player position.
  const walk = (x, z) => {
    for (let n = 0; n < 800; n++) {
      const dx = x - sim.player.x,
        dz = z - sim.player.z,
        d = Math.hypot(dx, dz);
      if (d < 0.18) return;
      sim.update(1 / 60, { x: dx / d, z: dz / d, flame: n % 30 === 0 });
    }
    assert.fail(
      `route blocked at ${sim.player.x},${sim.player.y},${sim.player.z}, targeting ${x},${z}`,
    );
  };
  walk(-5, 0);
  walk(-7, -6);
  walk(-13, -6);
  walk(-13, -3);
  walk(-17, 1);
  assert.ok(sim.player.y > 5.5);
  sim.update(1 / 60, { x: -1, z: 0.3, jump: true });
  for (let i = 0; i < 16; i++) sim.update(1 / 60, { x: -1, z: 0.3 });
  sim.update(1 / 60, { x: -1, z: 0.3, jump: true });
  assert.equal(sim.player.gliding, true);
  for (let i = 0; i < 110; i++) {
    const dx = -30 - sim.player.x,
      dz = 7 - sim.player.z,
      d = Math.hypot(dx, dz);
    sim.update(1 / 60, { x: dx / d, z: dz / d });
    if (sim.player.grounded) break;
  }
  assert.ok(Math.hypot(sim.player.x + 30, sim.player.z - 7) < 5.5);
  // Fold the wings over the garden to settle onto the lawn.
  sim.update(1 / 60, { jump: true });
  for (let i = 0; i < 80; i++) sim.update(1 / 60);
  assert.equal(sim.player.y, 1);
  const secret = LEVEL.gems.filter((g) => g.zone === 'secret' && !g.source);
  for (const g of secret) walk(g.x, g.z);
  assert.ok(secret.every((g) => sim.collected.has(g.id)));
  walk(-28, 9);
  walk(-24, 10.45);
  walk(-17, 13);
  walk(-15, 13);
  for (let i = 0; i < 60; i++) sim.update(1 / 60);
  assert.equal(sim.player.y, 0);
  assert.equal(sim.player.grounded, true);
});
