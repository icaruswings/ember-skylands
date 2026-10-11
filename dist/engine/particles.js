import * as T from '../assets/three.module.js';
/** A fixed pool avoids per-frame object allocation and uncontrolled effect growth. */
export class Particles {
  constructor(scene, max = 220) {
    this.max = max;
    this.life = new Float32Array(max);
    this.velocity = new Float32Array(max * 3);
    this.position = new Float32Array(max * 3);
    this.colors = new Float32Array(max * 3);
    this.geometry = new T.BufferGeometry();
    this.geometry.setAttribute('position', new T.BufferAttribute(this.position, 3));
    this.geometry.setAttribute('color', new T.BufferAttribute(this.colors, 3));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const c = canvas.getContext('2d'),
      g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
    this.material = new T.PointsMaterial({
      size: 0.33,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      map: new T.CanvasTexture(canvas),
    });
    this.points = new T.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.cursor = 0;
    for (let i = 0; i < max; i++) this.position[i * 3 + 1] = -1000;
  }
  emit(x, y, z, color, count = 20, force = 2) {
    const c = new T.Color(color);
    for (let i = 0; i < count; i++) {
      const p = this.cursor++ % this.max,
        j = p * 3;
      this.life[p] = 0.4 + Math.random() * 0.7;
      this.position[j] = x;
      this.position[j + 1] = y;
      this.position[j + 2] = z;
      this.velocity[j] = (Math.random() - 0.5) * force * 2;
      this.velocity[j + 1] = Math.random() * force;
      this.velocity[j + 2] = (Math.random() - 0.5) * force * 2;
      this.colors[j] = c.r;
      this.colors[j + 1] = c.g;
      this.colors[j + 2] = c.b;
    }
  }
  update(dt) {
    for (let i = 0; i < this.max; i++) {
      const j = i * 3;
      if (this.life[i] > 0) {
        this.life[i] -= dt;
        this.position[j] += this.velocity[j] * dt;
        this.position[j + 1] += this.velocity[j + 1] * dt;
        this.position[j + 2] += this.velocity[j + 2] * dt;
        this.velocity[j + 1] -= dt * 2;
      } else this.position[j + 1] = -1000;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}
