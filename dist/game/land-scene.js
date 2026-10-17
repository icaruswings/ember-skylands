import * as T from '../assets/three.module.js';
import { texture, mesh, block, orb } from './assets.js';
import { surface } from './surfaces.js';
import { applySceneryUvs } from './scenery-uv.js';
import { createTree } from './trees.js';
import { createGrass } from './grass.js';
import { batchStatic } from '../engine/batching.js';
import { createItems } from './scene-items.js';
import { disposeScene } from './scene-resources.js';
import { groundHeight } from '../engine/terrain.js';
import { terrainGeometry, pathGeometry } from './terrain-mesh.js';
import { createLandFeatures } from './land-features.js';

/** A continuous valley: scenery establishes the boundary instead of a lethal cliff. */
export function createLandScene(scene, level) {
  const root = new T.Group();
  root.name = level.id;
  scene.add(root);
  const t = level.theme;
  const grass = texture(
      level.id === 'peace-keepers' ? 'sand' : level.id === 'magic-crafters' ? 'snow' : 'grass',
    ),
    waterTex = texture('water');
  grass.repeat.set(30, 30);
  const stoneMat = surface('masonry', t.stone),
    roof = surface('roof', t.accent),
    trim = new T.MeshStandardMaterial({ color: 0xf3dfaf, roughness: 0.8 }),
    dark = new T.MeshStandardMaterial({ color: 0x375365, roughness: 0.85 });
  const ground = new T.MeshStandardMaterial({ color: t.color, map: grass, roughness: 1 });
  const floor = mesh(terrainGeometry(level), ground, root);
  const conformed = new Set([floor]);
  const waters = [],
    landmarks = [];
  const landmark = (name, g) => {
    g.name = name;
    landmarks.push(name);
    return g;
  };
  // Continuous visible walls sit outside the player containment plane.
  for (const side of [-1, 1]) {
    conformed.add(block(root, stoneMat, 0, 1, side * 61, 126, 10, 4));
    conformed.add(block(root, stoneMat, side * 61, 1, 0, 4, 10, 126));
    for (let i = -56; i <= 56; i += 8) {
      conformed.add(block(root, trim, i, 6.4, side * 61, 3, 1.1, 4.3));
      conformed.add(block(root, trim, side * 61, 6.4, i, 4.3, 1.1, 3));
    }
  }
  const pathMat = surface('masonry', level.id === 'magic-crafters' ? 0xdce4ed : 0xf2dfb8);
  for (const path of level.paths) conformed.add(mesh(pathGeometry(level, path), pathMat, root));
  function tower(x, z, h = 12, r = 3) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    root.add(g);
    mesh(new T.CylinderGeometry(r, r * 1.08, h, 32), stoneMat, g, 0, h / 2, 0);
    mesh(new T.CylinderGeometry(r * 1.18, r * 1.18, 0.6, 32), trim, g, 0, h, 0);
    mesh(new T.ConeGeometry(r * 1.4, 5, 32), roof, g, 0, h + 2.7, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2,
        m = block(
          g,
          dark,
          Math.sin(a) * (r + 0.02),
          h * 0.65,
          Math.cos(a) * (r + 0.02),
          0.9,
          2,
          0.12,
        );
      m.rotation.y = a;
    }
    return g;
  }
  for (const [i, side] of [-1, 1].entries()) {
    tower(side * 55, -55, 14 + i * 2, 3.8);
    tower(side * 55, 55, 10, 3);
    for (let j = 0; j < 4; j++) {
      const m = mesh(
        new T.ConeGeometry(18, 34 + (j % 2) * 12, 8),
        new T.MeshStandardMaterial({
          color:
            level.id === 'magic-crafters'
              ? 0xc4d5e4
              : level.id === 'peace-keepers'
                ? 0xb38262
                : 0x7a9b77,
          roughness: 1,
        }),
        root,
        side * (75 + j * 9),
        12,
        -68 + j * 35,
      );
      m.rotation.y = j;
      if (level.id === 'magic-crafters')
        mesh(
          new T.ConeGeometry(8, 12, 8),
          trim,
          root,
          m.position.x,
          m.position.y + 16,
          m.position.z,
        );
    }
  }
  if (level.id === 'artisans') {
    landmark('castle', tower(-16, -54, 16, 4));
    tower(16, -54, 18, 4);
    block(root, stoneMat, 0, 7, -58, 30, 14, 5);
    block(root, roof, 0, 14.3, -58, 32, 0.8, 6);
    for (const side of [-1, 1]) {
      const banner = block(root, roof, side * 9, 9, -55.3, 1.8, 5, 0.12);
      banner.rotation.z = side * 0.08;
    }
    const water = new T.MeshStandardMaterial({
      color: 0x76d3cf,
      map: waterTex,
      transparent: true,
      opacity: 0.82,
      roughness: 0.2,
    });
    const pond = landmark(
      'waterfall-pond',
      mesh(new T.CircleGeometry(5, 40), water, root, -44, 0.07, -14),
    );
    pond.rotation.x = -Math.PI / 2;
    pond.scale.y = 0.75;
    waters.push(pond);
    const fall = mesh(new T.PlaneGeometry(11.8, 8.5), water.clone(), root, -44, 4.25, -19.8);
    fall.material.opacity = 0.52;
    fall.material.side = T.DoubleSide;
    waters.push(fall);
    for (let i = 0; i < 12; i++) {
      const positions = [
        [-43, 20],
        [-43, 43],
        [-40, 8],
        [-20, 46],
        [-12, 20],
        [46, 43],
        [50, 18],
        [39, 20],
        [50, -9],
        [-52, -3],
        [39, 39],
        [-39, 45],
      ];
      const [x, z] = positions[i];
      const tree = createTree(201 + i);
      tree.position.set(x, 0, z);
      tree.scale.setScalar(0.85 + (i % 3) * 0.15);
      root.add(tree);
    }
    // Formal hedges decorate the perimeter, leaving the combat lanes unobstructed.
    const hedge = new T.MeshStandardMaterial({ color: 0x477647, roughness: 1 });
    for (const side of [-1, 1])
      for (let i = 0; i < 3; i++) block(root, hedge, side * 52, 1.0, 12 + i * 15, 2.3, 2, 7);
  } else if (level.id === 'peace-keepers') {
    landmark('training-fort', tower(0, -56, 17, 6));
    const bronze = new T.MeshStandardMaterial({ color: 0x535859, metalness: 0.6, roughness: 0.5 });
    for (const side of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const g = new T.Group();
        g.position.set(side * 49, 0, -6 + i * 20);
        g.rotation.y = (-side * Math.PI) / 2;
        root.add(g);
        const barrel = mesh(new T.CylinderGeometry(0.55, 0.8, 3.7, 24), bronze, g, 0, 1.5, 0);
        barrel.rotation.x = Math.PI / 2 - 0.25;
        for (const x of [-0.9, 0.9]) {
          const wheel = mesh(new T.CylinderGeometry(1, 1, 0.3, 24), roof, g, x, 0.8, 0.6);
          wheel.rotation.z = Math.PI / 2;
        }
        if (i === 0) landmark('cannons', g);
      }
    for (const side of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const g = new T.Group();
        g.position.set(side * (14 + i * 12), 0, 48);
        root.add(g);
        const tent = mesh(new T.CylinderGeometry(0, 5, 4.5, 4), roof, g, 0, 2.25, 0);
        tent.rotation.y = Math.PI / 4;
        block(g, trim, 0, 1.4, 3.4, 1.1, 2.8, 0.1);
        if (i === 0) landmark('tents', g);
      }
    const cactus = new T.MeshStandardMaterial({ color: 0x537d55, roughness: 1 });
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1,
        x = side * (48 + (i % 3) * 2),
        z = -40 + Math.floor(i / 2) * 13;
      mesh(new T.CylinderGeometry(0.4, 0.6, 3 + (i % 3), 8), cactus, root, x, 1.8, z);
      orb(root, cactus, x + 0.7, 2, z, 0.8, 0.3, 0.3);
    }
  } else {
    landmark('wizard-towers', tower(0, -56, 21, 5));
    tower(-24, -55, 15, 3);
    tower(24, -55, 17, 3);
    const crystal = new T.MeshPhysicalMaterial({
      color: 0x8c9be8,
      metalness: 0.25,
      roughness: 0.18,
      clearcoat: 1,
      emissive: 0x334b82,
      emissiveIntensity: 0.3,
    });
    for (let i = 0; i < 18; i++) {
      const side = i % 2 ? 1 : -1,
        x = side * (53 + (i % 2)),
        z = -42 + Math.floor(i / 2) * 11;
      for (let j = 0; j < 3; j++) {
        const c = mesh(
          new T.CylinderGeometry(0, 0.55, 3 + j, 6),
          crystal,
          root,
          x + (j - 1) * 0.7,
          1.8,
          z + j * 0.4,
        );
        c.rotation.z = (j - 1) * 0.18;
      }
    }
    landmark('crystal-gardens', root.children.at(-1));
    for (const side of [-1, 1])
      for (let i = 0; i < 5; i++) {
        const x = side * 54,
          z = -40 + i * 20;
        mesh(new T.CylinderGeometry(0.2, 0.5, 6, 8), stoneMat, root, x, 3, z);
        for (let j = 0; j < 3; j++)
          mesh(new T.ConeGeometry(2.4 - j * 0.5, 3.3, 10), trim, root, x, 3 + j * 1.4, z);
      }
  }
  const features = createLandFeatures(root, level, { stone: stoneMat, roof, trim });
  conformed.add(features.root);
  landmarks.push(...features.landmarks);
  applySceneryUvs(root, new Set([stoneMat, roof]), 6);
  // Lift scenery before creating already-elevated interactive items and grass.
  for (const child of root.children)
    if (!conformed.has(child))
      child.position.y += groundHeight(level, child.position.x, child.position.z);
  const items = createItems(root, level, stoneMat),
    grassSystem = createGrass(root, level);
  const excluded = new Set([
    ...items.rescueMeshes.values(),
    ...items.enemyMeshes.values(),
    ...items.chestMeshes.values(),
    ...items.portalMeshes.values(),
    ...waters,
  ]);
  batchStatic(root, excluded);
  const collisionMeshes = root.children.filter(
    (o) => o.isMesh && !o.isInstancedMesh && [stoneMat, roof, trim].includes(o.material),
  );
  return {
    root,
    ...items,
    grassSystem,
    waters,
    waterTex,
    collisionMeshes,
    landmarks,
    dispose() {
      disposeScene(root);
    },
  };
}
