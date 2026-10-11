import * as T from '../assets/three.module.js';
import { mat, mesh, orb, block, texture, createDragon, createSentinel } from './assets.js';
import { LEVEL } from './level.js';
import { batchStatic } from '../engine/batching.js';
import { createTree } from './trees.js';
/** Scene construction is separate from gameplay. All assets are original procedural art. */
export function createWorld(scene) {
  const root = new T.Group();
  scene.add(root);
  const grass = texture('grass'),
    stone = texture('stone'),
    waterTex = texture('water'),
    wood = texture('wood');
  grass.repeat.set(8, 8);
  stone.repeat.set(2, 2);
  wood.repeat.set(1, 4);
  const stoneMat = mat(0xf0debd, { map: stone }),
    rockMat = mat(0x9a9478),
    pathMat = mat(0xe7d0a4, { map: stone }),
    woodMat = mat(0xe3bc86, { map: wood }),
    trunk = mat(0x92704e),
    roof = mat(0xc77b51);
  const crystals = [],
    waters = [],
    gemMeshes = new Map(),
    rescueMeshes = new Map(),
    enemyMeshes = new Map();
  let seed = 71;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (const island of LEVEL.islands) {
    const g = new T.Group();
    g.position.set(island.x, island.y, island.z);
    root.add(g);
    const earth = new T.CylinderGeometry(island.r, island.r * 0.75, 6, 48, 3);
    const p = earth.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      if (y < 2.9) {
        p.setY(i, y + Math.sin(x * 0.6 + z) * 0.7);
        p.setX(i, x + (rand() - 0.5));
        p.setZ(i, z + (rand() - 0.5));
      }
    }
    earth.computeVertexNormals();
    mesh(earth, rockMat, g, 0, -3.05, 0);
    mesh(new T.ConeGeometry(island.r * 0.73, 12, 14), mat(0x837e70), g, 0, -11, 0).rotation.z =
      Math.PI;
    const top = new T.CircleGeometry(island.r, 64);
    top.rotateX(-Math.PI / 2);
    mesh(top, mat(island.color, { map: grass }), g, 0, 0.02, 0);
    for (let i = 0; i < 19; i++) {
      const a = (i / 19) * Math.PI * 2,
        r = island.r - 0.3;
      orb(g, mat(i % 2 ? 0xa8b574 : 0x8d9b67), Math.sin(a) * r, -0.2, Math.cos(a) * r, 2, 0.6, 2);
    }
  }
  function path(ax, az, bx, bz, y, width) {
    const dx = bx - ax,
      dz = bz - az,
      len = Math.hypot(dx, dz);
    const b = block(root, pathMat, (ax + bx) / 2, y + 0.05, (az + bz) / 2, width, 0.1, len);
    b.rotation.y = Math.atan2(dx, dz);
  }
  path(0, 14, 0, -14, 0, 3.1);
  path(0, 3, 13, -7, 0, 3);
  path(0, 3, -14, -10, 0, 3);
  path(0, 3, 12, 1, 0, 2);
  for (const b of LEVEL.bridges) {
    const dx = b.bx - b.ax,
      dz = b.bz - b.az,
      len = Math.hypot(dx, dz),
      angle = Math.atan2(dx, dz);
    const g = new T.Group();
    g.position.set(b.ax, b.ay, b.az);
    g.rotation.y = angle;
    root.add(g);
    for (let i = 0; i <= len / 0.7; i++) {
      const z = i * 0.7,
        t = Math.min(1, z / len);
      block(g, woodMat, 0, t * (b.by - b.ay) - 0.12, z, b.width, 0.22, 0.58);
      for (const s of [-1, 1])
        if (i % 3 === 0) {
          block(g, woodMat, s * (b.width / 2 - 0.12), t * (b.by - b.ay) + 0.6, z, 0.16, 1.5, 0.18);
        }
    }
    for (const s of [-1, 1]) {
      const line = new T.LineCurve3(
        new T.Vector3(s * 1.9, 1.2, 0),
        new T.Vector3(s * 1.9, b.by - b.ay + 1.2, len),
      );
      mesh(new T.TubeGeometry(line, 1, 0.07, 5, false), trunk, g);
    }
  }
  function tower(x, z, h, r = 2) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    root.add(g);
    mesh(new T.CylinderGeometry(r, r * 1.08, h, 16), stoneMat, g, 0, h / 2, 0);
    mesh(new T.CylinderGeometry(r * 1.16, r * 1.16, 0.35, 16), stoneMat, g, 0, h, 0);
    mesh(new T.ConeGeometry(r * 1.45, 3.5, 16), roof, g, 0, h + 1.9, 0);
    orb(g, mat(0xf3c478), 0, h + 3.7, 0, 0.18);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const w = block(
        g,
        mat(0x385665),
        Math.sin(a) * (r + 0.015),
        h * 0.65,
        Math.cos(a) * (r + 0.015),
        0.55,
        1.05,
        0.08,
      );
      w.rotation.y = a;
    }
    return g;
  }
  tower(-4, -12, 7, 1.7);
  tower(4, -12, 8, 1.7);
  tower(0, -17, 11, 2.3);
  block(root, stoneMat, 0, 2.5, -13, 7, 5, 3);
  block(root, roof, 0, 5.3, -13, 7.8, 0.55, 3.8);
  // Castle banners and a stair-like threshold frame the home portal.
  for (const s of [-1, 1]) {
    block(root, mat(0x427f80), s * 2.8, 3.2, -11.4, 0.65, 2, 0.05);
    mesh(new T.ConeGeometry(0.32, 0.5, 3), mat(0xdba664), root, s * 2.8, 1.96, -11.4).rotation.z =
      Math.PI;
  }
  function house(x, z, a) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    g.rotation.y = a;
    root.add(g);
    block(g, stoneMat, 0, 1.4, 0, 3, 2.8, 3);
    const roofG = new T.CylinderGeometry(0, 2.6, 2, 4);
    mesh(roofG, roof, g, 0, 3.7, 0).rotation.y = Math.PI / 4;
    block(g, mat(0x59766c), 0, 1.4, 1.51, 0.8, 1.7, 0.08);
    block(
      g,
      mat(0xe9c67d, { emissive: 0x8e5a22, emissiveIntensity: 0.2 }),
      0.9,
      1.8,
      1.52,
      0.55,
      0.65,
      0.07,
    );
    block(g, stoneMat, 1, 4, 0.2, 0.5, 1.8, 0.6);
  }
  house(11, -10, -0.7);
  house(-10, -11, 0.8);
  const portal = new T.Group();
  portal.position.set(0, 2.35, -10.8);
  root.add(portal);
  const ring = mesh(new T.TorusGeometry(1.6, 0.3, 8, 28), stoneMat, portal);
  const glow = mesh(
    new T.CircleGeometry(1.4, 32),
    new T.MeshBasicMaterial({
      color: 0x6ccab7,
      transparent: true,
      opacity: 0.7,
      side: T.DoubleSide,
    }),
    portal,
    0,
    0,
    0.02,
  );
  portal.userData = { glow, ring };
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    orb(
      portal,
      mat(0xffd786, { emissive: 0xf0a552, emissiveIntensity: 0.5 }),
      Math.sin(a) * 1.6,
      Math.cos(a) * 1.6,
      0.28,
      0.1,
    );
  }
  function tree(x, y, z, s = 1) {
    const g = createTree(Math.floor((x + 100) * 37 + (z + 100) * 173));
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    root.add(g);
  }
  for (const [x, z, s] of [
    [-15, -4, 1.15],
    [-16, -12, 0.9],
    [14, 7, 0.7],
    [17, 1, 1],
    [-12, 13, 1.1],
    [-17, 8, 0.8],
    [18, 10, 0.8],
    [17, -4, 0.85],
    [-7, 16, 0.75],
  ])
    tree(x, 0, z, s);
  for (const island of LEVEL.islands.slice(1))
    for (let i = 0; i < 8; i++) {
      const a = i * 0.79;
      tree(island.x + Math.sin(a) * 10, island.y, island.z + Math.cos(a) * 10, 0.7 + rand() * 0.35);
    }
  // Decorative grass and flowers are instanced for low draw-call cost on phones.
  const bladeGeo = new T.ConeGeometry(0.14, 0.5, 3),
    grassMesh = new T.InstancedMesh(bladeGeo, mat(0x729247), 500);
  const flowerMesh = new T.InstancedMesh(new T.IcosahedronGeometry(0.13, 0), mat(0xffd28d), 140);
  root.add(grassMesh, flowerMesh);
  const dummy = new T.Object3D();
  for (let i = 0; i < 500; i++) {
    const land = LEVEL.islands[i % 3],
      a = rand() * 6.28,
      r = (0.5 + rand() * 0.43) * land.r;
    dummy.position.set(land.x + Math.sin(a) * r, land.y + 0.2, land.z + Math.cos(a) * r);
    dummy.scale.set(1, 0.7 + rand(), 1);
    dummy.rotation.y = rand() * 6.28;
    dummy.updateMatrix();
    grassMesh.setMatrixAt(i, dummy.matrix);
    if (i < 140) {
      dummy.position.y += 0.2;
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      flowerMesh.setMatrixAt(i, dummy.matrix);
    }
  }
  grassMesh.instanceMatrix.needsUpdate = true;
  flowerMesh.instanceMatrix.needsUpdate = true;
  // Pond and a moving waterfall spill off the meadow into the clouds.
  const waterMat = mat(0x76d5d1, {
    map: waterTex,
    transparent: true,
    opacity: 0.82,
    roughness: 0.2,
    metalness: 0.15,
  });
  const pond = mesh(new T.CircleGeometry(4, 40), waterMat, root, -10, 0.08, 6);
  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(1, 0.7, 1);
  waters.push(pond);
  const fallMat = new T.MeshBasicMaterial({
    map: waterTex,
    color: 0xa4f2e5,
    transparent: true,
    opacity: 0.68,
    side: T.DoubleSide,
  });
  const fall = mesh(new T.PlaneGeometry(3, 20, 1, 16), fallMat, root, -19.8, -10, 6);
  fall.rotation.y = Math.PI / 2;
  waters.push(fall);
  path(-12, 6, -20, 6, 0.12, 2.3);
  for (let i = 0; i < 12; i++)
    orb(
      root,
      mat(0xf6ffff, { transparent: true, opacity: 0.6 }),
      -19.7 + rand() * 0.5,
      -rand() * 17,
      4.7 + rand() * 2.5,
      0.2,
      0.8,
      0.25,
    );
  for (const land of LEVEL.islands)
    for (let i = 0; i < 7; i++) {
      const a = rand() * 6.28,
        r = land.r * 0.8,
        x = land.x + Math.sin(a) * r,
        z = land.z + Math.cos(a) * r;
      const g = new T.Group();
      g.position.set(x, land.y, z);
      root.add(g);
      for (let j = 0; j < 3; j++) {
        const crystal = mesh(
          new T.CylinderGeometry(0, 0.23, 0.9 + rand(), 5),
          mat(land.id === 'crown' ? 0xb99bdb : 0x82c6ba, {
            metalness: 0.25,
            roughness: 0.25,
            emissive: 0x2c5856,
            emissiveIntensity: 0.1,
          }),
          g,
          (j - 1) * 0.3,
          0.5,
          j * 0.13,
        );
        crystal.rotation.z = (j - 1) * 0.2;
        crystals.push(crystal);
      }
    }
  for (const gem of LEVEL.gems) {
    const geo = new T.OctahedronGeometry(0.37);
    const m = mesh(
      geo,
      mat(gem.color, {
        metalness: 0.35,
        roughness: 0.25,
        emissive: gem.color,
        emissiveIntensity: 0.16,
      }),
      root,
      gem.x,
      gem.y,
      gem.z,
    );
    m.scale.set(0.75, 1.2, 0.75);
    gemMeshes.set(gem.id, m);
  }
  for (const r of LEVEL.rescues) {
    const g = new T.Group();
    g.position.set(r.x, r.y, r.z);
    root.add(g);
    mesh(new T.CylinderGeometry(1.3, 1.5, 0.4, 12), stoneMat, g, 0, 0.2, 0);
    const dragon = createDragon(0.65, 0xe4be78);
    dragon.position.y = 0.4;
    dragon.rotation.y = 0.5;
    g.add(dragon);
    const cage = mesh(
      new T.IcosahedronGeometry(1.8, 1),
      new T.MeshStandardMaterial({
        color: 0x8bded1,
        transparent: true,
        opacity: 0.21,
        roughness: 0.2,
        metalness: 0.3,
        wireframe: false,
        depthWrite: false,
      }),
      g,
      0,
      1.3,
      0,
    );
    const cageLines = mesh(
      new T.IcosahedronGeometry(1.81, 1),
      new T.MeshBasicMaterial({
        color: 0xa9ffe6,
        transparent: true,
        opacity: 0.32,
        wireframe: true,
      }),
      g,
      0,
      1.3,
      0,
    );
    const halo = mesh(
      new T.TorusGeometry(1.45, 0.055, 5, 36),
      mat(0xc1ffe4, { emissive: 0x8bffd8, emissiveIntensity: 0.8 }),
      g,
      0,
      0.48,
      0,
    );
    halo.rotation.x = Math.PI / 2;
    g.userData = { dragon, cage, cageLines, halo };
    rescueMeshes.set(r.id, g);
  }
  for (const e of LEVEL.enemies) {
    const m = createSentinel(e.type);
    m.position.set(e.x, e.y, e.z);
    root.add(m);
    enemyMeshes.set(e.id, m);
  }
  // Far silhouettes establish an expansive sky kingdom without affecting collision.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 6.28,
      r = 100 + rand() * 65,
      x = Math.sin(a) * r,
      z = Math.cos(a) * r;
    const g = new T.Group();
    g.position.set(x, -8 + rand() * 24, z);
    root.add(g);
    mesh(new T.CylinderGeometry(12 + rand() * 8, 4, 13, 7), mat(0x93aca1), g);
    mesh(new T.ConeGeometry(7, 24, 5), mat(0x9cb6ac), g, 0, -15, 0).rotation.z = Math.PI;
    mesh(new T.ConeGeometry(13, 17, 7), mat(0xabc6b0), g, 0, 8, 0);
  }
  const cloudMat = new T.MeshBasicMaterial({
    color: 0xfff6e5,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  for (let i = 0; i < 45; i++) {
    const a = rand() * 6.28,
      r = 35 + rand() * 100;
    const g = new T.Group();
    g.position.set(Math.sin(a) * r, -20 - rand() * 12, Math.cos(a) * r);
    root.add(g);
    for (let j = 0; j < 4; j++) orb(g, cloudMat, j * 5, rand() * 2, rand() * 5, 8, 3.3, 5);
  }
  const gemBatch = new T.InstancedMesh(
    new T.OctahedronGeometry(0.37),
    mat(0xffffff, { metalness: 0.35, roughness: 0.25 }),
    LEVEL.gems.length,
  );
  root.add(gemBatch);
  for (const [i, gem] of LEVEL.gems.entries()) {
    const m = gemMeshes.get(gem.id);
    m.removeFromParent();
    m.updateMatrix();
    gemBatch.setMatrixAt(i, m.matrix);
    gemBatch.setColorAt(i, new T.Color(gem.color));
  }
  const excluded = new Set([...rescueMeshes.values(), ...enemyMeshes.values(), portal, ...waters]);
  batchStatic(root, excluded);
  return { root, gemBatch, gemMeshes, rescueMeshes, enemyMeshes, portal, waterTex, waters };
}
