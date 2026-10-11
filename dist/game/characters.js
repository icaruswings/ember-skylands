import * as T from '../assets/three.module.js';
import { batchParts } from '../engine/batching.js';
import { palette, mat, mesh, orb, point } from './primitives.js';
import { loft, taper, link, planarUvs } from './model-geometry.js';
import { surface } from './surfaces.js';

const cache = new Map();
function geometry(name, build) {
  if (!cache.has(name)) cache.set(name, build());
  return cache.get(name);
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
    belly = mat(0xffd45a),
    horn = surface('horn', 0xffc34d),
    dark = mat(0x143d3c),
    white = mat(0xfff8dc),
    ridge = mat(0xf29527),
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
      ).scale(1, 1, 0.8),
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
      ).scale(1, 1, 0.8),
    ),
    belly,
    head,
  );
  for (const s of [-1, 1]) {
    // White expressive eyes, a broad muzzle and swept golden horns define Spyro's silhouette.
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
    orb(head, dark, s * 0.205, 0.085, 0.896, 0.048, 0.03, 0.042);
    mesh(
      geometry('horn-' + s, () =>
        taper(
          [
            [s * 0.31, 0.45, -0.22],
            [s * 0.46, 0.97, -0.4],
            [s * 0.5, 1.43, -0.62],
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
    // A shorter muzzle keeps the dragon's expressive face readable from the front.
    link(head, dark, [s * 0.31, -0.12, 0.336], [s * 0.245, -0.105, 0.912], 0.015, 0.012, 6);
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
      surface('membrane', 0xffad43),
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

/** Artist-built Gnorc: organic skin, floppy ears, tusks, cloth and a shoulder sack. */
export function createSentinel(type) {
  const root = new T.Group(),
    giant = type === 'giant',
    armored = type === 'armor';
  const skin = surface('skin', giant ? 0x75963a : 0x86ac43),
    cloth = surface('cloth', giant ? 0x765438 : 0x8a3e4d),
    sackCloth = surface('cloth', 0xbd9359),
    dark = mat(0x302c2a),
    ivory = mat(0xf5d6a0),
    white = mat(0xfff7d5),
    iron = surface('armor', 0x6f7478);
  // Broad belly with a narrower neck; shoulders and hips disappear into the tunic.
  const torsoGeometry = geometry('gnorc-tunic', () => {
    const g = loft(
      [
        [0.59, 0.035, 0.025, 0],
        [0.68, 0.54, 0.39, -0.06],
        [0.95, 0.64, 0.49, -0.1],
        [1.24, 0.59, 0.43, -0.07],
        [1.55, 0.48, 0.31, 0],
        [1.72, 0.29, 0.21, 0],
        [1.75, 0.02, 0.02, 0],
      ],
      16,
      18,
    );
    g.rotateX(-Math.PI / 2);
    return g;
  });
  mesh(torsoGeometry, cloth, root);
  // Leather belt follows the round potbelly instead of introducing square armor.
  const belt = mesh(
    geometry('gnorc-belt', () => new T.TorusGeometry(0.56, 0.05, 5, 24)),
    dark,
    root,
    0,
    0.91,
    0.075,
  );
  belt.rotation.x = Math.PI / 2;
  belt.scale.y = 0.77;
  orb(root, ivory, 0, 0.92, 0.505, 0.1, 0.075, 0.03);
  const head = new T.Group();
  head.position.set(0, 1.89, 0.075);
  root.add(head);
  mesh(
    geometry('gnorc-head', () =>
      loft(
        [
          [-0.34, 0.02, 0.02, 0.11],
          [-0.21, 0.38, 0.39, 0.12],
          [0.06, 0.42, 0.4, 0.1],
          [0.32, 0.38, 0.27, -0.01],
          [0.43, 0.17, 0.11, -0.08],
          [0.45, 0.012, 0.012, -0.08],
        ],
        16,
        18,
      ),
    ),
    skin,
    head,
  );
  // A huge drooping nose, underbite and cheek folds make the face readable at game distance.
  orb(head, skin, 0, 0.055, 0.41, 0.23, 0.185, 0.22);
  orb(head, skin, 0, -0.22, 0.32, 0.31, 0.16, 0.14);
  link(head, dark, [-0.27, -0.12, 0.4], [0.27, -0.12, 0.4], 0.016, 0.016, 6);
  for (const sign of [-1, 1]) {
    orb(head, dark, sign * 0.135, -0.005, 0.585, 0.039, 0.026, 0.016);
    orb(head, white, sign * 0.2, 0.25, 0.324, 0.117, 0.12, 0.085);
    orb(head, dark, sign * 0.184, 0.245, 0.402, 0.04, 0.061, 0.019);
    const brow = link(
      head,
      skin,
      [sign * 0.09, 0.35, 0.32],
      [sign * 0.33, 0.37, 0.275],
      0.085,
      0.055,
      8,
    );
    brow.rotation.z += sign * -0.08;
    mesh(
      geometry('gnorc-tusk-' + sign, () =>
        taper(
          [
            [sign * 0.235, -0.21, 0.38],
            [sign * 0.255, -0.08, 0.46],
            [sign * 0.21, 0.02, 0.445],
          ],
          [0.06, 0.04, 0.002],
          8,
          9,
        ),
      ),
      ivory,
      head,
    );
    mesh(
      geometry('gnorc-ear-' + sign, () =>
        taper(
          [
            [sign * 0.34, 0.19, -0.045],
            [sign * 0.58, 0.2, -0.11],
            [sign * 0.72, 0.08, -0.23],
          ],
          [0.12, 0.15, 0.003],
          8,
          10,
        ),
      ),
      skin,
      head,
    );
  }
  const legs = [];
  for (const sign of [-1, 1]) {
    const leg = new T.Group();
    leg.position.set(sign * 0.32, 0.68, 0);
    root.add(leg);
    link(leg, skin, [0, 0, 0], [sign * 0.05, -0.44, 0.025], 0.15, 0.1, 10);
    const boot = mesh(
      geometry('gnorc-boot', () =>
        loft(
          [
            [-0.15, 0.015, 0.015, 0],
            [-0.08, 0.185, 0.145, 0.025],
            [0.24, 0.2, 0.105, -0.01],
            [0.38, 0.03, 0.03, -0.035],
          ],
          12,
          10,
        ),
      ),
      dark,
      leg,
      sign * 0.05,
      -0.53,
      0.08,
    );
    boot.rotation.y = sign * 0.14;
    legs.push(leg);
    orb(root, skin, sign * 0.53, 1.47, 0, 0.2, 0.23, 0.22);
  }
  // One hand grips the sack's mouth over his shoulder; the other balances a running gait.
  mesh(
    geometry('gnorc-arm-left', () =>
      taper(
        [
          [-0.54, 1.46, 0],
          [-0.74, 1.17, 0.13],
          [-0.73, 0.88, 0.34],
        ],
        [0.16, 0.145, 0.105],
        10,
        12,
      ),
    ),
    skin,
    root,
  );
  orb(root, skin, -0.73, 0.86, 0.35, 0.16, 0.18, 0.13);
  mesh(
    geometry('gnorc-arm-right', () =>
      taper(
        [
          [0.54, 1.46, 0],
          [0.78, 1.41, 0.23],
          [0.61, 1.8, 0.22],
        ],
        [0.16, 0.14, 0.105],
        10,
        12,
      ),
    ),
    skin,
    root,
  );
  orb(root, skin, 0.6, 1.8, 0.2, 0.145, 0.15, 0.13);
  const sack = new T.Group();
  sack.position.set(0.66, 1.77, -0.25);
  root.add(sack);
  mesh(
    geometry('gnorc-sack', () => {
      const g = loft(
        [
          [-0.55, 0.015, 0.015, 0],
          [-0.4, 0.38, 0.37, 0],
          [-0.06, 0.49, 0.46, -0.025],
          [0.27, 0.43, 0.38, 0],
          [0.5, 0.15, 0.12, 0.02],
          [0.64, 0.07, 0.06, 0.04],
          [0.68, 0.02, 0.02, 0.04],
        ],
        14,
        18,
      );
      g.rotateX(-Math.PI / 2);
      return g;
    }),
    sackCloth,
    sack,
    0,
    0.0,
    -0.1,
  );
  sack.rotation.z = -0.24;
  if (armored) {
    // A curved metal helmet distinguishes the charge-only enemy without hiding his face.
    mesh(
      geometry('gnorc-helmet', () => {
        const g = new T.SphereGeometry(0.435, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        g.scale(1, 0.7, 0.9);
        return g;
      }),
      iron,
      head,
      0,
      0.34,
      0.01,
    );
    for (const sign of [-1, 1]) orb(root, iron, sign * 0.54, 1.52, -0.025, 0.25, 0.13, 0.25);
  }
  if (giant) root.scale.setScalar(1.35);
  // Preserve each animated leg and sack while batching their material surfaces.
  batchParts(root);
  root.userData = { legs, head, sack, kind: 'gnorc' };
  return root;
}
