import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/assets/three.module.js';
import { createDragon } from '../dist/game/assets.js';
import { createChest } from '../dist/game/treasure.js';

test('fresh adventures restore emerald statue materials after a rescue', async () => {
  const { updateRescue } = await import('../dist/game/rescue.js');
  const dragon = createDragon(),
    emerald = new T.MeshPhysicalMaterial({ color: 0x35ac78 }),
    originals = new Map();
  dragon.traverse((o) => {
    if (o.isMesh) {
      originals.set(o, o.material);
      o.material = emerald;
    }
  });
  const data = { dragon, emerald, originals, freed: false, halo: { visible: true } };
  updateRescue(data, true, 1, 0);
  assert.equal(data.freed, true);
  for (const [o, m] of originals) assert.equal(o.material, m);
  updateRescue(data, false, 0);
  assert.equal(data.freed, false);
  assert.equal(dragon.position.y, 0.4);
  for (const o of originals.keys()) assert.equal(o.material, emerald);
});
test('a chest uses at most four material draw calls', () => {
  let meshes = 0;
  createChest().traverse((o) => (meshes += o.isMesh ? 1 : 0));
  assert.ok(meshes <= 4, `Chest uses ${meshes} mesh draws`);
});
