/** Bounded flame/ember motion, independent of rendering and frame frequency. */
export class FlamePool {
  constructor(max = 128, random = Math.random) {
    this.max = max;
    this.random = random;
    this.position = new Float32Array(max * 3);
    this.velocity = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.duration = new Float32Array(max);
    this.heat = new Float32Array(max);
    this.size = new Float32Array(max);
    this.seed = new Float32Array(max);
    this.cursor = 0;
    this.emission = 0;
    this.emitted = 0;
  }
  get activeCount() {
    return this.life.reduce((count, life) => count + (life > 0 ? 1 : 0), 0);
  }
  update(dt, player, breathing, quality = 'high') {
    dt = Math.min(Math.max(dt, 0), 0.1);
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      const j = i * 3;
      this.life[i] = Math.max(0, this.life[i] - dt);
      const age = 1 - this.life[i] / this.duration[i];
      this.position[j] += this.velocity[j] * dt;
      this.position[j + 1] += this.velocity[j + 1] * dt;
      this.position[j + 2] += this.velocity[j + 2] * dt;
      this.velocity[j + 1] += dt * 3.2;
      this.heat[i] = 1 - age;
      this.size[i] =
        this.life[i] > 0
          ? (0.2 + Math.sin(age * Math.PI) * 0.65) * Math.min(1, (1 - age) * 2.5)
          : 0;
    }
    if (!breathing) {
      this.emission = 0;
      return;
    }
    this.emission += dt * (quality === 'low' ? 70 : 120);
    const sin = Math.sin(player.angle),
      cos = Math.cos(player.angle);
    while (this.emission >= 1 - 1e-8) {
      this.emission = Math.max(0, this.emission - 1);
      const i = this.cursor++ % this.max,
        j = i * 3;
      const sideways = (this.random() - 0.5) * 1.8;
      const speed = 8 + this.random() * 4;
      this.position[j] = player.x + sin * 1.78;
      this.position[j + 1] = player.y + 1.21 + (this.random() - 0.5) * 0.12;
      this.position[j + 2] = player.z + cos * 1.78;
      this.velocity[j] = sin * speed + cos * sideways;
      this.velocity[j + 1] = 0.35 + this.random() * 1.5;
      this.velocity[j + 2] = cos * speed - sin * sideways;
      this.life[i] = this.duration[i] = 0.28 + this.random() * 0.22;
      this.heat[i] = 1;
      this.size[i] = 0.24;
      this.seed[i] = this.random() * 10;
      this.emitted++;
    }
  }
}
