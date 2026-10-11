import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, terrainHeight } from '../dist/engine/simulation.js';

const level = {
  islands: [{ x: 0, z: 0, y: 0, r: 15 }],
  bridges: [],
  obstacles: [],
  spawn: { x: 0, y: 0, z: 0 },
  portal: { x: 0, y: 0, z: -10 },
  goal: { gems: 2, rescues: 1 },
  gems: [
    { id: 'red', x: 2.8, y: 0.8, z: 0, color: 0xe6283c },
    { id: 'green-chest', x: 0, y: 0.8, z: 3, color: 0x3ce479, source: 'chest', sourceId: 'chest' },
    { id: 'green-enemy', x: 6, y: 0.8, z: 0, color: 0x3ce479, source: 'enemy', sourceId: 'thief' },
  ],
  chests: [{ id: 'chest', x: 0, y: 0, z: 3 }],
  enemies: [{ id: 'thief', x: 6, y: 0, z: 0, type: 'normal', behavior: 'flee' }],
  rescues: [{ id: 'friend', name: 'Friend', x: -7, y: 0, z: 0 }],
};
const step = (sim, n = 60, input = {}) => {
  for (let i = 0; i < n; i++) sim.update(1 / 60, input);
};

test('red gems visibly move toward the dragon before collecting', () => {
  const sim = new Simulation(level);
  sim.update(1 / 60);
  assert.equal(sim.collected.size, 0);
  assert.ok(sim.gems[0].x < 2.8);
  step(sim);
  assert.ok(sim.collected.has('red'));
});
test('hidden green treasure cannot be collected through an unbroken chest', () => {
  const sim = new Simulation(level);
  Object.assign(sim.player, { x: 0, z: 3 });
  step(sim);
  assert.ok(!sim.collected.has('green-chest'));
});
test('wooden chests block walking until an attack breaks them', () => {
  const sim = new Simulation(level);
  step(sim, 30, { z: 1 });
  assert.ok(sim.player.z <= 1.95);
  assert.ok(!sim.broken.has('chest'));
  step(sim, 30, { z: 1, charge: true });
  assert.ok(sim.broken.has('chest'));
  assert.ok(sim.player.z > 5);
});
test('flame and charge break chests once and release green gems', () => {
  for (const attack of ['flame', 'charge']) {
    const sim = new Simulation(level);
    sim.player.angle = 0;
    Object.assign(sim.player, attack === 'charge' ? { z: 2 } : { z: 0 });
    sim.update(1 / 60, { [attack]: true });
    assert.ok(sim.broken.has('chest'));
    step(sim);
    assert.ok(sim.collected.has('green-chest'));
    assert.equal(sim.drain().filter((e) => e.type === 'chest').length, 1);
  }
});
test('fire cannot break treasure behind the dragon or on another elevation', () => {
  for (const state of [{ angle: Math.PI }, { angle: 0, y: 5, grounded: false }]) {
    const sim = new Simulation(level);
    Object.assign(sim.player, state);
    sim.update(1 / 60, { flame: true });
    assert.ok(!sim.broken.has('chest'));
  }
});
test('nearby stone friends are freed automatically exactly once', () => {
  const sim = new Simulation(level);
  Object.assign(sim.player, { x: -5, z: 0, health: 1 });
  step(sim, 2);
  assert.ok(sim.rescued.has('friend'));
  assert.equal(sim.player.health, 3);
  assert.equal(sim.drain().filter((e) => e.type === 'rescue').length, 1);
  assert.equal(sim.checkpoint.x, -7);
});
test('sack carriers flee away from the player and stay on their island', () => {
  const sim = new Simulation(level);
  Object.assign(sim.player, { x: 4, z: 0 });
  step(sim, 30);
  assert.ok(sim.enemies[0].x > 6);
  Object.assign(sim.player, { x: 13, z: 0 });
  Object.assign(sim.enemies[0], { x: 14.5, z: 0 });
  step(sim, 120);
  assert.equal(terrainHeight(level, sim.enemies[0].x, sim.enemies[0].z), 0);
});
test('enemy sack treasure appears at the defeated enemy location', () => {
  const sim = new Simulation(level);
  Object.assign(sim.enemies[0], { x: 4, z: 2 });
  assert.equal(sim.hitEnemy('thief', 'flame'), true);
  const gem = sim.gems.find((g) => g.id === 'green-enemy');
  assert.equal(gem.active, true);
  assert.equal(gem.x, 4);
  assert.equal(gem.z, 2);
});
test('broken chest and uncollected treasure survive saving and reload', () => {
  const sim = new Simulation(level);
  sim.player.angle = 0;
  sim.update(1 / 60, { flame: true });
  const restored = new Simulation(level, sim.save());
  assert.ok(restored.broken.has('chest'));
  assert.equal(restored.gems.find((g) => g.id === 'green-chest').active, true);
  assert.equal(restored.gems.find((g) => g.id === 'green-enemy').active, false);
  step(restored);
  assert.ok(restored.collected.has('green-chest'));
});
test('jumping out of enemy detection never teleports a displaced thief home', () => {
  const sim = new Simulation(level);
  Object.assign(sim.enemies[0], { x: 12, z: 2 });
  Object.assign(sim.player, { x: 11, z: 2, y: 2.2, grounded: false });
  const before = { ...sim.enemies[0] };
  sim.update(1 / 60);
  assert.ok(Math.hypot(sim.enemies[0].x - before.x, sim.enemies[0].z - before.z) < 0.08);
});
