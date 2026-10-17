import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../dist/engine/simulation.js';
const field = {
  bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100, floorY: 0 },
  islands: [],
  bridges: [],
  obstacles: [],
  enemies: [],
  gems: [],
  rescues: [],
  chests: [],
  spawn: { x: 0, y: 0, z: 0 },
  portal: { x: 90, y: 0, z: 0 },
  goal: { gems: 1, rescues: 1 },
};
const step = (s, n, input = {}) => {
  for (let i = 0; i < n; i++) s.update(1 / 60, input);
};

test('holding jump rises higher than a tap while both land reliably', () => {
  const tap = new Simulation(field),
    hold = new Simulation(field);
  let tapPeak = 0,
    holdPeak = 0;
  for (let i = 0; i < 120; i++) {
    tap.update(1 / 60, { jump: i === 0 });
    hold.update(1 / 60, { jump: i < 25 });
    tapPeak = Math.max(tapPeak, tap.player.y);
    holdPeak = Math.max(holdPeak, hold.player.y);
  }
  assert.ok(holdPeak > tapPeak + 0.65);
  assert.ok(tapPeak > 0.65);
  assert.ok(tap.player.grounded && hold.player.grounded);
});

test('a jump pressed just before landing buffers one takeoff instead of opening glide', () => {
  const s = new Simulation(field);
  Object.assign(s.player, { y: 0.22, vy: -5, grounded: false });
  s.update(1 / 60, { jump: true });
  step(s, 8);
  assert.ok(s.player.y > 0.3 && !s.player.gliding);
  const events = s.drain();
  assert.equal(events.filter((e) => e.type === 'jump').length, 1);
  assert.equal(events.filter((e) => e.type === 'glide').length, 0);
});

test('a brief step beyond a ledge still accepts a forgiving jump', () => {
  const ledge = { ...field, bounds: undefined, islands: [{ x: 0, z: 0, y: 0, r: 3 }] };
  const s = new Simulation(ledge);
  Object.assign(s.player, { z: 2.98, angle: 0 });
  s.update(1 / 60, { charge: true });
  s.update(1 / 60, { charge: true });
  assert.equal(s.player.grounded, false);
  s.update(1 / 60, { jump: true });
  assert.ok(s.player.vy > 8);
  assert.equal(s.player.gliding, false);
});

test('a second airborne tap still opens glide and held jump does not repeat on landing', () => {
  const s = new Simulation(field);
  s.update(1 / 60, { jump: true });
  step(s, 5);
  s.update(1 / 60, { jump: true });
  assert.ok(s.player.gliding);
  step(s, 500, { jump: true });
  assert.ok(s.player.grounded);
  assert.equal(s.drain().filter((e) => e.type === 'jump').length, 1);
});

test('stride advances from actual movement and stops at a wall or after release', () => {
  const s = new Simulation(field);
  step(s, 30, { z: -1 });
  const stride = s.player.stride;
  assert.ok(stride > 1);
  step(s, 20);
  const stopped = s.player.stride;
  step(s, 30);
  assert.equal(s.player.stride, stopped);
  Object.assign(s.player, { x: 99.4, z: 0, angle: Math.PI / 2 });
  step(s, 20, { charge: true });
  const atWall = s.player.stride;
  step(s, 30, { charge: true });
  assert.equal(s.player.stride, atWall);
});

test('charge pose eases in and recovers while turning exposes a bounded lean signal', () => {
  const s = new Simulation(field);
  s.update(1 / 60, { charge: true });
  assert.ok(s.player.chargeBlend > 0 && s.player.chargeBlend < 0.5);
  step(s, 30, { charge: true, x: 1 });
  assert.ok(Math.abs(s.player.turnRate) > 0);
  step(s, 60);
  assert.ok(s.player.chargeBlend < 0.001 && Math.abs(s.player.turnRate) < 0.001);
});

test('a quick tap queued between frames still makes a short jump', () => {
  const s = new Simulation(field);
  s.update(1 / 60, { jumpPressed: true, jump: false });
  let peak = s.player.y;
  for (let i = 0; i < 70; i++) {
    s.update(1 / 60);
    peak = Math.max(peak, s.player.y);
  }
  assert.ok(peak > 0.65 && peak < 1.25);
});

test('a sharp charge turn eases speed and regains it after the corner', () => {
  const s = new Simulation(field);
  step(s, 40, { charge: true });
  const top = Math.hypot(s.player.vx, s.player.vz);
  s.update(1 / 60, { charge: true, x: 1 });
  assert.ok(Math.hypot(s.player.vx, s.player.vz) < top - 0.5);
  step(s, 80, { charge: true, x: 1 });
  assert.ok(Math.hypot(s.player.vx, s.player.vz) > 14);
});
