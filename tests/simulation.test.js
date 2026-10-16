import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Simulation,
  terrainHeight,
  validSave,
  FixedClock,
  ScriptSystem,
} from '../dist/engine/simulation.js';
import { LEVEL } from '../dist/game/level.js';
const step = (s, input = {}, n = 60) => {
  for (let i = 0; i < n; i++) s.update(1 / 60, input);
};
test('movement is normalized and charge is faster', () => {
  const a = new Simulation(LEVEL),
    b = new Simulation(LEVEL);
  step(a, { x: 1, z: 1 });
  step(b, { x: 1, z: 0, charge: true });
  assert.ok(Math.hypot(a.player.x, a.player.z - 10) < 8);
  assert.ok(b.player.x > a.player.x * 1.5);
});
test('jump leaves ground, glide slows descent, and lands', () => {
  const s = new Simulation(LEVEL);
  s.update(1 / 60, { jump: true });
  assert.ok(s.player.y > 0);
  step(s, {}, 20);
  s.update(1 / 60, { jump: true });
  assert.equal(s.player.gliding, true);
  step(s, {}, 25);
  assert.ok(s.player.vy >= -2.21);
  step(s, {}, 300);
  assert.equal(s.player.grounded, true);
});
test('islands and bridges provide walkable terrain; void does not', () => {
  assert.equal(terrainHeight(LEVEL, 0, 0), 0);
  assert.equal(terrainHeight(LEVEL, 34, -20), 3);
  assert.equal(terrainHeight(LEVEL, 100, 100), null);
  assert.ok(terrainHeight(LEVEL, 23, -14) !== null);
});
test('gem collection is idempotent', () => {
  const s = new Simulation(LEVEL);
  const g = LEVEL.gems[0];
  Object.assign(s.player, { x: g.x, z: g.z, y: g.y });
  step(s, {}, 2);
  const n = s.collected.size;
  step(s, {}, 2);
  assert.equal(s.collected.size, n);
  assert.ok(s.collected.has(g.id));
});
test('armored sentinels require charge, giants require flame', () => {
  const s = new Simulation(LEVEL);
  assert.equal(s.hitEnemy('enemy-0', 'flame'), false);
  assert.equal(s.hitEnemy('enemy-0', 'charge'), true);
  assert.equal(s.hitEnemy('enemy-1', 'charge'), false);
  assert.equal(s.hitEnemy('enemy-1', 'flame'), true);
});
test('damage has invulnerability and death uses checkpoint', () => {
  const s = new Simulation(LEVEL);
  s.damage();
  s.damage();
  assert.equal(s.player.health, 2);
  s.player.invincible = 0;
  s.damage();
  s.player.invincible = 0;
  s.damage();
  assert.equal(s.player.health, 3);
  assert.equal(s.player.x, s.checkpoint.x);
});
test('falling recovers at a checkpoint', () => {
  const s = new Simulation(LEVEL);
  s.player.x = 100;
  s.player.y = -20;
  step(s, {}, 1);
  assert.equal(s.player.x, s.checkpoint.x);
  assert.equal(s.player.health, 2);
});
test('rescue requires proximity and is idempotent', () => {
  const s = new Simulation(LEVEL);
  assert.equal(s.interact(), null);
  const r = LEVEL.rescues[0];
  Object.assign(s.player, { x: r.x, z: r.z, y: r.y });
  assert.equal(s.interact().type, 'rescue');
  assert.equal(s.rescued.size, 1);
  s.interact();
  assert.equal(s.rescued.size, 1);
});
test('portal requires three rescues and thirty gems', () => {
  const s = new Simulation(LEVEL);
  Object.assign(s.player, LEVEL.portal);
  assert.equal(s.interact().type, 'locked');
  LEVEL.rescues.forEach((r) => s.rescued.add(r.id));
  LEVEL.gems.slice(0, 30).forEach((g) => s.collected.add(g.id));
  assert.equal(s.interact().type, 'complete');
  assert.equal(s.complete, true);
});
test('save validation drops invalid identifiers and corrupt input', () => {
  assert.deepEqual(validSave(null, LEVEL), {
    gems: [],
    rescues: [],
    enemies: [],
    chests: [],
    complete: false,
  });
  const v = validSave(
    {
      version: 1,
      gems: [LEVEL.gems[0].id, 'bad', LEVEL.gems[0].id],
      rescues: [],
      enemies: [],
      complete: true,
    },
    LEVEL,
  );
  assert.equal(v.gems.length, 1);
  assert.equal(v.complete, false);
});
test('restore preserves real progress', () => {
  const s = new Simulation(LEVEL);
  s.collected.add(LEVEL.gems[0].id);
  const b = new Simulation(LEVEL, s.save());
  assert.equal(b.collected.size, 1);
});
test('fixed clock caps catch-up after suspended tab', () => {
  const c = new FixedClock();
  let n = 0;
  c.advance(10, () => n++);
  assert.ok(n <= 8);
  assert.ok(n > 0);
});
test('declarative scripts fire once', () => {
  let n = 0;
  const scripts = new ScriptSystem([
    { id: 'a', when: (s) => s.rescued.size === 1, run: () => n++ },
  ]);
  const s = new Simulation(LEVEL);
  scripts.update(s);
  s.rescued.add('spirit-0');
  scripts.update(s);
  scripts.update(s);
  assert.equal(n, 1);
});
test('complete adventure is reachable by moving through bridges without teleporting', () => {
  const s = new Simulation(LEVEL);
  const walk = (x, z) => {
    for (let n = 0; n < 2400; n++) {
      const dx = x - s.player.x,
        dz = z - s.player.z,
        d = Math.hypot(dx, dz);
      if (d < 0.4) return;
      // Release charge for close pickups and sharp corners, as a player would.
      s.update(1 / 60, {
        x: dx / d,
        z: dz / d,
        flame: n % 28 === 0,
        charge: d > 5 && Math.cos(Math.atan2(dx, dz) - s.player.angle) > 0.95,
      });
    }
    assert.fail(`Cannot reach ${x},${z}; player at ${s.player.x},${s.player.z}`);
  };
  for (const g of LEVEL.gems.slice(0, 20)) walk(g.x, g.z);
  walk(12, 1);
  assert.ok(s.rescued.has(LEVEL.rescues[0].id));
  walk(14, -8);
  walk(27, -16);
  for (const g of LEVEL.gems.slice(20, 40)) walk(g.x, g.z);
  walk(38, -23);
  assert.ok(s.rescued.has(LEVEL.rescues[1].id));
  walk(27, -16);
  walk(14, -8);
  walk(0, 0);
  walk(-14, -10);
  walk(-24, -20);
  walk(-33, -27);
  assert.ok(s.rescued.has(LEVEL.rescues[2].id));
  walk(-24, -20);
  walk(-14, -10);
  walk(-7, -6);
  walk(0, -7.5);
  assert.ok(s.unlocked);
  assert.equal(s.interact()?.type, 'complete');
  assert.ok(s.complete);
});
test('bridge ramps permit climbing without jumping', () => {
  const s = new Simulation(LEVEL);
  Object.assign(s.player, { x: -14, z: -10, y: 0 });
  for (let i = 0; i < 140; i++) s.update(1 / 60, { x: -Math.SQRT1_2, z: -Math.SQRT1_2 });
  assert.ok(s.player.y > 6);
  assert.equal(s.player.grounded, true);
});
test('gliding without stick input carries the dragon forward', () => {
  const s = new Simulation(LEVEL);
  s.update(1 / 60, { jump: true });
  step(s, {}, 20);
  s.update(1 / 60, { jump: true });
  const z = s.player.z;
  step(s, {}, 15);
  assert.ok(s.player.z < z - 1);
});
