import test from 'node:test';
import assert from 'node:assert/strict';
import { LANDS } from '../dist/game/lands.js';
import { Simulation, terrainHeight } from '../dist/engine/simulation.js';
import { updateEnemy } from '../dist/engine/enemy-ai.js';

test('each valley has visible rolling hills with gentle continuous slopes', () => {
  for (const land of LANDS) {
    let low = Infinity,
      high = -Infinity;
    for (let x = -55; x <= 55; x += 2)
      for (let z = -55; z <= 55; z += 2) {
        const y = terrainHeight(land, x, z);
        low = Math.min(low, y);
        high = Math.max(high, y);
        const dx = (terrainHeight(land, x + 0.01, z) - y) / 0.01;
        const dz = (terrainHeight(land, x, z + 0.01) - y) / 0.01;
        assert.ok(Math.hypot(dx, dz) < 0.28, `${land.id}: slope too steep`);
      }
    assert.ok(high - low > 2.5, `${land.id}: hills should be visible`);
    for (const item of [
      land.spawn,
      ...land.enemies,
      ...land.chests,
      ...land.rescues,
      ...land.portals,
    ])
      assert.equal(item.y, terrainHeight(land, item.x, item.z));
    for (const gem of land.gems)
      assert.ok(Math.abs(gem.y - terrainHeight(land, gem.x, gem.z) - 0.8) < 1e-10);
  }
});

test('charging uphill and downhill stays planted without jumps or health loss', () => {
  for (const land of LANDS) {
    const clear = { ...land, enemies: [], chests: [], gems: [], rescues: [], obstacles: [] };
    for (const angle of [0, 0.6, 1.3, 2.2, 3.6, 4.8]) {
      const s = new Simulation(clear);
      s.player.angle = angle;
      for (let i = 0; i < 900; i++) {
        s.update(1 / 60, { charge: true });
        assert.equal(s.player.grounded, true);
        assert.equal(s.player.y, terrainHeight(land, s.player.x, s.player.z));
        assert.equal(s.player.health, 3);
      }
    }
  }
});

test('patrolling enemies follow hill height instead of sinking into terrain', () => {
  for (const land of LANDS) {
    const e = { ...land.enemies[0], homeX: land.enemies[0].x, homeZ: land.enemies[0].z, phase: 0 };
    for (let i = 0; i < 600; i++) {
      updateEnemy(e, { x: 55, z: 55, y: 0 }, 1 / 60, land);
      assert.equal(e.y, terrainHeight(land, e.x, e.z));
    }
  }
});

test('rendered terrain and path vertices use the collision height surface', async () => {
  const { terrainGeometry, pathGeometry } = await import('../dist/game/terrain-mesh.js');
  for (const land of LANDS) {
    for (const [geometry, offset] of [
      [terrainGeometry(land), 0],
      ...land.paths.map((p) => [pathGeometry(land, p), 0.045]),
    ]) {
      const p = geometry.attributes.position;
      for (let i = 0; i < p.count; i++)
        assert.ok(
          Math.abs(p.getY(i) - terrainHeight(land, p.getX(i), p.getZ(i)) - offset) < 0.00001 ||
            Math.abs(p.getX(i)) > 58 ||
            Math.abs(p.getZ(i)) > 58,
        );
      const normals = geometry.attributes.normal;
      for (let i = 0; i < normals.count; i++)
        assert.ok(normals.getY(i) > 0.95, 'upward gentle terrain normals');
      geometry.dispose();
    }
  }
});
