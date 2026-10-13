import test from 'node:test';
import assert from 'node:assert/strict';
import { FlamePool } from '../dist/engine/flame-pool.js';
import { FireBreath } from '../dist/engine/fire-breath.js';
import { Scene } from '../dist/assets/three.module.js';
const player = { x: 4, y: 2, z: 8, angle: 0 };
test('fire and embers attach to the animated model mouth position', () => {
  const fire = new FireBreath(new Scene());
  const mouth = { x: 9, y: 4, z: 3 };
  fire.update(0.05, { ...player, flame: 0.3 }, true, 0, 'low', 720, mouth);
  assert.deepEqual(fire.root.position.toArray(), [9, 4, 3]);
  assert.ok(Math.abs(fire.pool.position[0] - 9) < 0.001);
  assert.ok(Math.abs(fire.pool.position[1] - 4) < 0.061);
  assert.ok(Math.abs(fire.pool.position[2] - 3) < 0.001);
});
test('pausing an attack extinguishes the plume and lets its existing embers expire', () => {
  const fire = new FireBreath(new Scene());
  const attacking = { ...player, flame: 0.3 };
  fire.update(0.05, attacking, true, 0, 'high', 720);
  assert.equal(fire.root.visible, true);
  assert.ok(fire.pool.activeCount > 0);
  const emitted = fire.pool.emitted;
  for (let i = 0; i < 30; i++) fire.update(0.05, attacking, false, i * 0.05, 'high', 720);
  assert.equal(fire.root.visible, false);
  assert.equal(fire.light.intensity, 0);
  assert.equal(fire.pool.emitted, emitted);
  assert.equal(fire.pool.activeCount, 0);
});
test('flames start at the mouth and travel in the facing direction', () => {
  const pool = new FlamePool(32, () => 0.5);
  pool.update(0.05, player, true);
  assert.ok(pool.activeCount > 0);
  assert.equal(pool.position[0], 4);
  assert.ok(pool.position[1] > 3);
  assert.ok(pool.position[2] > 9.5);
  assert.ok(pool.velocity[2] > 7);
});
test('turning turns the flame stream', () => {
  const pool = new FlamePool(32, () => 0.5);
  pool.update(0.05, { ...player, angle: Math.PI / 2 }, true);
  assert.ok(pool.velocity[0] > 7);
  assert.ok(Math.abs(pool.velocity[2]) < 0.01);
});
test('flame emission depends on elapsed time, not frame count', () => {
  const a = new FlamePool(256, () => 0.5),
    b = new FlamePool(256, () => 0.5);
  for (let i = 0; i < 60; i++) a.update(1 / 60, player, true);
  for (let i = 0; i < 30; i++) b.update(1 / 30, player, true);
  assert.equal(a.emitted, b.emitted);
});
test('balanced quality reduces emission without changing direction', () => {
  const a = new FlamePool(128, () => 0.5),
    b = new FlamePool(128, () => 0.5);
  a.update(0.1, player, true, 'high');
  b.update(0.1, player, true, 'low');
  assert.ok(b.emitted < a.emitted);
  assert.ok(b.velocity[2] > 7);
});
test('flames cool, rise and expire after releasing attack', () => {
  const pool = new FlamePool(32, () => 0.5);
  pool.update(0.05, player, true);
  const heat = pool.heat[0],
    height = pool.position[1];
  pool.update(0.1, player, false);
  assert.ok(pool.heat[0] < heat);
  assert.ok(pool.position[1] > height);
  for (let i = 0; i < 12; i++) pool.update(0.05, player, false);
  assert.equal(pool.activeCount, 0);
  assert.equal(pool.size[0], 0);
});
test('effects remain bounded during a prolonged attack', () => {
  const pool = new FlamePool(24, () => 0.5);
  for (let i = 0; i < 300; i++) pool.update(0.05, player, true);
  assert.ok(pool.activeCount <= 24);
  assert.equal(pool.position.length, 72);
  assert.ok([...pool.position].every(Number.isFinite));
});
