import * as T from '../assets/three.module.js';
import { groundHeight } from '../engine/terrain.js';

/** Two-unit tessellation gives smooth hills at a modest, fixed phone GPU cost. */
export function terrainGeometry(level) {
  const g = new T.PlaneGeometry(180, 180, 120, 120);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, groundHeight(level, p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  return g;
}

/** Subdivided ribbons conform across their width as well as along their length. */
export function pathGeometry(level, [ax, az, bx, bz, width]) {
  const length = Math.hypot(bx - ax, bz - az),
    rows = Math.ceil(length / 1.5),
    columns = 4;
  const positions = [],
    uv = [],
    indices = [];
  const dx = (bx - ax) / length,
    dz = (bz - az) / length;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    for (let column = 0; column <= columns; column++) {
      const side = (column / columns - 0.5) * width;
      const x = ax + (bx - ax) * t + dz * side,
        z = az + (bz - az) * t - dx * side;
      positions.push(x, groundHeight(level, x, z) + 0.045, z);
      uv.push(column / columns, (t * length) / width);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column,
          b = a + columns + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
