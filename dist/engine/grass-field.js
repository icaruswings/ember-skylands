/** Spatially indexed, monotonic grass burn state; independent of the renderer. */
export class GrassField {
  constructor(points) {
    this.points = points;
    this.burn = new Float32Array(points.length);
    this.cells = new Map();
    this.changed = [];
    points.forEach((p, i) => {
      const key = this.key(Math.floor(p.x / 4), Math.floor(p.z / 4));
      if (!this.cells.has(key)) this.cells.set(key, []);
      this.cells.get(key).push(i);
    });
  }
  key(x, z) {
    return `${x},${z}`;
  }
  singe(p, dt) {
    this.changed.length = 0;
    const sx = Math.sin(p.angle),
      sz = Math.cos(p.angle);
    for (let x = Math.floor((p.x - 5) / 4); x <= Math.floor((p.x + 5) / 4); x++)
      for (let z = Math.floor((p.z - 5) / 4); z <= Math.floor((p.z + 5) / 4); z++)
        for (const i of this.cells.get(this.key(x, z)) || []) {
          const blade = this.points[i],
            dx = blade.x - p.x,
            dz = blade.z - p.z,
            along = dx * sx + dz * sz,
            side = Math.abs(dx * sz - dz * sx);
          if (
            along < 0.5 ||
            along > 4.7 ||
            side > 0.35 + along * 0.3 ||
            Math.abs(blade.y - p.y) > 0.7
          )
            continue;
          const before = this.burn[i];
          this.burn[i] = Math.min(1, before + dt * 4);
          if (this.burn[i] !== before) this.changed.push(i);
        }
    return this.changed;
  }
}
