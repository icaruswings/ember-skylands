import test from 'node:test';
import assert from 'node:assert/strict';
const setup = async (targets = [], options = {}) => {
  const { FlightSimulation } = await import('../dist/engine/flight.js');
  return new FlightSimulation(
    {
      id: 'test-flight',
      kind: 'flight',
      spawn: { x: 0, y: 20, z: 20, angle: Math.PI },
      bounds: { minX: -200, maxX: 200, minZ: -200, maxZ: 200, minY: 4, maxY: 70 },
      targets,
      ...options.course,
    },
    options,
  );
};
const step = (s, n, input = {}) => {
  for (let i = 0; i < n; i++) s.update(1 / 60, input);
};
test('full flight carries forward at constant altitude with a neutral stick', async () => {
  const s = await setup();
  step(s, 60);
  assert.ok(s.player.z < 5);
  assert.ok(Math.abs(s.player.y - 20) < 0.01);
  assert.equal(s.player.grounded, false);
});
test('right input turns right and up climbs; inverted up dives', async () => {
  const s = await setup();
  step(s, 30, { viewX: 1, viewZ: -1 });
  assert.ok(s.player.x > 1);
  assert.ok(s.player.y > 21);
  const inverted = await setup([], { inverted: true });
  step(inverted, 30, { viewZ: -1 });
  assert.ok(inverted.player.y < 19);
});
test('releasing climb levels the wings and boost is faster', async () => {
  const s = await setup();
  step(s, 30, { viewZ: -1 });
  step(s, 60);
  const y = s.player.y;
  step(s, 60);
  assert.ok(Math.abs(s.player.y - y) < 0.02);
  const normal = await setup(),
    fast = await setup();
  step(normal, 60);
  step(fast, 60, { charge: true });
  assert.ok(fast.player.z < normal.player.z - 4);
});
test('practice recovery never loses health, progress or position bounds', async () => {
  const s = await setup([
    { id: 'chest', kind: 'chest', x: 100, y: 20, z: 0 },
    { id: 'later', kind: 'chest', x: -100, y: 20, z: 0 },
  ]);
  s.collectedTargets.add('chest');
  step(s, 1800, { viewZ: 1, charge: true });
  const p = s.player;
  assert.equal(p.health, 3);
  assert.ok(p.y >= 4 && p.y <= 70);
  assert.ok(Math.abs(p.x) <= 200 && Math.abs(p.z) <= 200);
  assert.ok(s.collectedTargets.has('chest'));
  assert.equal(s.result, null);
});
test('a fast swept arch crossing counts once and does not require flame', async () => {
  const s = await setup([
    { id: 'arch', kind: 'arch', x: 0, y: 20, z: 16, radius: 6, normal: { x: 0, y: 0, z: 1 } },
    { id: 'later', kind: 'arch', x: 0, y: 20, z: -100, radius: 6, normal: { x: 0, y: 0, z: 1 } },
  ]);
  s.update(0.5, {});
  assert.ok(s.collectedTargets.has('arch'));
  assert.equal(s.collectedTargets.size, 1);
  s.update(0.5, {});
  assert.equal(s.collectedTargets.size, 1);
});
test('flame targets require fire in the forward three-dimensional cone', async () => {
  const targets = [
    { id: 'front', kind: 'chest', x: 0, y: 21, z: 12 },
    { id: 'behind', kind: 'barrel', x: 0, y: 21, z: 26 },
    { id: 'above', kind: 'plane', x: 0, y: 45, z: 12 },
  ];
  const s = await setup(targets);
  s.update(1 / 60, {});
  assert.equal(s.collectedTargets.size, 0);
  s.update(1 / 60, { flamePressed: true });
  assert.ok(s.collectedTargets.has('front'));
  assert.ok(!s.collectedTargets.has('behind'));
  assert.ok(!s.collectedTargets.has('above'));
});
test('moving planes and barrels update their positions deterministically', async () => {
  const s = await setup([
    {
      id: 'moving',
      kind: 'plane',
      x: 40,
      y: 22,
      z: 0,
      motion: { cx: 0, cz: 0, radius: 40, phase: Math.PI / 2, speed: 0.2 },
    },
  ]);
  const before = { ...s.targets[0] };
  step(s, 60);
  assert.ok(Math.hypot(s.targets[0].x - before.x, s.targets[0].z - before.z) > 3);
});
test('practice has no deadline; timed targets add seconds and timeout freezes the attempt', async () => {
  const p = await setup([{ id: 'far', kind: 'chest', x: 180, y: 20, z: 0 }]);
  step(p, 6000);
  assert.equal(p.result, null);
  assert.equal(p.remaining, null);
  const s = await setup(
    [
      { id: 'arch', kind: 'arch', x: 0, y: 20, z: 16, radius: 6, normal: { x: 0, y: 0, z: 1 } },
      { id: 'far', kind: 'chest', x: 180, y: 20, z: 0 },
    ],
    { timed: true, timeLimit: 1 },
  );
  s.update(0.5, {});
  assert.ok(s.remaining > 2);
  step(s, 300);
  assert.equal(s.result, 'timeout');
  const time = s.time;
  step(s, 60);
  assert.equal(s.time, time);
});
test('completion emits once; retry restores targets, time and motion', async () => {
  const s = await setup(
    [{ id: 'arch', kind: 'arch', x: 0, y: 20, z: 16, radius: 6, normal: { x: 0, y: 0, z: 1 } }],
    { timed: true },
  );
  s.update(0.5, {});
  assert.equal(s.result, 'complete');
  step(s, 30);
  assert.equal(s.drain().filter((e) => e.type === 'flight-complete').length, 1);
  s.restart();
  assert.equal(s.result, null);
  assert.equal(s.collectedTargets.size, 0);
  assert.equal(s.time, 0);
  assert.equal(s.player.z, 20);
});
test('loop and turnaround preserve targets and give deliberate flight manoeuvres', async () => {
  const s = await setup([{ id: 'far', kind: 'chest', x: 150, y: 20, z: 0 }]);
  s.update(1 / 60, { jumpPressed: true });
  assert.ok(s.player.loop > 0);
  step(s, 90);
  assert.equal(s.player.loop, 0);
  const before = s.player.angle;
  s.update(1 / 60, { turnPressed: true });
  step(s, 60);
  const delta = Math.atan2(Math.sin(s.player.angle - before), Math.cos(s.player.angle - before));
  assert.ok(Math.abs(delta) > 3);
  assert.equal(s.collectedTargets.size, 0);
});
test('Sunny Flight provides four complete groups of eight distinct targets', async () => {
  const { FLIGHT_COURSE } = await import('../dist/game/flight-course.js');
  assert.equal(FLIGHT_COURSE.targets.length, 32);
  assert.equal(new Set(FLIGHT_COURSE.targets.map((t) => t.id)).size, 32);
  for (const kind of ['arch', 'chest', 'barrel', 'plane'])
    assert.equal(FLIGHT_COURSE.targets.filter((t) => t.kind === kind).length, 8);
});

test('the authored timed course can be completed using steering, pitch and flame without teleporting', async () => {
  const { FlightSimulation } = await import('../dist/engine/flight.js');
  const { FLIGHT_COURSE } = await import('../dist/game/flight-course.js');
  const s = new FlightSimulation(FLIGHT_COURSE, { timed: true });
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  let target;
  for (let i = 0; i < 60 * 190 && !s.result; i++) {
    if (!target || s.collectedTargets.has(target.id))
      target = s.targets.find((t) => !s.collectedTargets.has(t.id));
    const p = s.player,
      dx = target.x - p.x,
      dz = target.z - p.z;
    const desired = Math.atan2(dx, dz);
    const error = Math.atan2(Math.sin(desired - p.angle), Math.cos(desired - p.angle));
    const pitch = Math.atan2(target.y - p.y, Math.max(5, Math.hypot(dx, dz)));
    s.update(1 / 60, {
      viewX: clamp(-error * 3),
      viewZ: clamp(-pitch / 0.7),
      flamePressed: i % 20 === 0,
    });
  }
  assert.equal(s.result, 'complete');
  assert.equal(s.collectedTargets.size, 32);
  assert.ok(s.time < 90);
  assert.equal(s.drain().filter((e) => e.type === 'flight-recover').length, 0);
});
