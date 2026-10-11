import * as T from '../assets/three.module.js';
/** Batch opaque static meshes by material, preserving normals and UV mapping. */
export function batchStatic(root, excluded = new Set(), recursive = true) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(),
    buckets = new Map(),
    remove = [];
  function visit(object) {
    if (excluded.has(object)) return;
    if (
      object.isMesh &&
      !object.isInstancedMesh &&
      !object.material.transparent &&
      !Array.isArray(object.material)
    ) {
      const geo = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geo.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
      const key = object.material.uuid;
      if (!buckets.has(key)) buckets.set(key, { material: object.material, geos: [] });
      buckets.get(key).geos.push(geo);
      remove.push(object);
    }
    if (recursive) for (const child of object.children) visit(child);
  }
  for (const child of [...root.children]) visit(child);
  for (const object of remove) object.removeFromParent();
  for (const { material, geos } of buckets.values()) {
    const merged = new T.BufferGeometry();
    for (const name of ['position', 'normal', 'uv']) {
      const count = geos.reduce((sum, g) => sum + (g.getAttribute(name)?.array.length || 0), 0);
      if (!count) continue;
      const size = name === 'uv' ? 2 : 3;
      const array = new Float32Array(count);
      let offset = 0;
      for (const g of geos) {
        const attr = g.getAttribute(name);
        if (attr) {
          array.set(attr.array, offset);
          offset += attr.array.length;
        }
      }
      merged.setAttribute(name, new T.BufferAttribute(array, size));
    }
    merged.computeBoundingSphere();
    const m = new T.Mesh(merged, material);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    for (const g of geos) g.dispose();
  }
}
export function batchParts(root) {
  for (const child of [...root.children]) if (child.isGroup) batchParts(child);
  batchStatic(root, new Set(), false);
}
