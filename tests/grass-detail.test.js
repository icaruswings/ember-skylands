import test from 'node:test';
import assert from 'node:assert/strict';
import { Group } from '../dist/assets/three.module.js';
import { createGrass } from '../dist/game/grass.js';
test('balanced vegetation keeps nearby gardens dense and reduces distant grass work', () => {
  const level = {
    islands: [
      { id: 'near', x: 0, z: 0, y: 0, r: 5, tuftCount: 100 },
      { id: 'far', x: 40, z: 0, y: 0, r: 5, tuftCount: 100 },
    ],
    obstacles: [],
    rescues: [],
  };
  const grass = createGrass(new Group(), level);
  grass.setQuality('low');
  grass.update(0, { x: 0, z: 0, y: 0, flame: 0 }, false, 0);
  const closeCount = grass.groups[0].count,
    farCount = grass.groups[1].count;
  assert.ok(closeCount > farCount * 1.5);
  grass.update(0, { x: 40, z: 0, y: 0, flame: 0 }, false, 0);
  assert.equal(grass.groups[1].count, closeCount);
  grass.setQuality('high');
  assert.ok(grass.groups.every((g) => g.count === 100));
  assert.ok(grass.field.burn.every((b) => b === 0));
});
