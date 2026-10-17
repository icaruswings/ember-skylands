import * as T from '../assets/three.module.js';
import { mat, mesh, block } from './primitives.js';
import { surface } from './surfaces.js';
import { beveledBox } from './model-geometry.js';
import { batchStatic } from '../engine/batching.js';

/** Eight crown facets, a bright table, girdle and pointed pavilion. */
export function gemGeometry() {
  const points = [],
    uv = [],
    indices = [],
    rings = [
      [0.23, 0.2],
      [0.34, 0.08],
      [0.34, 0],
      [0.018, -0.33],
    ];
  for (const [r, y] of rings)
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      points.push(Math.sin(a) * r, y, Math.cos(a) * r);
      uv.push(i / 8, (y + 0.33) / 0.53);
    }
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 8; i++) {
      const a = row * 8 + i,
        b = row * 8 + ((i + 1) % 8);
      indices.push(a, a + 8, b, b, a + 8, b + 8);
    }
  for (let i = 1; i < 7; i++) indices.push(0, i, i + 1);
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  const faceted = g.toNonIndexed();
  faceted.computeVertexNormals();
  g.dispose();
  return faceted;
}

export function createChest() {
  const g = new T.Group();
  const wood = surface('wood', 0xffecd0),
    gold = surface('armor', 0xf3cd78);
  mesh(beveledBox(), wood, g, 0, 0.43, 0).scale.set(1.25, 0.75, 0.8);
  const lid = mesh(
    new T.CylinderGeometry(0.43, 0.43, 1.25, 24, 1, false, 0, Math.PI),
    wood,
    g,
    0,
    0.8,
    0,
  );
  lid.rotation.z = Math.PI / 2;
  lid.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    block(g, gold, s * 0.44, 0.45, 0.413, 0.075, 0.74, 0.055);
    block(g, gold, s * 0.44, 0.45, -0.413, 0.075, 0.74, 0.055);
    block(g, gold, s * 0.44, 0.87, 0, 0.075, 0.065, 0.85);
    for (const y of [0.19, 0.64])
      mesh(new T.SphereGeometry(0.025, 12, 8), gold, g, s * 0.44, y, 0.452);
  }
  block(g, gold, 0, 0.61, 0.44, 0.2, 0.25, 0.08);
  block(g, mat(0x36251a), 0, 0.61, 0.488, 0.035, 0.08, 0.015);
  batchStatic(g);
  return g;
}
