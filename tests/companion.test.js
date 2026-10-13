import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompanion, updateCompanion } from '../dist/game/companion.js';
const player = { x: 12, y: 3, z: -8, angle: Math.PI, health: 3 };
test('the dragonfly follows smoothly and freezes its pose with zero elapsed time', () => {
  const fly = createCompanion();
  updateCompanion(fly, player, 1 / 60, 0);
  assert.ok(fly.position.distanceTo({ x: 12, y: 4.4, z: -8 }) < 3);
  const before = fly.position.clone();
  updateCompanion(fly, { ...player, x: 16 }, 1 / 60, 0.2);
  assert.ok(fly.position.x > before.x && fly.position.x < 16);
  const frozen = fly.position.clone(),
    wings = fly.userData.wings.map((w) => w.rotation.z);
  updateCompanion(fly, { ...player, x: 30 }, 0, 0.2);
  assert.deepEqual(fly.position, frozen);
  assert.deepEqual(
    fly.userData.wings.map((w) => w.rotation.z),
    wings,
  );
});
test('the four-winged companion changes color with health without changing other models', () => {
  const fly = createCompanion(),
    other = createCompanion();
  assert.equal(fly.userData.wings?.length, 4);
  updateCompanion(fly, player, 0.1, 0);
  const gold = fly.userData.body.material.color.getHex();
  updateCompanion(fly, { ...player, health: 2 }, 0.1, 0.1);
  const blue = fly.userData.body.material.color.getHex();
  updateCompanion(fly, { ...player, health: 1 }, 0.1, 0.2);
  const green = fly.userData.body.material.color.getHex();
  assert.notEqual(gold, blue);
  assert.notEqual(blue, green);
  assert.equal(other.userData.body.material.color.getHex(), gold);
});
