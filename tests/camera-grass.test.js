import test from 'node:test';
import assert from 'node:assert/strict';

test('camera trails the dragon at a low angle and looks ahead', async () => {
  const { ChaseCamera } = await import('../dist/engine/chase-camera.js');
  const c = new ChaseCamera(),
    p = { x: 3, y: 0, z: 5, angle: Math.PI, vx: 0, vz: -7 };
  for (let i = 0; i < 180; i++) c.update(1 / 60, p);
  assert.ok(c.z > p.z + 6);
  assert.ok(c.y < 3.5);
  assert.ok(c.targetZ < p.z);
});
test('camera follows a new heading along the shortest angle', async () => {
  const { ChaseCamera } = await import('../dist/engine/chase-camera.js');
  const c = new ChaseCamera();
  const p = { x: 0, y: 0, z: 0, angle: 0, vx: 0, vz: 7 };
  for (let i = 0; i < 200; i++) c.update(1 / 60, p);
  assert.ok(c.z < -6);
  c.angle = Math.PI - 0.01;
  p.angle = 0.01;
  c.update(1 / 60, p);
  assert.ok(Math.abs(c.angle - (Math.PI - 0.01)) < 0.1);
});
test('manual orbit holds briefly and recovers during movement', async () => {
  const { ChaseCamera } = await import('../dist/engine/chase-camera.js');
  const c = new ChaseCamera();
  const p = { x: 0, y: 0, z: 0, angle: Math.PI, vx: 0, vz: -7 };
  c.update(1 / 60, p, 1);
  const angle = c.angle;
  for (let i = 0; i < 30; i++) c.update(1 / 60, p);
  assert.equal(c.angle, angle);
  for (let i = 0; i < 250; i++) c.update(1 / 60, p);
  assert.ok(Math.abs(Math.atan2(Math.sin(c.angle), Math.cos(c.angle))) < 0.03);
});
test('jump tracking preserves a steady vertical viewing angle', async () => {
  const { ChaseCamera } = await import('../dist/engine/chase-camera.js');
  const c = new ChaseCamera(),
    p = { x: 0, y: 0, z: 0, angle: Math.PI, vx: 0, vz: 0 };
  c.update(1 / 60, p);
  const height = c.y - c.targetY;
  p.y = 5;
  for (let i = 0; i < 30; i++) {
    c.update(1 / 60, p);
    assert.ok(Math.abs(c.y - c.targetY - height) < 0.001);
  }
});
test('grass only singes in the forward flame footprint', async () => {
  const { GrassField } = await import('../dist/engine/grass-field.js');
  const points = [
    { x: 0, y: 0, z: 2 },
    { x: 0, y: 0, z: -2 },
    { x: 4, y: 0, z: 2 },
    { x: 0, y: 5, z: 2 },
  ];
  const f = new GrassField(points);
  f.singe({ x: 0, y: 0, z: 0, angle: 0 }, 0.1);
  assert.ok(f.burn[0] > 0);
  assert.equal(f.burn[1], 0);
  assert.equal(f.burn[2], 0);
  assert.equal(f.burn[3], 0);
});
test('singed blades remain short with bounded burn state after repeated fire', async () => {
  const { GrassField } = await import('../dist/engine/grass-field.js');
  const f = new GrassField([{ x: 0, y: 0, z: 2 }]);
  const p = { x: 0, y: 0, z: 0, angle: 0 };
  for (let i = 0; i < 100; i++) f.singe(p, 0.05);
  assert.equal(f.burn[0], 1);
  f.singe({ ...p, angle: Math.PI }, 0.05);
  assert.equal(f.burn[0], 1);
});
