/** Low trailing camera. The angle is also the basis for camera-relative input. */
export class ChaseCamera {
  constructor() {
    this.angle = 0;
    this.manualTime = 0;
    this.distance = 7.6;
    this.initialized = false;
  }
  update(dt, p, orbit = 0) {
    if (orbit) {
      this.angle += orbit;
      this.manualTime = 1.8;
    } else this.manualTime = Math.max(0, this.manualTime - dt);
    if (!this.manualTime && Math.hypot(p.vx, p.vz) > 0.2) {
      const desired = p.angle + Math.PI;
      const delta = Math.atan2(Math.sin(desired - this.angle), Math.cos(desired - this.angle));
      this.angle += delta * (1 - Math.exp(-dt * 2.5));
    }
    const x = p.x + Math.sin(this.angle) * this.distance,
      z = p.z + Math.cos(this.angle) * this.distance,
      y = p.y + 2.65 + (p.gliding ? 0.45 : 0);
    const follow = this.initialized ? 1 - Math.exp(-dt * 8) : 1;
    this.x = this.initialized ? this.x + (x - this.x) * follow : x;
    this.y = this.initialized ? this.y + (y - this.y) * follow : y;
    this.z = this.initialized ? this.z + (z - this.z) * follow : z;
    this.targetX = p.x - Math.sin(this.angle) * 1.7;
    this.targetY = this.initialized
      ? this.targetY + (p.y + 1.25 - this.targetY) * follow
      : p.y + 1.25;
    this.targetZ = p.z - Math.cos(this.angle) * 1.7;
    this.initialized = true;
    return this;
  }
}
