import * as T from '../assets/three.module.js';
import { mesh } from './primitives.js';
import { taper } from './model-geometry.js';
import { surface } from './surfaces.js';

const leafGeometry = new T.BufferGeometry();
leafGeometry.setAttribute(
  'position',
  new T.Float32BufferAttribute(
    [
      0, 0, 0, -0.26, 0, 0.25, -0.35, 0, 0.52, -0.24, 0, 0.8, 0, 0, 1, 0.24, 0, 0.8, 0.35, 0, 0.52,
      0.26, 0, 0.25, 0, 0.1, 0.5,
    ],
    3,
  ),
);
leafGeometry.setAttribute(
  'uv',
  new T.Float32BufferAttribute(
    [0.5, 0, 0.13, 0.25, 0, 0.52, 0.16, 0.8, 0.5, 1, 0.84, 0.8, 1, 0.52, 0.87, 0.25, 0.5, 0.5],
    2,
  ),
);
leafGeometry.setIndex(Array.from({ length: 8 }, (_, i) => [8, i, (i + 1) % 8]).flat());
leafGeometry.computeVertexNormals();

/** Branching oak with individually shaped leaves; the world batches its surfaces. */
export function createTree(seed = 1) {
  const root = new T.Group(),
    bark = surface('bark');
  const leaves = [
    surface('foliage', 0xe4edc7),
    surface('foliage', 0xffffff),
    surface('foliage', 0xc4d4ae),
  ];
  let value = seed;
  const random = () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
  const lean = (random() - 0.5) * 0.5;
  mesh(
    taper(
      [
        [0, 0, 0],
        [lean, 0.9, 0.06],
        [lean * 0.6, 2.3, -0.09],
        [lean + 0.1, 4.2, 0],
      ],
      [0.44, 0.26, 0.19, 0.025],
      10,
      16,
    ),
    bark,
    root,
  );
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    mesh(
      taper(
        [
          [0, 0.22, 0],
          [Math.sin(a) * 0.48, 0.09, Math.cos(a) * 0.48],
          [Math.sin(a) * 0.9, 0.025, Math.cos(a) * 0.9],
        ],
        [0.16, 0.11, 0.008],
        6,
        6,
      ),
      bark,
      root,
    );
  }
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4,
      radius = i > 5 ? 0.85 : 1.35;
    const end = [
      Math.sin(a) * radius,
      3.3 + (i % 3) * 0.48 + (i >= 6 ? 0.55 : 0),
      Math.cos(a) * radius,
    ];
    mesh(
      taper(
        [[lean * 0.5, 1.9 + (i % 3) * 0.32, 0], [end[0] * 0.5, end[1] - 0.45, end[2] * 0.55], end],
        [0.16, 0.095, 0.022],
        7,
        8,
      ),
      bark,
      root,
    );
    for (let cluster = 0; cluster < 2; cluster++) {
      const fan = new T.Group();
      fan.position.set(
        end[0] + (random() - 0.5) * 0.55,
        end[1] + cluster * 0.3,
        end[2] + (random() - 0.5) * 0.55,
      );
      root.add(fan);
      for (let j = 0; j < 9; j++) {
        const angle = j * 2.4,
          r = 0.12 + Math.sqrt(random()) * 0.55;
        const leaf = mesh(
          leafGeometry,
          leaves[(i + cluster) % 3],
          fan,
          Math.sin(angle) * r,
          (random() - 0.5) * 0.32,
          Math.cos(angle) * r,
        );
        leaf.scale.setScalar(0.7 + random() * 0.65);
        leaf.rotation.set((random() - 0.5) * 1.2, angle, (random() - 0.5) * 0.7);
      }
    }
  }
  return root;
}
