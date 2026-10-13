import * as T from '../assets/three.module.js';
import { GrassField } from '../engine/grass-field.js';

/** Curved ribbon tufts use instancing, wind, color gradients and a burn attribute. */
export function createGrass(root, level) {
  let seed = 8241;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const points = [],
    lookup = [],
    groups = [],
    dummy = new T.Object3D(),
    color = new T.Color();
  const positions = [],
    uvs = [];
  for (let blade = 0; blade < 3; blade++) {
    const angle = (blade * Math.PI * 2) / 3,
      cs = Math.cos(angle),
      sn = Math.sin(angle);
    const vertex = (side, row) => {
      const y = row * 0.28,
        width = 0.065 * (1 - row / 2),
        bend = row * row * 0.038;
      return [side * width * cs - bend * sn, y, side * width * sn + bend * cs];
    };
    for (let row = 0; row < 2; row++)
      for (const [side, r] of [
        [-1, row],
        [1, row],
        [-1, row + 1],
        [1, row],
        [1, row + 1],
        [-1, row + 1],
      ]) {
        positions.push(...vertex(side, r));
        uvs.push((side + 1) / 2, r / 2);
      }
  }
  const base = new T.BufferGeometry();
  base.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  base.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  base.computeVertexNormals();
  const uniforms = { time: { value: 0 } };
  let quality = 'high';
  const material = new T.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    side: T.DoubleSide,
    vertexColors: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.grassTime = uniforms.time;
    shader.vertexShader =
      'attribute float burn;uniform float grassTime;varying float vBurn;varying float vHeight;\n' +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vBurn=burn;vHeight=uv.y;
      transformed.y*=1.0-burn*.78;
      vec4 baseWorld=instanceMatrix*vec4(0.,0.,0.,1.);
      transformed.x+=sin(grassTime*1.8+baseWorld.x*.6+baseWorld.z*.3)*uv.y*uv.y*.09*(1.-burn);
    `,
    );
    shader.fragmentShader = 'varying float vBurn;varying float vHeight;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      diffuseColor.rgb*=mix(vec3(.36,.6,.24),vec3(.72,.98,.42),vHeight);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.038,.028,.018),vBurn*smoothstep(.35,.9,vHeight));
    `,
    );
  };
  material.customProgramCacheKey = () => 'curved-burnable-grass-v1';
  const paths = [
    [0, 14, 0, -14, 1.95],
    [0, 3, 13, -7, 1.9],
    [0, 3, -14, -10, 1.9],
    [0, 3, 12, 1, 1.4],
    [-12, 6, -20, 6, 1.45],
  ];
  const onPath = (x, z) =>
    paths.some(([ax, az, bx, bz, w]) => {
      const dx = bx - ax,
        dz = bz - az,
        t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      return Math.hypot(x - ax - t * dx, z - az - t * dz) < w;
    });
  for (const land of level.islands) {
    const count = land.tuftCount ?? (land.id === 'meadow' ? 3000 : 1300),
      geometry = base.clone(),
      burn = new Float32Array(count);
    geometry.setAttribute('burn', new T.InstancedBufferAttribute(burn, 1));
    const m = new T.InstancedMesh(geometry, material, count);
    m.receiveShadow = true;
    m.castShadow = false;
    root.add(m);
    m.userData.land = { x: land.x, z: land.z };
    groups.push(m);
    for (let i = 0; i < count; i++) {
      let x,
        z,
        attempt = 0;
      do {
        const a = rand() * Math.PI * 2,
          r = Math.sqrt(rand()) * (land.r - 0.7);
        x = land.x + Math.sin(a) * r;
        z = land.z + Math.cos(a) * r;
      } while (
        ++attempt < 80 &&
        ((land.y === 0 && (onPath(x, z) || Math.hypot((x + 10) / 1.05, (z - 6) / 0.7) < 4.4)) ||
          level.obstacles.some((o) =>
            o.r
              ? Math.hypot(x - o.x, z - o.z) < o.r + 0.5
              : Math.abs(x - o.x) < o.halfX + 0.4 && Math.abs(z - o.z) < o.halfZ + 0.4,
          ) ||
          level.rescues.some((r) => Math.hypot(x - r.x, z - r.z) < 1.6))
      );
      points.push({ x, y: land.y, z });
      lookup.push({ m, index: i });
      dummy.position.set(x, land.y + 0.025, z);
      dummy.rotation.y = rand() * Math.PI * 2;
      dummy.scale.setScalar(0.7 + rand() * 0.7);
      dummy.scale.y *= 0.65 + rand() * 0.4;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.24 + rand() * 0.045, 0.42 + rand() * 0.25, 0.23 + rand() * 0.16);
      m.setColorAt(i, color);
    }
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }
  base.dispose();
  const field = new GrassField(points);
  return {
    field,
    groups,
    setQuality(value) {
      quality = value;
      for (const g of groups)
        g.count =
          quality === 'low' ? Math.floor(g.instanceMatrix.count * 0.55) : g.instanceMatrix.count;
    },
    update(dt, p, active, time) {
      if (quality === 'low')
        for (const g of groups) {
          const d = Math.hypot(p.x - g.userData.land.x, p.z - g.userData.land.z);
          const fraction = 0.55 - 0.3 * Math.min(1, Math.max(0, (d - 18) / 18));
          g.count = Math.floor(g.instanceMatrix.count * fraction);
        }
      if (!active) return;
      uniforms.time.value = time;
      if (p.flame <= 0) return;
      const touched = new Set();
      for (const i of field.singe(p, dt)) {
        const { m, index } = lookup[i];
        m.geometry.attributes.burn.array[index] = field.burn[i];
        touched.add(m);
      }
      for (const m of touched) m.geometry.attributes.burn.needsUpdate = true;
    },
  };
}
