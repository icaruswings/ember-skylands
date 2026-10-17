import test from 'node:test';
import assert from 'node:assert/strict';
import { createDragon, animateDragon, createSentinel } from '../dist/game/assets.js';
import { createTree } from '../dist/game/trees.js';
import { loft, taper } from '../dist/game/model-geometry.js';
import { Vector3, Raycaster } from '../dist/assets/three.module.js';

function inspect(model, budget) {
  let triangles = 0;
  model.traverse((object) => {
    if (!object.isMesh) return;
    const g = object.geometry;
    triangles += (g.index?.count ?? g.attributes.position.count) / 3;
    for (const name of ['position', 'normal', 'uv']) {
      assert.ok(g.attributes[name], `missing ${name}`);
      assert.ok([...g.attributes[name].array].every(Number.isFinite), `invalid ${name}`);
    }
  });
  assert.ok(triangles < budget, `${triangles} triangles exceeds mobile asset budget ${budget}`);
}

test('dragon geometry fits the mobile triangle budget and has valid texture coordinates', () => {
  inspect(createDragon(), 26000);
});

test('every sentinel variant fits its geometry budget', () => {
  for (const type of ['armor', 'giant', 'normal']) inspect(createSentinel(type), 20000);
});

test('branching trees have finite shaded surfaces and bounded geometry', () => {
  for (const seed of [1, 1299, 3201]) inspect(createTree(seed), 3000);
});

test('UV wrap seams keep matching smooth normals', () => {
  for (const geometry of [
    loft(
      [
        [0, 1, 1, 0],
        [2, 1, 1, 0],
      ],
      20,
      12,
    ),
    taper(
      [
        [0, 0, 0],
        [0, 0, 2],
      ],
      [1, 1],
      20,
      12,
    ),
  ]) {
    const normals = geometry.attributes.normal;
    for (let row = 0; row <= 12; row++) {
      const a = new Vector3().fromBufferAttribute(normals, row * 21);
      const b = new Vector3().fromBufferAttribute(normals, row * 21 + 20);
      assert.ok(a.distanceTo(b) < 0.00001, 'UV seam must not produce a shading crease');
    }
  }
});

test('dragon pupils are visible in front of the sclera', () => {
  const dragon = createDragon();
  dragon.updateMatrixWorld(true);
  const head = dragon.userData.head;
  for (const sign of [-1, 1]) {
    const origin = head.localToWorld(new Vector3(sign * 0.419, 0.31, 3));
    const hits = new Raycaster(origin, new Vector3(0, 0, -1)).intersectObject(head, true);
    assert.equal(
      hits[0].object.material.color.getHex(),
      0x143d3c,
      'white sclera must not obscure the pupil',
    );
  }
});

test('dragon animation preserves independent rig joints and finite transforms', () => {
  const dragon = createDragon();
  const { torso, head, legs, tail, wings } = dragon.userData;
  for (const state of [
    [0, false, false],
    [8, false, true],
    [6, true, false],
  ]) {
    animateDragon(dragon, 1.37, ...state);
    for (const joint of [torso, head, ...legs, tail, ...wings]) {
      assert.ok(joint.parent);
      assert.ok(
        [...joint.position, ...joint.rotation.toArray().slice(0, 3)].every(Number.isFinite),
      );
    }
  }
});
