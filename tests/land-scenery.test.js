import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/assets/three.module.js';
import { LANDS } from '../dist/game/lands.js';
import { createLandFeatures } from '../dist/game/land-features.js';
import { groundHeight } from '../dist/engine/terrain.js';

test('grotto walls bury their foundations and meet the roof on rolling ground', () => {
  for (const land of LANDS)
    for (const o of land.obstacles.filter((o) => o.style === 'grotto')) {
      const secret = land.secrets.find((s) => s.id === o.secretId);
      for (const x of [o.x - o.halfX, o.x, o.x + o.halfX])
        for (const z of [o.z - o.halfZ, o.z, o.z + o.halfZ])
          assert.ok(o.y <= groundHeight(land, x, z), `${land.id}: floating cave foundation`);
      assert.ok(Math.abs(o.y + o.height - secret.y - 8.4) < 1e-8, 'walls meet roof');
    }
});

test('rendered grotto and garden walls match collision boxes after terrain placement', () => {
  for (const land of LANDS) {
    const material = new T.MeshStandardMaterial();
    const { root, landmarks } = createLandFeatures(new T.Group(), land, {
      stone: material,
      roof: material,
      trim: material,
    });
    root.updateMatrixWorld(true);
    for (const [i, o] of land.obstacles.entries()) {
      if (o.r) continue;
      const solid = root.children[i].children[0],
        box = new T.Box3().setFromObject(solid);
      assert.ok(Math.abs(box.min.x - (o.x - o.halfX)) < 1e-5);
      assert.ok(Math.abs(box.max.z - (o.z + o.halfZ)) < 1e-5);
      assert.ok(Math.abs(box.min.y - o.y) < 1e-5);
      assert.ok(Math.abs(box.max.y - o.y - o.height) < 1e-5);
    }
    for (const s of land.secrets) assert.ok(landmarks.includes(s.name));
  }
});
