import * as T from '../assets/three.module.js';
import { block, mesh, mat } from './primitives.js';

/** Geometry follows the same declarative surfaces used by collision and landing. */
export function createExplorationScenery(root, level, stone, path) {
  for (const ramp of level.ramps || []) {
    const dx = ramp.bx - ramp.ax,
      dz = ramp.bz - ramp.az,
      run = Math.hypot(dx, dz),
      rise = ramp.by - ramp.ay;
    const g = new T.Group();
    g.position.set((ramp.ax + ramp.bx) / 2, (ramp.ay + ramp.by) / 2, (ramp.az + ramp.bz) / 2);
    g.rotation.y = Math.atan2(dx, dz);
    root.add(g);
    const floor = block(g, path, 0, -0.12, 0, ramp.width, 0.24, Math.hypot(run, rise));
    floor.rotation.x = -Math.atan2(rise, run);
    for (let i = 0; i < 9; i++) {
      const t = i / 8 - 0.5;
      const step = block(g, stone, 0, t * rise + 0.025, t * run, ramp.width, 0.055, 0.13);
      step.rotation.x = -Math.atan2(rise, run);
    }
  }
  for (const p of level.platforms || []) {
    block(root, stone, p.x, p.y - 0.18, p.z, p.halfX * 2, 0.36, p.halfZ * 2);
    if (p.kind === 'landing') continue;
    mesh(
      new T.CylinderGeometry(1.5, 1.75, p.y - 0.2, 16),
      stone,
      root,
      p.x - 1,
      (p.y - 0.2) / 2,
      p.z,
    );
    for (const [x, z] of [
      [p.x - 3, p.z - 2.5],
      [p.x + 3, p.z - 2.5],
      [p.x - 3, p.z + 2.5],
      [p.x + 3, p.z + 2.5],
    ]) {
      block(root, stone, x, p.y + 0.3, z, 0.5, 0.6, 0.5);
      mesh(new T.ConeGeometry(0.4, 0.35, 4), mat(0xd9ac50), root, x, p.y + 0.77, z);
    }
    // Open west side frames the glide landing; banners mark the launch.
    for (const s of [-1, 1]) {
      block(root, stone, p.x - 3, p.y + 1, p.z + s * 1.8, 0.15, 2, 0.15);
      block(root, mat(0x6664bd), p.x - 2.75, p.y + 1.35, p.z + s * 1.8, 0.6, 0.8, 0.035);
    }
  }
  const garden = level.islands.find((i) => i.id === 'secret');
  if (garden) {
    const pink = mat(0xe8a1b4),
      green = mat(0x518141);
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10,
        x = garden.x + Math.sin(a) * 4.3,
        z = garden.z + Math.cos(a) * 4.3;
      block(root, stone, x, garden.y + 0.22, z, 0.8, 0.44, 0.65);
      mesh(new T.DodecahedronGeometry(0.5, 0), green, root, x, garden.y + 0.65, z);
      mesh(new T.IcosahedronGeometry(0.12, 0), pink, root, x + 0.12, garden.y + 1.08, z);
    }
  }
}
