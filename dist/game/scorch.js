import * as T from '../assets/three.module.js';
import { terrainHeight } from '../engine/simulation.js';

/** A bounded pool of soft, irregular ground marks accompanies singed grass tips. */
export class ScorchMarks {
  constructor(scene) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d'),
      fade = ctx.createRadialGradient(64, 64, 10, 64, 64, 61);
    fade.addColorStop(0, 'rgba(255,255,255,.65)');
    fade.addColorStop(0.55, 'rgba(255,255,255,.43)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 128, 128);
    let seed = 93;
    for (let i = 0; i < 220; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const x = (seed / 4294967296) * 128;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const y = (seed / 4294967296) * 128;
      ctx.clearRect(x, y, 1, 1);
    }
    const map = new T.CanvasTexture(canvas),
      geo = new T.PlaneGeometry(1.8, 3.8);
    this.marks = [];
    this.cursor = 0;
    this.elapsed = 0;
    this.lastX = Infinity;
    this.lastZ = Infinity;
    for (let i = 0; i < 28; i++) {
      const material = new T.MeshBasicMaterial({
        map,
        color: 0x39251a,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });
      const m = new T.Mesh(geo, material);
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      scene.add(m);
      this.marks.push({ mesh: m, life: 0 });
    }
  }
  update(dt, p, active, level) {
    if (!active) return;
    for (const mark of this.marks)
      if (mark.life > 0) {
        mark.life = Math.max(0, mark.life - dt);
        mark.mesh.visible = mark.life > 0;
        mark.mesh.material.opacity = 0.7 * Math.min(1, mark.life / 6);
      }
    if (p.flame <= 0) {
      this.elapsed = 0;
      this.lastX = Infinity;
      return;
    }
    this.elapsed += dt;
    const x = p.x + Math.sin(p.angle) * 2.4,
      z = p.z + Math.cos(p.angle) * 2.4,
      floor = terrainHeight(level, x, z);
    if (
      floor === null ||
      Math.abs(floor - p.y) > 0.7 ||
      this.elapsed < 0.06 ||
      Math.hypot(x - this.lastX, z - this.lastZ) < 0.9
    )
      return;
    const mark = this.marks[this.cursor++ % this.marks.length];
    mark.life = 45;
    mark.mesh.visible = true;
    mark.mesh.position.set(x, floor + 0.035, z);
    mark.mesh.rotation.set(-Math.PI / 2, 0, -p.angle);
    this.lastX = x;
    this.lastZ = z;
    this.elapsed = 0;
  }
}
