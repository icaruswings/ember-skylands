import * as T from '../assets/three.module.js';
import { mesh, block, orb } from './primitives.js';
import { groundHeight } from '../engine/terrain.js';

/** Visible solids use the same dimensions and feet height as simulation obstacles. */
export function createLandFeatures(root, level, { stone, roof, trim }) {
  const features = new T.Group();
  features.name = 'authored-land-features';
  root.add(features);
  const names = [],
    leaves = new T.MeshStandardMaterial({ color: 0x426d39, roughness: 1 }),
    flowers = new T.MeshStandardMaterial({ color: 0xd9a0c8, roughness: 0.8 }),
    crystal = new T.MeshStandardMaterial({
      color: 0x91b5e6,
      roughness: 0.25,
      metalness: 0.25,
      emissive: 0x27436d,
      emissiveIntensity: 0.3,
    });
  for (const o of level.obstacles) {
    const g = new T.Group();
    g.name = `solid-${o.secretId || o.style || 'boulder'}`;
    g.position.set(o.x, o.y, o.z);
    features.add(g);
    const height = o.height ?? 3.2;
    if (!o.r) {
      block(g, stone, 0, height / 2, 0, o.halfX * 2, height, o.halfZ * 2);
      if (o.style === 'garden') {
        block(g, leaves, 0, height + 0.25, 0, o.halfX * 2 - 0.3, 0.6, o.halfZ * 2 - 0.3);
        for (let i = 0; i < 10; i++)
          orb(
            g,
            flowers,
            (i % 2 ? 1 : -1) * 1.3,
            height + 0.65,
            -8 + Math.floor(i / 2) * 4,
            0.4,
            0.25,
            0.4,
          );
      } else if (o.style === 'grove') {
        block(g, leaves, 0, height + 0.3, 0, 1.5, 0.6, 8);
      }
    } else if (o.style === 'mesa') {
      mesh(new T.CylinderGeometry(o.r * 0.8, o.r, height, 24), stone, g, 0, height / 2, 0);
      mesh(new T.CylinderGeometry(o.r * 0.84, o.r * 0.84, 0.5, 24), trim, g, 0, height, 0);
      mesh(new T.CylinderGeometry(o.r * 0.95, o.r * 0.96, 0.35, 24), roof, g, 0, height * 0.35, 0);
    } else if (o.style === 'crystal') {
      mesh(
        new T.CylinderGeometry(o.r * 0.9, o.r, height * 0.55, 16),
        stone,
        g,
        0,
        height * 0.275,
        0,
      );
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4,
          r = i ? o.r * 0.48 : 0;
        mesh(
          new T.CylinderGeometry(0, o.r * 0.3, height * 0.7, 8),
          crystal,
          g,
          Math.sin(a) * r,
          height * 0.65,
          Math.cos(a) * r,
        );
      }
    } else {
      const rock = mesh(new T.DodecahedronGeometry(o.r, 2), stone, g, 0, 1.6, 0);
      rock.scale.y = 0.64;
    }
  }
  for (const secret of level.secrets) {
    const g = new T.Group();
    g.name = secret.id;
    g.position.set(secret.x, secret.y, secret.z);
    features.add(g);
    names.push(secret.name);
    if (secret.kind === 'grotto') {
      // Raised vaulted silhouette; no front wall or low lintel across the doorway.
      block(g, stone, 0, 8.2, 0, 15.4, 1.4, 17.4);
      block(g, roof, 0, 9.05, 0, 16.2, 0.6, 18.2);
      for (const side of [-1, 1]) {
        block(g, trim, side * 7, 6, 8.1, 1.5, 2.2, 0.4);
        const light = new T.MeshStandardMaterial({
          color: 0xf9d480,
          emissive: 0xfa9c37,
          emissiveIntensity: 0.8,
        });
        orb(g, light, side * 5.3, 3.6, 5, 0.25, 0.45, 0.25);
      }
    } else if (secret.kind === 'grove') {
      // The terrain-fitted, collidable hedge walls are authored obstacles above.
    } else if (secret.kind === 'camp') {
      // Supplies flank the treasure, leaving a six-unit aisle from the trail.
      for (const side of [-1, 1])
        for (let i = 0; i < 3; i++) {
          const barrel = mesh(
            new T.CylinderGeometry(0.8, 0.8, 1.7, 16),
            roof,
            g,
            side * 4.8,
            0.85,
            i * 2 - 2,
          );
          block(g, trim, barrel.position.x, 1.15, barrel.position.z, 1.65, 0.15, 1.65);
        }
    } else {
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (0.12 + i * 0.12);
        mesh(
          new T.CylinderGeometry(0, 0.7, 3 + (i % 2), 8),
          crystal,
          g,
          Math.cos(a) * 5.5,
          1.7,
          -Math.sin(a) * 5.5,
        );
      }
    }
  }
  for (const region of level.regions) names.push(region.name);
  // Individual materials belong to the scene; disposal follows ordinary scene ownership.
  return { root: features, landmarks: names };
}
