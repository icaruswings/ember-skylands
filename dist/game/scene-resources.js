/** Dispose only scene-owned GPU resources. Asset templates and cached surfaces survive travel. */
export function disposeScene(root) {
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  root.traverse((o) => {
    if (o.isInstancedMesh) o.dispose();
    if (o.geometry && !o.geometry.userData.shared) geometries.add(o.geometry);
    for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!material || material.userData.shared || material.userData.surfaceKind) continue;
      materials.add(material);
      for (const value of Object.values(material))
        if (value?.isTexture && !value.userData.shared) textures.add(value);
    }
  });
  root.removeFromParent();
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
  root.clear();
}
export function emptyGrass() {
  return { field: { burn: [] }, groups: [], setQuality() {}, update() {} };
}
