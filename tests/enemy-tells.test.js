import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../dist/engine/simulation.js';
const level = {
  islands: [{ x: 0, z: 0, y: 0, r: 20 }],
  bridges: [],
  obstacles: [],
  gems: [],
  rescues: [],
  enemies: [{ id: 'giant', x: 0, z: 2, y: 0, type: 'giant' }],
  spawn: { x: 0, z: 0, y: 0 },
  portal: { x: 15, z: 0, y: 0 },
  goal: { gems: 1, rescues: 1 },
};
test('giants telegraph an attack before damage and recover afterward', () => {
  const sim = new Simulation(level);
  sim.update(1 / 60);
  assert.equal(sim.enemies[0].state, 'windup');
  for (let i = 0; i < 25; i++) sim.update(1 / 60);
  assert.equal(sim.player.health, 3);
  for (let i = 0; i < 18; i++) sim.update(1 / 60);
  assert.equal(sim.player.health, 2);
  for (let i = 0; i < 12; i++) sim.update(1 / 60);
  assert.equal(sim.enemies[0].state, 'recover');
});
test('retreating during the giant windup avoids the strike', () => {
  const sim = new Simulation(level);
  sim.update(1 / 60);
  for (let i = 0; i < 60; i++) sim.update(1 / 60, { z: -1 });
  assert.equal(sim.player.health, 3);
});
test('flame interrupts a windup before the giant can hit', () => {
  const sim = new Simulation(level);
  sim.player.angle = 0;
  sim.update(1 / 60);
  sim.update(1 / 60, { flame: true });
  for (let i = 0; i < 80; i++) sim.update(1 / 60);
  assert.ok(sim.defeated.has('giant'));
  assert.equal(sim.player.health, 3);
});
