import * as T from '../assets/three.module.js';

/** Keep painted masonry/roof detail at a stable world scale; preserve curved unwraps. */
export function applySceneryUvs(root, materials, tileSize = 6) {
  root.updateMatrixWorld(true);
  const point = new T.Vector3(),
    normal = new T.Vector3(),
    scale = new T.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || !materials.has(o.material)) return;
    const type = o.geometry.type;
    if (!['BoxGeometry', 'CylinderGeometry', 'ConeGeometry'].includes(type)) return;
    const g = o.geometry.clone();
    delete g.userData.shared;
    o.geometry = g;
    const uv = g.attributes.uv,
      position = g.attributes.position,
      normals = g.attributes.normal;
    if (type === 'BoxGeometry') {
      const normalMatrix = new T.Matrix3().getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i).applyMatrix4(o.matrixWorld);
        normal.fromBufferAttribute(normals, i).applyMatrix3(normalMatrix).normalize();
        const x = Math.abs(normal.x),
          y = Math.abs(normal.y),
          z = Math.abs(normal.z);
        uv.setXY(
          i,
          (x > z && x > y ? point.z : point.x) / tileSize,
          (y > x && y > z ? point.z : point.y) / tileSize,
        );
      }
    } else {
      o.getWorldScale(scale);
      const p = g.parameters,
        radius = Math.max(p.radius ?? 0, p.radiusTop ?? 0, p.radiusBottom ?? 0);
      const across = (2 * Math.PI * radius * Math.max(scale.x, scale.z)) / tileSize,
        up = (p.height * scale.y) / tileSize;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * across, uv.getY(i) * up);
    }
    uv.needsUpdate = true;
  });
}
