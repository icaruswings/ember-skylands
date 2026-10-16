import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../dist/engine/simulation.js';
import { ChaseCamera } from '../dist/engine/chase-camera.js';
const field = {
  islands: [{ x: 0, y: 0, z: 0, r: 100 }],
  bridges: [],
  obstacles: [],
  enemies: [],
  gems: [],
  rescues: [],
  spawn: { x: 0, y: 0, z: 0 },
  portal: { x: 50, y: 0, z: 0 },
  goal: { gems: 1, rescues: 1 },
};
const step = (s, input, n) => {
  for (let i = 0; i < n; i++) s.update(1 / 60, input);
};
test('running ramps up quickly and brakes within a safe fraction of a ramp width', () => {
  const s = new Simulation(field);
  s.update(1 / 60, { z: -1 });
  assert.ok(Math.abs(s.player.vz) < 2);
  step(s, { z: -1 }, 30);
  assert.ok(Math.abs(s.player.vz) > 6.5);
  const z = s.player.z;
  step(s, {}, 12);
  assert.equal(Math.hypot(s.player.vx, s.player.vz), 0);
  assert.ok(Math.abs(s.player.z - z) < 0.35);
});
test('ground turns take the short arc and slow down through sharp reversals', () => {
  const s = new Simulation(field);
  step(s, { z: -1 }, 30);
  const before = s.player.angle;
  s.update(1 / 60, { z: 1 });
  assert.ok(
    Math.abs(Math.atan2(Math.sin(s.player.angle - before), Math.cos(s.player.angle - before))) <
      0.3,
  );
  step(s, { z: 1 }, 60);
  assert.ok(s.player.vz > 6.5);
});
test('charge drives forward without a stick and uses a bounded steering arc', () => {
  const s = new Simulation(field);
  step(s, { charge: true }, 40);
  assert.ok(s.player.z < -7);
  assert.ok(Math.hypot(s.player.vx, s.player.vz) > 14);
  const angle = s.player.angle;
  s.update(1 / 60, { charge: true, x: 1 });
  assert.ok(
    Math.abs(Math.atan2(Math.sin(s.player.angle - angle), Math.cos(s.player.angle - angle))) < 0.12,
  );
});
test('slow walking and side input keep the camera stable during ramp corrections', () => {
  const c = new ChaseCamera(),
    p = {
      x: 0,
      y: 0,
      z: 0,
      angle: Math.PI / 2,
      vx: 2,
      vz: 0,
      grounded: true,
      viewX: 0,
      viewZ: -0.3,
    };
  for (let i = 0; i < 120; i++) c.update(1 / 60, p);
  assert.ok(Math.abs(c.angle) < 0.01);
  p.vx = 7;
  p.viewX = 1;
  p.viewZ = 0;
  for (let i = 0; i < 120; i++) c.update(1 / 60, p);
  assert.ok(Math.abs(c.angle) < 0.01);
});
test('horizontal camera framing matches its input angle while moving sideways', () => {
  const c = new ChaseCamera(),
    p = { x: 0, y: 0, z: 0, angle: Math.PI, vx: 0, vz: 0, viewX: 1, viewZ: 0, grounded: true };
  c.update(1 / 60, p);
  p.x = 3;
  c.update(1 / 60, p);
  const actual = Math.atan2(c.x - c.targetX, c.z - c.targetZ);
  assert.ok(Math.abs(actual - c.angle) < 0.001);
});

test('recenter settles behind a stationary dragon and manual orbit cancels it', () => {
  const c = new ChaseCamera(),
    p = { x: 0, y: 0, z: 0, angle: Math.PI / 2, vx: 0, vz: 0, viewX: 0, viewZ: 0 };
  c.update(1 / 60, p, 0, true);
  for (let i = 0; i < 30; i++) c.update(1 / 60, p);
  const delta = Math.atan2(
    Math.sin(c.angle - p.angle - Math.PI),
    Math.cos(c.angle - p.angle - Math.PI),
  );
  assert.ok(Math.abs(delta) < 0.025);
  c.update(1 / 60, p, 0, true);
  c.update(1 / 60, p, 0.5);
  const angle = c.angle;
  for (let i = 0; i < 20; i++) c.update(1 / 60, p);
  assert.equal(c.angle, angle);
});
test('analogue walking climbs both ramps and stops safely on the landing', async () => {
  const { LEVEL } = await import('../dist/game/level.js');
  const s = new Simulation(LEVEL);
  Object.assign(s.player, { x: -7, y: 0, z: -6 });
  const c = new ChaseCamera();
  const { shapeStick } = await import('../dist/engine/input.js');
  for (const [x, z] of [
    [-13, -6],
    [-13, -3],
    [-15, -1],
  ]) {
    let reached = false;
    for (let i = 0; i < 1500; i++) {
      const dx = x - s.player.x,
        dz = z - s.player.z,
        d = Math.hypot(dx, dz);
      if (d < 0.15) {
        reached = true;
        break;
      }
      const cs = Math.cos(c.angle),
        sn = Math.sin(c.angle);
      const stick = shapeStick(((dx * cs - dz * sn) / d) * 0.6, ((dz * cs + dx * sn) / d) * 0.6);
      s.update(1 / 60, {
        viewX: stick.x,
        viewZ: stick.z,
        x: stick.x * cs + stick.z * sn,
        z: stick.z * cs - stick.x * sn,
      });
      c.update(1 / 60, s.player);
    }
    assert.ok(reached, 'analogue route reaches each corner');
    step(s, {}, 12);
    assert.equal(s.player.grounded, true);
  }
  assert.ok(s.player.y > 5.9);
});

test('holding a slight forward diagonal cannot feed the camera into circles', () => {
  const s = new Simulation(field),
    c = new ChaseCamera();
  const viewX = Math.sin(0.29),
    viewZ = -Math.cos(0.29);
  for (let i = 0; i < 600; i++) {
    const cs = Math.cos(c.angle),
      sn = Math.sin(c.angle);
    s.update(1 / 60, { viewX, viewZ, x: viewX * cs + viewZ * sn, z: viewZ * cs - viewX * sn });
    c.update(1 / 60, s.player);
  }
  assert.ok(Math.hypot(s.player.x, s.player.z) > 65, 'held diagonal travels across the field');
  assert.ok(Math.abs(c.angle) < 0.02, 'camera must preserve the chosen walking direction');
});
