import * as T from '../assets/three.module.js';
export const palette = {
  dragon: 0x9855d7,
  belly: 0xffd45a,
  wing: 0xf39a2f,
  stone: 0xdfd0af,
  roof: 0xc97848,
  leaf: 0x68994c,
};
const materials = new Map();
export const mat = (color, extra = {}) => {
  if (Object.keys(extra).length)
    return new T.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
  if (!materials.has(color))
    materials.set(color, new T.MeshStandardMaterial({ color, roughness: 0.85 }));
  materials.get(color).userData.shared = true;
  return materials.get(color);
};
export function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const sphere = new T.SphereGeometry(1, 24, 16),
  cone = new T.ConeGeometry(1, 1, 20),
  box = new T.BoxGeometry(1, 1, 1);
for (const geometry of [sphere, cone, box]) geometry.userData.shared = true;
export function orb(parent, material, x, y, z, sx, sy = sx, sz = sx) {
  const m = mesh(sphere, material, parent, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
export function block(parent, material, x, y, z, sx, sy, sz) {
  const m = mesh(box, material, parent, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
export function point(parent, material, x, y, z, sx, sy, sz = sx) {
  const m = mesh(cone, material, parent, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
