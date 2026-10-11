import * as T from '../assets/three.module.js';

/** Smooth elliptical cross-sections along Z; profiles are [z, width, height, y]. */
export function loft(profiles, radial = 20, steps = 28) {
  const curve = new T.CatmullRomCurve3(
    profiles.map(([z, width, height]) => new T.Vector3(z, width, height)),
  );
  const center = new T.CatmullRomCurve3(profiles.map(([z, , , y]) => new T.Vector3(z, y, 0)));
  const positions = [],
    uvs = [],
    indices = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      p = curve.getPoint(t),
      c = center.getPoint(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      positions.push(
        Math.cos(a) * Math.max(0.006, p.y),
        c.y + Math.sin(a) * Math.max(0.006, p.z),
        p.x,
      );
      uvs.push(j / radial, t);
      if (i < steps && j < radial) {
        const k = i * (radial + 1) + j;
        indices.push(k, k + 1, k + radial + 1, k + 1, k + radial + 2, k + radial + 1);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  smoothSeam(geometry, radial, steps);
  return geometry;
}

/** A continuous curved taper, used for tails, horns, roots and branches. */
export function taper(points, radii, radial = 10, steps = 24) {
  const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)));
  const frames = curve.computeFrenetFrames(steps, false),
    positions = [],
    uvs = [],
    indices = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      p = curve.getPoint(t),
      f = t * (radii.length - 1),
      k = Math.min(Math.floor(f), radii.length - 2);
    const radius = T.MathUtils.lerp(radii[k], radii[k + 1], f - k);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const v = p
        .clone()
        .addScaledVector(frames.normals[i], Math.cos(a) * radius)
        .addScaledVector(frames.binormals[i], Math.sin(a) * radius);
      positions.push(v.x, v.y, v.z);
      uvs.push(j / radial, t);
      if (i < steps && j < radial) {
        const n = i * (radial + 1) + j;
        indices.push(n, n + 1, n + radial + 1, n + 1, n + radial + 2, n + radial + 1);
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  smoothSeam(g, radial, steps);
  return g;
}

function smoothSeam(geometry, radial, steps) {
  const normals = geometry.attributes.normal;
  for (let row = 0; row <= steps; row++) {
    const first = row * (radial + 1),
      last = first + radial;
    const normal = new T.Vector3()
      .fromBufferAttribute(normals, first)
      .add(new T.Vector3().fromBufferAttribute(normals, last))
      .normalize();
    normals.setXYZ(first, normal.x, normal.y, normal.z);
    normals.setXYZ(last, normal.x, normal.y, normal.z);
  }
}

export function planarUvs(geometry) {
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox,
    extent = bounds.getSize(new T.Vector3());
  const position = geometry.attributes.position,
    normal = geometry.attributes.normal,
    uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    const nx = Math.abs(normal.getX(i)),
      ny = Math.abs(normal.getY(i)),
      nz = Math.abs(normal.getZ(i));
    const x = (position.getX(i) - bounds.min.x) / extent.x,
      y = (position.getY(i) - bounds.min.y) / extent.y,
      z = (position.getZ(i) - bounds.min.z) / extent.z;
    uv.setXY(i, nx > ny && nx > nz ? z : x, ny > nz && ny > nx ? z : y);
  }
  return geometry;
}

export function beveledBox() {
  const shape = new T.Shape(),
    r = 0.06,
    h = 0.44;
  shape.moveTo(-h + r, -h);
  shape.lineTo(h - r, -h);
  shape.quadraticCurveTo(h, -h, h, -h + r);
  shape.lineTo(h, h - r);
  shape.quadraticCurveTo(h, h, h - r, h);
  shape.lineTo(-h + r, h);
  shape.quadraticCurveTo(-h, h, -h, h - r);
  shape.lineTo(-h, -h + r);
  shape.quadraticCurveTo(-h, -h, -h + r, -h);
  const g = new T.ExtrudeGeometry(shape, {
    depth: 0.88,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    bevelSegments: 2,
    curveSegments: 3,
    steps: 1,
  });
  g.translate(0, 0, -0.44);
  return planarUvs(g);
}

export function link(parent, material, from, to, radiusA, radiusB = radiusA, sides = 10) {
  const a = new T.Vector3(...from),
    b = new T.Vector3(...to),
    axis = b.clone().sub(a);
  const object = new T.Mesh(
    new T.CylinderGeometry(radiusB, radiusA, axis.length(), sides),
    material,
  );
  object.position.copy(a.add(b).multiplyScalar(0.5));
  object.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), axis.normalize());
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
}
