import * as T from '../assets/three.module.js';
import { batchParts } from '../engine/batching.js';
import { palette, mat, mesh, orb, point } from './primitives.js';
import { loft, taper, link, planarUvs, beveledBox } from './model-geometry.js';
import { surface } from './surfaces.js';

const cache = new Map();
function geometry(name, build) {
  if (!cache.has(name)) cache.set(name, build());
  return cache.get(name);
}
function block(parent, material, x, y, z, sx, sy, sz) {
  const object = mesh(geometry('armor-block', beveledBox), material, parent, x, y, z);
  object.scale.set(sx, sy, sz);
  return object;
}
function wing(sign) {
  const shape = new T.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(sign * 0.65, 0.8, sign * 1.12, 0.82);
  shape.lineTo(sign * 2.32, 0.26);
  shape.quadraticCurveTo(sign * 1.7, 0.1, sign * 1.64, -0.44);
  shape.quadraticCurveTo(sign * 1.1, -0.25, sign * 0.84, -0.76);
  shape.quadraticCurveTo(sign * 0.45, -0.36, 0, -0.46);
  const g = new T.ShapeGeometry(shape, 12),
    uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++)
    uv.setXY(
      i,
      Math.abs(g.attributes.position.getX(i)) / 2.32,
      (g.attributes.position.getY(i) + 0.76) / 1.58,
    );
  return g;
}

export function createDragon(scale = 1, color = palette.dragon) {
  const root = new T.Group(),
    torso = new T.Group();
  root.add(torso);
  const skin = surface('scales', color),
    belly = mat(0xf2d69c),
    horn = mat(0xf5e7c4),
    dark = mat(0x143d3c),
    white = mat(0xfff8dc),
    ridge = mat(0x246d65),
    iris = mat(0xe8a52f, { roughness: 0.3 });
  mesh(
    geometry('torso', () =>
      loft([
        [-1.06, 0.015, 0.015, 0.88],
        [-0.8, 0.46, 0.47, 0.9],
        [-0.25, 0.55, 0.48, 0.93],
        [0.37, 0.4, 0.38, 1.0],
        [0.8, 0.24, 0.28, 1.08],
        [1, 0.015, 0.015, 1.1],
      ]),
    ),
    skin,
    torso,
  );
  mesh(
    geometry('neck', () =>
      taper(
        [
          [0, 1, 0.45],
          [0, 1.36, 0.77],
          [0, 1.57, 1.0],
        ],
        [0.31, 0.28, 0.24],
        16,
        14,
      ),
    ),
    skin,
    torso,
  );
  for (let i = 0; i < 6; i++) {
    const z = -0.48 + i * 0.22;
    const plate = mesh(
      geometry('belly-plate', () =>
        loft(
          [
            [-0.12, 0.04, 0.02, 0],
            [-0.07, 0.37, 0.055, 0],
            [0.07, 0.34, 0.055, 0],
            [0.12, 0.03, 0.015, 0],
          ],
          12,
          8,
        ),
      ),
      belly,
      torso,
      0,
      0.56 + i * 0.022,
      z,
    );
    plate.rotation.x = -0.12;
  }
  const head = new T.Group();
  head.position.set(0, 1.45, 0.9);
  torso.add(head);
  mesh(
    geometry('skull', () =>
      loft(
        [
          [-0.53, 0.03, 0.03, 0.1],
          [-0.25, 0.42, 0.38, 0.18],
          [0.13, 0.45, 0.34, 0.2],
          [0.4, 0.35, 0.24, 0.08],
          [0.9, 0.3, 0.19, 0.015],
          [1.18, 0.25, 0.13, -0.015],
          [1.24, 0.01, 0.01, -0.035],
        ],
        20,
        30,
      ),
    ),
    skin,
    head,
  );
  mesh(
    geometry('jaw', () =>
      loft(
        [
          [0.22, 0.03, 0.02, -0.2],
          [0.43, 0.32, 0.065, -0.22],
          [1.05, 0.255, 0.065, -0.19],
          [1.19, 0.04, 0.02, -0.18],
        ],
        16,
        14,
      ),
    ),
    belly,
    head,
  );
  for (const s of [-1, 1]) {
    // Small eyes sit within a sculpted brow, rather than defining the head's bulk.
    orb(head, white, s * 0.39, 0.31, 0.4, 0.16, 0.195, 0.13);
    orb(head, iris, s * 0.416, 0.31, 0.524, 0.096, 0.135, 0.035);
    orb(head, dark, s * 0.419, 0.31, 0.56, 0.038, 0.105, 0.016);
    orb(head, white, s * 0.443, 0.37, 0.579, 0.018);
    const brow = mesh(
      geometry('brow', () =>
        taper(
          [
            [0, 0, -0.2],
            [0, 0.05, 0],
            [0, -0.015, 0.22],
          ],
          [0.1, 0.12, 0.025],
          8,
          10,
        ),
      ),
      skin,
      head,
      s * 0.4,
      0.49,
      0.3,
    );
    brow.rotation.z = s * -0.2;
    orb(head, dark, s * 0.205, 0.085, 1.12, 0.048, 0.03, 0.042);
    mesh(
      geometry('horn-' + s, () =>
        taper(
          [
            [s * 0.31, 0.45, -0.22],
            [s * 0.42, 0.75, -0.36],
            [s * 0.43, 1.0, -0.65],
          ],
          [0.125, 0.09, 0.006],
          10,
          16,
        ),
      ),
      horn,
      head,
    );
    const earShape = new T.Shape();
    earShape.moveTo(0, 0);
    earShape.lineTo(s * 0.54, 0.22);
    earShape.lineTo(s * 0.36, -0.2);
    earShape.lineTo(0, -0.12);
    const ear = mesh(
      planarUvs(
        new T.ExtrudeGeometry(earShape, {
          depth: 0.055,
          bevelEnabled: true,
          bevelSize: 0.02,
          bevelThickness: 0.02,
          bevelSegments: 1,
          steps: 1,
        }),
      ),
      skin,
      head,
      s * 0.36,
      0.28,
      -0.29,
    );
    ear.rotation.y = s * -0.25;
    // Mouth seam follows the long muzzle, with a cheek corner visible in profile.
    link(head, dark, [s * 0.31, -0.12, 0.42], [s * 0.245, -0.105, 1.14], 0.015, 0.012, 6);
  }
  const legs = [];
  for (const z of [-0.67, 0.57])
    for (const s of [-1, 1]) {
      const leg = new T.Group();
      leg.position.set(s * 0.43, 0.72, z);
      torso.add(leg);
      const hind = z < 0;
      link(
        leg,
        skin,
        [0, 0, 0],
        [s * 0.085, -0.34, hind ? 0.12 : -0.08],
        hind ? 0.21 : 0.15,
        0.115,
        12,
      );
      orb(leg, skin, s * 0.085, -0.34, hind ? 0.12 : -0.08, 0.12, 0.12, 0.12);
      link(
        leg,
        skin,
        [s * 0.085, -0.34, hind ? 0.12 : -0.08],
        [s * 0.07, -0.54, 0.16],
        0.115,
        0.075,
        10,
      );
      mesh(
        geometry('foot', () =>
          loft(
            [
              [-0.16, 0.02, 0.02, 0],
              [-0.1, 0.16, 0.09, 0],
              [0.24, 0.17, 0.08, 0],
              [0.33, 0.025, 0.025, 0],
            ],
            12,
            10,
          ),
        ),
        skin,
        leg,
        s * 0.07,
        -0.6,
        0.1,
      );
      for (let i = 0; i < 3; i++)
        mesh(
          geometry('claw', () =>
            taper(
              [
                [0, 0, 0],
                [0, -0.035, 0.12],
                [0, -0.07, 0.2],
              ],
              [0.037, 0.03, 0.002],
              7,
              6,
            ),
          ),
          horn,
          leg,
          s * 0.07 + (i - 1) * 0.11,
          -0.61,
          0.33,
        );
      legs.push(leg);
    }
  const tail = new T.Group();
  tail.position.set(0, 0.91, -0.85);
  torso.add(tail);
  mesh(
    geometry('tail', () =>
      taper(
        [
          [0, 0, 0],
          [0.16, -0.08, -0.6],
          [0.35, 0.0, -1.32],
          [0.22, 0.19, -2.02],
          [0.05, 0.36, -2.38],
        ],
        [0.28, 0.21, 0.13, 0.07, 0.005],
        14,
        32,
      ),
    ),
    skin,
    tail,
  );
  for (let i = 0; i < 7; i++) {
    const spike = point(torso, ridge, 0, 1.5 - i * 0.037, 0.47 - i * 0.25, 0.095, 0.24);
    spike.rotation.x = -0.22;
  }
  for (let i = 0; i < 4; i++)
    point(
      tail,
      ridge,
      0.13 + i * 0.045,
      0.08 + i * 0.036,
      -0.45 - i * 0.37,
      0.07 - i * 0.01,
      0.2 - i * 0.025,
    );
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new T.Group();
    w.position.set(s * 0.34, 1.23, -0.08);
    torso.add(w);
    mesh(
      geometry('wing-' + s, () => wing(s)),
      surface('membrane'),
      w,
    );
    const elbow = [s * 1.12, 0.82, 0.02];
    link(w, skin, [0, 0, 0.02], elbow, 0.07, 0.045, 8);
    for (const end of [
      [s * 2.32, 0.26, 0.02],
      [s * 1.64, -0.44, 0.02],
      [s * 0.84, -0.76, 0.02],
    ])
      link(w, skin, elbow, end, 0.043, 0.018, 7);
    link(w, skin, [0, 0, 0.02], [s * 0.84, -0.76, 0.02], 0.045, 0.02, 7);
    mesh(
      geometry('wing-claw-' + s, () =>
        taper([elbow, [s * 1.18, 1, 0.02], [s * 1.34, 1.06, 0.02]], [0.05, 0.03, 0.002], 7, 8),
      ),
      horn,
      w,
    );
    wings.push(w);
  }
  batchParts(root);
  root.scale.setScalar(scale);
  root.userData = { torso, head, legs, tail, wings };
  animateDragon(root, 0, 0, false, false);
  return root;
}

export function animateDragon(root, time, speed, gliding, charging) {
  const a = root.userData,
    running = speed > 0.5;
  a.torso.position.y =
    running && !gliding ? Math.abs(Math.sin(time * 12)) * 0.085 : Math.sin(time * 2) * 0.025;
  a.head.rotation.x = charging ? 0.15 : Math.sin(time * 2) * 0.025;
  a.tail.rotation.y = Math.sin(time * 3) * 0.19;
  for (let i = 0; i < a.legs.length; i++)
    a.legs[i].rotation.x = gliding
      ? 0.42
      : running
        ? Math.sin(time * (charging ? 19 : 12) + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.55
        : 0;
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    a.wings[i].rotation.y = s * (gliding ? 0.06 : 0.66);
    a.wings[i].rotation.z =
      s * (gliding ? 0.1 + Math.sin(time * 7) * 0.09 : 0.3 + Math.sin(time * 3) * 0.065);
  }
}

export function createSentinel(type) {
  const root = new T.Group(),
    giant = type === 'giant',
    armored = type === 'armor';
  const stone = surface('armor', giant ? 0x906f9c : 0x6b8d8c),
    trim = surface('armor', 0xd5a652),
    dark = mat(0x263c42),
    eye = mat(giant ? 0xffb24e : 0x9ee8c8, {
      emissive: giant ? 0xe96c18 : 0x47b6a1,
      emissiveIntensity: 0.8,
    });
  const torso = mesh(
    geometry('sentinel-torso', () =>
      loft(
        [
          [-0.4, 0.025, 0.025, 1.02],
          [-0.28, 0.46, 0.5, 1.03],
          [0.12, 0.53, 0.49, 1.12],
          [0.36, 0.31, 0.38, 1.15],
          [0.4, 0.015, 0.015, 1.15],
        ],
        8,
        12,
      ),
    ),
    stone,
    root,
  );
  torso.rotation.x = -0.06;
  // Broad shoulders, a narrow waist and segmented limbs establish a golem silhouette.
  for (const s of [-1, 1]) {
    block(root, dark, s * 0.28, 0.39, -0.02, 0.24, 0.45, 0.28);
    const boot = block(root, stone, s * 0.28, 0.18, 0.1, 0.38, 0.33, 0.6);
    boot.rotation.y = s * 0.1;
    const shoulder = mesh(new T.DodecahedronGeometry(0.33), stone, root, s * 0.66, 1.43, 0);
    shoulder.scale.set(1, 0.8, 1);
    link(root, dark, [s * 0.65, 1.29, 0], [s * 0.79, 0.85, 0.05], 0.11, 0.09, 8);
    const bracer = block(root, stone, s * 0.81, 0.83, 0.06, 0.28, 0.47, 0.31);
    bracer.rotation.z = s * 0.15;
    block(root, dark, s * 0.85, 0.51, 0.12, 0.25, 0.22, 0.28);
    if (giant)
      mesh(
        geometry('sentinel-horn-' + s, () =>
          taper(
            [
              [s * 0.34, 1.99, -0.04],
              [s * 0.52, 2.2, -0.09],
              [s * 0.7, 2.17, -0.13],
            ],
            [0.11, 0.08, 0.004],
            8,
            12,
          ),
        ),
        trim,
        root,
      );
  }
  const helmet = mesh(
    geometry('helmet', () =>
      loft(
        [
          [-0.38, 0.025, 0.025, 1.81],
          [-0.25, 0.34, 0.32, 1.88],
          [0.21, 0.37, 0.29, 1.9],
          [0.4, 0.28, 0.23, 1.85],
          [0.42, 0.02, 0.02, 1.85],
        ],
        8,
        10,
      ),
    ),
    stone,
    root,
  );
  helmet.rotation.x = -0.06;
  block(root, dark, 0, 1.89, 0.421, 0.59, 0.105, 0.035);
  for (const s of [-1, 1]) block(root, eye, s * 0.15, 1.897, 0.442, 0.14, 0.042, 0.015);
  block(root, trim, 0, 1.61, 0.29, 0.43, 0.06, 0.18);
  const chest = block(root, armored ? trim : dark, 0, 1.16, 0.36, 0.34, 0.32, 0.055);
  chest.rotation.z = Math.PI / 4;
  block(root, eye, 0, 1.17, 0.405, 0.12, 0.12, 0.025).rotation.z = Math.PI / 4;
  for (let i = 0; i < 3; i++)
    block(root, trim, 0, 0.74 + i * 0.13, 0.37, 0.52 - i * 0.03, 0.035, 0.035);
  if (armored) {
    block(root, trim, 0, 2.2, 0, 0.08, 0.3, 0.52);
    const shield = block(root, stone, -0.97, 1.0, 0.21, 0.16, 0.92, 0.66);
    shield.rotation.z = -0.12;
    block(root, trim, -1.065, 1.0, 0.21, 0.025, 0.62, 0.07);
    block(root, trim, -1.065, 1.0, 0.21, 0.025, 0.07, 0.46);
  }
  if (giant) root.scale.setScalar(1.35);
  batchParts(root);
  return root;
}
