import test from 'node:test';
import assert from 'node:assert/strict';
import { LANDS } from '../dist/game/lands.js';
import { blockedByObstacle } from '../dist/engine/terrain.js';
import { Simulation, terrainHeight } from '../dist/engine/simulation.js';

test('ground lands have distinct closed exploration circuits and wide optional routes', () => {
  const signatures = new Set();
  for (const land of LANDS) {
    assert.ok(land.mainLoop?.length >= 8, `${land.id}: authored loop missing`);
    assert.deepEqual(land.mainLoop[0], land.mainLoop.at(-1));
    signatures.add(JSON.stringify(land.mainLoop));
    assert.ok(land.paths.every((p) => p[4] >= 6));
    assert.ok(land.regions.length >= 3);
    assert.equal(land.secrets.length, 2);
    assert.equal(new Set(land.secrets.map((s) => s.id)).size, 2);
  }
  assert.equal(signatures.size, 3, 'each land needs its own route');
  assert.equal(new Set(LANDS.map((l) => JSON.stringify(l.hills))).size, 3);
});

test('new treasure pockets preserve all old progress identifiers', () => {
  for (const land of LANDS) {
    assert.equal(land.gems.length, 88);
    assert.equal(land.chests.length, 10);
    assert.equal(land.enemies.length, 12);
    assert.equal(land.rescues.length, 3);
    const ids = new Set(land.gems.map((g) => g.id));
    assert.equal(ids.size, 88);
    for (let i = 0; i < 48; i++) assert.ok(ids.has(`gem-${i}`));
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 2; j++) assert.ok(ids.has(`chest-${i}-gem-${j}`));
    for (let i = 0; i < 12; i++) assert.ok(ids.has(`enemy-${i}-gem`));
    for (const secret of land.secrets) {
      assert.equal(land.gems.filter((g) => g.secretId === secret.id).length, 6);
      assert.equal(land.chests.filter((c) => c.secretId === secret.id).length, 1);
    }
  }
});

test('all objectives and wide secret entrances are clear of solid scenery', () => {
  for (const land of LANDS) {
    assert.ok(land.secrets?.length, 'secret entrances missing');
    for (const item of [
      land.spawn,
      ...land.gems,
      ...land.chests,
      ...land.rescues,
      ...land.enemies,
      ...land.portals,
      ...land.secrets,
    ])
      assert.equal(
        blockedByObstacle(land, item.x, item.z, item.y, 1.2),
        false,
        `${land.id}:${item.id || 'spawn'}`,
      );
    for (const secret of land.secrets) {
      for (const offset of [-2.5, 0, 2.5])
        assert.equal(
          blockedByObstacle(land, secret.entry[0] + offset, secret.entry[1], secret.y, 0.6),
          false,
        );
    }
  }
});

function drive(s, points) {
  for (const [x, z] of points) {
    let reached = false;
    for (let frame = 0; frame < 1200; frame++) {
      const dx = x - s.player.x,
        dz = z - s.player.z,
        d = Math.hypot(dx, dz);
      if (d < 1.1) {
        reached = true;
        break;
      }
      s.update(1 / 60, { x: dx / d, z: dz / d, charge: d > 4, flame: frame % 45 < 20 });
      assert.equal(s.player.grounded, true, `${s.level.id}: route requires a jump`);
      assert.equal(s.player.y, terrainHeight(s.level, s.player.x, s.player.z));
    }
    assert.ok(
      reached,
      `${s.level.id}: blocked driving to ${x},${z} at ${s.player.x},${s.player.z}`,
    );
  }
}

test('driving each main loop earns the medal without optional treasures or jumps', () => {
  for (const land of LANDS) {
    // Navigation regression: enemies are tested separately, with their geometry unchanged here.
    const s = new Simulation(land, { version: 1, enemies: land.enemies.map((e) => e.id) });
    drive(s, land.mainLoop.slice(1));
    assert.equal(s.rescued.size, 3, `${land.id}: friends must lie on the circuit`);
    assert.ok(s.collected.size >= 30, `${land.id}: main route must offer enough treasure`);
    assert.equal(s.unlocked, true);
    assert.equal(s.player.health, 3);
    assert.equal(
      s.collected.size && [...s.collected].some((id) => id.startsWith('secret-')),
      false,
    );
  }
});

test('every optional branch can be driven from its main-loop junction with real collision', () => {
  for (const land of LANDS)
    for (const branch of land.branches) {
      const s = new Simulation(land, { version: 1, enemies: land.enemies.map((e) => e.id) });
      const junction = land.mainLoop.findIndex(
        ([x, z]) => x === branch[0][0] && z === branch[0][1],
      );
      assert.ok(junction >= 0, 'branch must join the main route');
      drive(s, land.mainLoop.slice(1, junction + 1));
      drive(s, branch.slice(1));
      assert.equal(s.player.health, 3);
    }
});
