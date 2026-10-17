import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GLTFLoader } from '../dist/assets/GLTFLoader.js';
import { animateDragon } from '../dist/game/characters.js';

test('authored GLB files parse through the standard Three.js glTF loader', async () => {
  for (const name of ['dragon', 'gnorc-normal', 'gnorc-armor', 'gnorc-giant']) {
    const file = readFileSync(`dist/assets/models/${name}.glb`);
    assert.ok(file.length < 2000000);
    const data = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
    const gltf = await new GLTFLoader().parseAsync(data, ''),
      root = gltf.scene.children[0];
    let triangles = 0;
    root.traverse((o) => {
      if (o.isMesh) {
        triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
        assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));
      }
    });
    assert.ok(triangles > 1000);
    assert.ok(triangles < (name === 'dragon' ? 26000 : 20000));
    const rig = root.userData.engineRig;
    for (const [key, names] of Object.entries(rig))
      root.userData[key] = Array.isArray(names)
        ? names.map((n) => root.getObjectByName(n))
        : root.getObjectByName(names);
    if (name === 'dragon') {
      assert.ok(root.userData.head);
      assert.ok(root.userData.mouth, 'loaded rig must retain the flame attachment');
      assert.equal(root.userData.legs.length, 4);
      animateDragon(root, 2, 7, true, false);
      assert.ok(root.userData.wings.every((w) => Number.isFinite(w.rotation.z)));
    } else {
      assert.equal(root.userData.legs.length, 2);
      assert.ok(root.userData.sack);
    }
  }
});
