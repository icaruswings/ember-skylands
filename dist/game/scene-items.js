import * as T from '../assets/three.module.js';
import { createDragon, createSentinel } from './assets.js';
import { createChest, gemGeometry } from './treasure.js';
import { batchStatic } from '../engine/batching.js';

export function createPortal(root, p, stone) {
  const g = new T.Group();
  g.position.set(p.x, p.y + 2.6, p.z);
  g.name = p.id;
  root.add(g);
  const ring = new T.Mesh(new T.TorusGeometry(2.2, 0.38, 8, 40), stone);
  g.add(ring);
  const glow = new T.Mesh(
    new T.CircleGeometry(1.9, 40),
    new T.MeshBasicMaterial({
      color: p.color || 0x80d7c3,
      transparent: true,
      opacity: 0.65,
      side: T.DoubleSide,
    }),
  );
  glow.position.z = 0.04;
  g.add(glow);
  // A glowing nameplate makes destinations readable from the running lane.
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const c = canvas.getContext('2d');
  c.fillStyle = '#163c42';
  c.fillRect(0, 0, 512, 96);
  c.fillStyle = '#fff2ca';
  c.font = 'bold 38px Georgia';
  c.textAlign = 'center';
  c.fillText(p.name, 256, 62);
  const label = new T.Mesh(
    new T.PlaneGeometry(7.2, 1.35),
    new T.MeshBasicMaterial({ map: new T.CanvasTexture(canvas), side: T.DoubleSide }),
  );
  label.position.set(0, 3.25, 0);
  g.add(label);
  g.userData = { glow, ring };
  return g;
}
export function createItems(root, level, stone) {
  const gemMeshes = new Map(),
    rescueMeshes = new Map(),
    enemyMeshes = new Map(),
    chestMeshes = new Map(),
    portalMeshes = new Map();
  const jewel = new T.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.25,
    roughness: 0.14,
    clearcoat: 1,
    flatShading: true,
  });
  const gemBatch = new T.InstancedMesh(gemGeometry(), jewel, level.gems.length);
  gemBatch.frustumCulled = false;
  root.add(gemBatch);
  for (const [i, gem] of level.gems.entries()) {
    const m = new T.Object3D();
    m.position.set(gem.x, gem.y, gem.z);
    m.updateMatrix();
    gemMeshes.set(gem.id, m);
    gemBatch.setMatrixAt(i, m.matrix);
    gemBatch.setColorAt(i, new T.Color(gem.color));
  }
  for (const c of level.chests) {
    const m = createChest();
    m.position.set(c.x, c.y, c.z);
    root.add(m);
    chestMeshes.set(c.id, m);
  }
  for (const r of level.rescues) {
    const g = new T.Group();
    g.position.set(r.x, r.y, r.z);
    root.add(g);
    const plinth = new T.Mesh(new T.CylinderGeometry(1.6, 1.9, 0.35, 16), stone);
    plinth.position.y = 0.175;
    g.add(plinth);
    const dragon = createDragon(0.9, 0xe4be78);
    dragon.position.y = 0.35;
    dragon.rotation.y = 0.5;
    g.add(dragon);
    const originals = new Map(),
      emerald = new T.MeshPhysicalMaterial({
        color: 0x35ac78,
        metalness: 0.2,
        roughness: 0.21,
        clearcoat: 1,
      });
    dragon.traverse((o) => {
      if (o.isMesh) {
        originals.set(o, o.material);
        o.material = emerald;
      }
    });
    const statue = new T.Group();
    statue.position.copy(dragon.position);
    statue.rotation.copy(dragon.rotation);
    statue.scale.copy(dragon.scale);
    dragon.updateMatrixWorld(true);
    const inverse = dragon.matrixWorld.clone().invert();
    dragon.traverse((o) => {
      if (o.isMesh) {
        const copy = new T.Mesh(o.geometry, emerald);
        copy.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
        copy.castShadow = copy.receiveShadow = true;
        statue.add(copy);
      }
    });
    g.add(statue);
    batchStatic(statue);
    dragon.visible = false;
    const halo = new T.Mesh(
      new T.TorusGeometry(1.75, 0.06, 5, 40),
      new T.MeshStandardMaterial({ color: 0xb9ffe0, emissive: 0x55f8a1, emissiveIntensity: 0.65 }),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.42;
    g.add(halo);
    g.userData = { dragon, statue, emerald, originals, halo, freed: false };
    rescueMeshes.set(r.id, g);
  }
  for (const e of level.enemies) {
    const m = createSentinel(e.type);
    m.position.set(e.x, e.y, e.z);
    if (e.role === 'wizard') {
      const hat = new T.Mesh(
        new T.ConeGeometry(0.65, 1.7, 12),
        new T.MeshStandardMaterial({ color: 0x4c57ae, roughness: 0.8 }),
      );
      hat.position.y = 3.0;
      m.add(hat);
      const brim = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.12, 16), hat.material);
      brim.position.y = 2.2;
      m.add(brim);
    }
    root.add(m);
    enemyMeshes.set(e.id, m);
  }
  for (const p of level.portals) portalMeshes.set(p.id, createPortal(root, p, stone));
  return {
    gemBatch,
    gemMeshes,
    rescueMeshes,
    enemyMeshes,
    chestMeshes,
    portalMeshes,
    portal: portalMeshes.values().next().value,
  };
}
