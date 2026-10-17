import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Group,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  Texture,
  InstancedMesh,
} from '../dist/assets/three.module.js';
test('scene disposal releases owned resources once while preserving shared character assets', async () => {
  const { disposeScene } = await import('../dist/game/scene-resources.js');
  const root = new Group(),
    owned = new BoxGeometry(),
    shared = new BoxGeometry(),
    map = new Texture(),
    material = new MeshStandardMaterial({ map }),
    sharedMat = new MeshStandardMaterial();
  shared.userData.shared = true;
  sharedMat.userData.shared = true;
  let geometries = 0,
    materials = 0,
    textures = 0,
    instances = 0,
    sharedDisposals = 0;
  owned.addEventListener('dispose', () => geometries++);
  material.addEventListener('dispose', () => materials++);
  map.addEventListener('dispose', () => textures++);
  shared.addEventListener('dispose', () => sharedDisposals++);
  sharedMat.addEventListener('dispose', () => sharedDisposals++);
  root.add(new Mesh(owned, material), new Mesh(owned, material), new Mesh(shared, sharedMat));
  const instance = new InstancedMesh(owned, material, 2);
  instance.addEventListener('dispose', () => instances++);
  root.add(instance);
  disposeScene(root);
  assert.equal(geometries, 1);
  assert.equal(materials, 1);
  assert.equal(textures, 1);
  assert.equal(instances, 1);
  assert.equal(sharedDisposals, 0);
});
