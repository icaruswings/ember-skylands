import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/assets/three.module.js';
import { orb, mat } from '../dist/game/primitives.js';
import { createDragon, animateDragon, createSentinel } from '../dist/game/characters.js';
import { createChest } from '../dist/game/treasure.js';

test('rounded facial details have a smooth silhouette at close camera distance', () => {
  const detail = orb(new T.Group(), mat(0xffffff), 0, 0, 0, 1);
  const normal = detail.geometry.attributes.normal;
  let maximum = 0;
  for (let i = 1; i < normal.count; i++) {
    const a = new T.Vector3().fromBufferAttribute(normal, i - 1);
    const b = new T.Vector3().fromBufferAttribute(normal, i);
    if (Math.abs(a.y - b.y) < 1e-5) maximum = Math.max(maximum, a.angleTo(b));
  }
  assert.ok(
    maximum < 0.28,
    'round details should have less than 16 degrees between silhouette samples',
  );
});

test('ground wings tuck close to the body and spread fully for gliding', () => {
  const d = createDragon();
  animateDragon(d, 0, 0, false, false, { grounded: true });
  const resting = new T.Box3().setFromObject(d).getSize(new T.Vector3()).x;
  animateDragon(d, 0, 9, true, false, { grounded: false });
  const flying = new T.Box3().setFromObject(d).getSize(new T.Vector3()).x;
  assert.ok(resting / flying < 0.65, 'ground pose should leave a clear view around the dragon');
});

test('armored enemies have a visible fitted breastplate at torso height', () => {
  const armored = createSentinel('armor');
  armored.updateMatrixWorld(true);
  const hit = new T.Raycaster(new T.Vector3(0, 1.25, 4), new T.Vector3(0, 0, -1)).intersectObject(
    armored,
    true,
  )[0];
  assert.equal(hit.object.material.userData.surfaceKind, 'armor');
});

test('chests use painted wood and metal materials with valid UV coordinates', () => {
  const chest = createChest();
  const kinds = new Set();
  chest.traverse((o) => {
    if (o.isMesh) {
      kinds.add(o.material.userData.surfaceKind);
      assert.ok(o.geometry.attributes.uv);
    }
  });
  assert.ok(kinds.has('wood'));
  assert.ok(kinds.has('armor'));
});

test('gallop follows travelled distance and a turn banks the body into the corner', () => {
  const d = createDragon();
  animateDragon(d, 1, 7, false, false, { grounded: true, stride: 2, turnRate: 2 });
  const legs = d.userData.legs.map((l) => l.rotation.x),
    lean = d.userData.torso.rotation.z;
  animateDragon(d, 2, 7, false, false, { grounded: true, stride: 2, turnRate: 2 });
  assert.deepEqual(
    d.userData.legs.map((l) => l.rotation.x),
    legs,
    'same travelled distance must retain foot placement',
  );
  animateDragon(d, 2, 7, false, false, { grounded: true, stride: 2, turnRate: -2 });
  assert.ok(
    lean * d.userData.torso.rotation.z < 0,
    'opposite turns should lean in opposite directions',
  );
});

test('high definition characters reuse vertices without losing their UV seams', () => {
  for (const model of [createDragon(), createSentinel('armor')]) {
    let vertices = 0,
      triangles = 0;
    model.traverse((o) => {
      if (o.isMesh) {
        vertices += o.geometry.attributes.position.count;
        triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
      }
    });
    assert.ok(
      vertices / triangles < 1.25,
      'indexed surfaces should bound download and vertex-processing cost',
    );
  }
});

test('castle walls keep the same texel scale despite different mesh dimensions', async () => {
  const uv = await import('../dist/game/scenery-uv.js').catch(() => ({}));
  assert.equal(typeof uv.applySceneryUvs, 'function');
  const root = new T.Group(),
    material = mat(0xdecafe);
  const a = new T.Mesh(new T.BoxGeometry(1, 1, 1), material),
    b = a.clone();
  a.scale.set(12, 6, 2);
  b.scale.set(24, 6, 2);
  root.add(a, b);
  uv.applySceneryUvs(root, new Set([material]), 6);
  assert.notEqual(a.geometry, b.geometry, 'UV updates must not mutate shared primitives');
  for (const o of [a, b]) {
    const p = o.geometry.attributes.position,
      u = o.geometry.attributes.uv,
      n = o.geometry.attributes.normal;
    let found = false;
    for (let i = 0; i < p.count; i++)
      if (n.getZ(i) > 0.9) {
        assert.ok(Math.abs(u.getX(i) - (p.getX(i) * o.scale.x) / 6) < 1e-6);
        found = true;
      }
    assert.ok(found);
  }
});

test('entering and leaving glide eases toward the airborne wing pose without an inward snap', () => {
  const d = createDragon();
  animateDragon(d, 1, 9, false, false, { grounded: false, glideBlend: 0 });
  const airborne = Math.abs(d.userData.wings[0].rotation.y);
  animateDragon(d, 1, 9, true, false, { grounded: false, glideBlend: 1 - Math.exp(-16 / 60) });
  const opening = Math.abs(d.userData.wings[0].rotation.y);
  assert.ok(
    opening < airborne && airborne - opening < 0.15,
    'glide should open from the preceding airborne pose',
  );
  animateDragon(d, 1, 9, false, false, { grounded: false, glideBlend: Math.exp(-16 / 60) });
  assert.ok(
    Math.abs(d.userData.wings[0].rotation.y) < 0.15,
    'cancelled glide should ease toward the tucked airborne pose',
  );
});
