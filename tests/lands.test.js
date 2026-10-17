import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, terrainHeight } from '../dist/engine/simulation.js';
const field = {
  bounds: { minX: -60, maxX: 60, minZ: -60, maxZ: 60, floorY: 0 },
  islands: [],
  bridges: [],
  obstacles: [],
  enemies: [],
  gems: [],
  rescues: [],
  spawn: { x: 0, y: 0, z: 0 },
  portal: { x: 0, y: 0, z: -40 },
  goal: { gems: 1, rescues: 1 },
};
test('bounded ground remains under a full-speed charge in every direction', () => {
  for (const angle of [0, 0.4, Math.PI / 2, Math.PI, Math.PI * 1.7]) {
    const s = new Simulation(field);
    s.player.angle = angle;
    for (let i = 0; i < 1800; i++) {
      s.update(1 / 60, { charge: true });
      assert.equal(s.player.y, 0);
      assert.equal(s.player.health, 3);
    }
    assert.equal(s.player.y, 0);
    assert.equal(s.player.health, 3);
    assert.ok(s.player.x >= -60 && s.player.x <= 60 && s.player.z >= -60 && s.player.z <= 60);
  }
});
test('jumping and gliding at a boundary cannot escape a forgiving ground land', () => {
  const s = new Simulation(field);
  Object.assign(s.player, { x: 59, z: 59, angle: Math.PI / 4 });
  s.update(1 / 60, { charge: true, jump: true });
  for (let i = 0; i < 20; i++) s.update(1 / 60, { charge: true });
  s.update(1 / 60, { jump: true });
  for (let i = 0; i < 1000; i++) s.update(1 / 60);
  assert.ok(s.player.x <= 60 && s.player.z <= 60);
  assert.equal(s.player.health, 3);
  assert.equal(s.player.y, 0);
});
test('all three ground lands have broad flat routes and reachable objectives', async () => {
  const { LANDS } = await import('../dist/game/lands.js');
  assert.equal(LANDS.length, 3);
  assert.deepEqual(
    LANDS.map((l) => l.name),
    ['Artisans', 'Peace Keepers', 'Magic Crafters'],
  );
  for (const land of LANDS) {
    assert.ok(land.bounds.maxX - land.bounds.minX >= 116);
    assert.equal(land.ramps.length, 0);
    assert.equal(land.bridges.length, 0);
    assert.ok(land.enemies.length >= 12);
    assert.ok(land.rescues.length >= 3);
    for (const item of [
      ...land.gems,
      ...land.chests,
      ...land.enemies,
      ...land.rescues,
      ...land.portals,
    ])
      assert.equal(terrainHeight(land, item.x, item.z), 0, item.id);
    for (const x of [-50, -25, 0, 25, 50])
      for (const z of [-50, -25, 0, 25, 50]) assert.equal(terrainHeight(land, x, z), 0);
  }
});
test('ground travel portals are available without gem or rescue gates', async () => {
  const { LANDS } = await import('../dist/game/lands.js');
  const s = new Simulation(LANDS[0]);
  const portal = LANDS[0].portals.find((p) => p.destination === 'peace-keepers');
  Object.assign(s.player, portal);
  assert.equal(s.nearestInteraction().destination, 'peace-keepers');
  assert.equal(s.interact().type, 'travel');
});
