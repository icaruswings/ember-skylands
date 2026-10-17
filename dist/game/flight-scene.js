import * as T from '../assets/three.module.js';
import { mesh, block, texture } from './assets.js';
import { createChest } from './treasure.js';
import { batchStatic } from '../engine/batching.js';
import { disposeScene, emptyGrass } from './scene-resources.js';

/** The flight scene has sea, coastal coves, rails and a readable four-group course. */
export function createFlightScene(scene, level) {
  const root = new T.Group();
  root.name = level.id;
  scene.add(root);
  const waterTex = texture('water');
  waterTex.repeat.set(22, 22);
  const water = new T.MeshStandardMaterial({
    color: 0x4bafbd,
    map: waterTex,
    roughness: 0.25,
    metalness: 0.18,
  });
  const ocean = mesh(new T.PlaneGeometry(650, 650), water, root, 0, 0, 0);
  ocean.rotation.x = -Math.PI / 2;
  const stone = new T.MeshStandardMaterial({ color: 0xb8ad87, roughness: 0.95 }),
    grass = new T.MeshStandardMaterial({ color: 0x6d9f55, roughness: 1 });
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8,
      r = 163 + (i % 3) * 12,
      h = 22 + (i % 4) * 8,
      x = Math.sin(a) * r,
      z = Math.cos(a) * r;
    mesh(new T.CylinderGeometry(17, 23, h, 9), stone, root, x, h / 2 - 4, z);
    mesh(new T.ConeGeometry(20, h, 8), grass, root, x, h + 3, z);
  }
  // Circular train viaduct, safely below the main flight lanes.
  const railMat = new T.MeshStandardMaterial({ color: 0x59646b, metalness: 0.6, roughness: 0.5 }),
    wood = new T.MeshStandardMaterial({ color: 0xb47e4c, roughness: 0.9 });
  for (const r of [38.9, 41.1]) {
    const rail = mesh(new T.TorusGeometry(r, 0.12, 5, 96), railMat, root, 0, 7.8, 0);
    rail.rotation.x = Math.PI / 2;
  }
  for (let i = 0; i < 48; i++) {
    const a = (i * Math.PI) / 24,
      m = block(root, wood, Math.sin(a) * 40, 7.6, Math.cos(a) * 40, 3, 0.15, 0.5);
    m.rotation.y = a;
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    mesh(
      new T.CylinderGeometry(1.1, 1.7, 7.5, 8),
      stone,
      root,
      Math.sin(a) * 40,
      3.75,
      Math.cos(a) * 40,
    );
  }
  const targetMeshes = new Map();
  const green = new T.MeshStandardMaterial({
    color: 0x69ba81,
    emissive: 0x255840,
    emissiveIntensity: 0.25,
    roughness: 0.65,
  });
  for (const t of level.targets) {
    const g = new T.Group();
    g.position.set(t.x, t.y, t.z);
    g.name = t.id;
    root.add(g);
    if (t.kind === 'arch') {
      mesh(new T.TorusGeometry(t.radius, 0.45, 8, 48), green, g);
      mesh(
        new T.TorusGeometry(t.radius + 0.12, 0.08, 5, 48),
        new T.MeshBasicMaterial({ color: 0xe5f4ae }),
        g,
        0,
        0,
        0.3,
      );
      g.rotation.y = Math.atan2(t.normal.x, t.normal.z);
      for (const side of [-1, 1]) block(g, stone, side * 6, -8, 0, 1.1, 16, 1.4);
    } else if (t.kind === 'chest') {
      const c = createChest();
      c.position.y = -0.6;
      c.scale.setScalar(1.6);
      g.add(c);
      block(g, wood, 0, -0.85, 0, 4, 0.35, 3);
    } else if (t.kind === 'barrel') {
      mesh(new T.CylinderGeometry(0.9, 0.9, 1.6, 12), wood, g);
      for (const y of [-0.5, 0.5]) {
        const hoop = mesh(new T.TorusGeometry(0.92, 0.08, 5, 16), railMat, g, 0, y, 0);
        hoop.rotation.x = Math.PI / 2;
      }
      block(
        g,
        new T.MeshStandardMaterial({ color: 0x944a3b, roughness: 0.8 }),
        0,
        -1.25,
        0,
        2.4,
        0.55,
        3.4,
      );
      for (const side of [-1, 1])
        for (const z of [-1.0, 1.0]) {
          const wheel = mesh(
            new T.CylinderGeometry(0.45, 0.45, 0.25, 10),
            railMat,
            g,
            side * 1.2,
            -1.7,
            z,
          );
          wheel.rotation.z = Math.PI / 2;
        }
    } else {
      const paint = new T.MeshStandardMaterial({ color: 0xdf8e3f, roughness: 0.7 }),
        wing = new T.MeshStandardMaterial({ color: 0xf3d183, roughness: 0.8 }),
        dark = new T.MeshStandardMaterial({ color: 0x496274, metalness: 0.3, roughness: 0.6 });
      const body = mesh(new T.CylinderGeometry(0.36, 0.58, 3.6, 12), paint, g);
      body.rotation.x = Math.PI / 2;
      for (const y of [-0.1, 0.95]) block(g, wing, 0, y, 0, 5.8, 0.12, 1.4);
      for (const x of [-1.7, 1.7]) block(g, dark, x, 0.43, 0.1, 0.06, 0.95, 0.08);
      block(g, wing, 0, 0.15, -1.35, 2, 0.12, 0.65);
      block(g, paint, 0, 0.6, -1.4, 0.12, 1, 0.7);
      const propeller = block(g, dark, 0, 0, 1.9, 2.5, 0.12, 0.1);
      g.userData.propeller = propeller;
    }
    batchStatic(g, new Set(g.userData.propeller ? [g.userData.propeller] : []));
    targetMeshes.set(t.id, g);
  }
  const excluded = new Set([...targetMeshes.values(), ocean]);
  batchStatic(root, excluded);
  return {
    root,
    targetMeshes,
    gemBatch: null,
    gemMeshes: new Map(),
    rescueMeshes: new Map(),
    enemyMeshes: new Map(),
    chestMeshes: new Map(),
    portalMeshes: new Map(),
    portal: null,
    grassSystem: emptyGrass(),
    collisionMeshes: [],
    waters: [ocean],
    waterTex,
    landmarks: ['coastal-coves', 'train-viaduct', 'flight-arches', 'biplanes'],
    updateFlight(sim) {
      for (const t of sim.targets) {
        const m = targetMeshes.get(t.id);
        m.visible = !sim.collectedTargets.has(t.id);
        m.position.set(t.x, t.y, t.z);
        if (t.motion) {
          const a = t.motion.phase + sim.time * t.motion.speed;
          m.rotation.y = Math.atan2(Math.cos(a) * t.motion.speed, -Math.sin(a) * t.motion.speed);
        }
        if (m.userData.propeller) m.userData.propeller.rotation.z = sim.time * 35;
      }
    },
    dispose() {
      disposeScene(root);
    },
  };
}
