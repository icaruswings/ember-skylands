/** Low trailing camera. The angle is also the basis for camera-relative input. */
export class ChaseCamera {
  constructor() {
    this.angle = 0;
    this.manualTime = 0;
    this.recenterTime = 0;
    this.distance = 7.6;
    this.initialized = false;
  }
  update(dt, p, orbit = 0, recenter = false) {
    if (recenter) {
      this.recenterTime = 0.45;
      this.manualTime = 0;
    }
    this.recenterTime = Math.max(0, this.recenterTime - dt);
    if (orbit) {
      this.recenterTime = 0;
      this.angle += orbit;
      this.manualTime = 1.8;
    } else this.manualTime = Math.max(0, this.manualTime - dt);
    const speed = Math.hypot(p.vx, p.vz);
    // Live screen-relative walking needs a fixed yaw: following a held diagonal
    // would rotate its input basis every frame and send the dragon in circles.
    // Charge/glide intentionally use sweeping arcs and can follow automatically.
    const followHeading = p.viewX === undefined || p.charging || p.gliding;
    if (this.recenterTime || (!this.manualTime && speed > 0.2 && followHeading)) {
      const desired = p.angle + Math.PI;
      const delta = Math.atan2(Math.sin(desired - this.angle), Math.cos(desired - this.angle));
      this.angle += delta * (1 - Math.exp(-dt * (this.recenterTime ? 12 : 2.5)));
    }
    const x = p.x + Math.sin(this.angle) * this.distance,
      z = p.z + Math.cos(this.angle) * this.distance,
      y = p.y + 2.65 + (p.gliding ? 0.45 : 0);
    const follow = this.initialized ? 1 - Math.exp(-dt * 8) : 1;
    this.x = x;
    this.y = this.initialized ? this.y + (y - this.y) * follow : y;
    this.z = z;
    this.targetX = p.x - Math.sin(this.angle) * 1.7;
    this.targetY = this.initialized
      ? this.targetY + (p.y + 1.25 - this.targetY) * follow
      : p.y + 1.25;
    this.targetZ = p.z - Math.cos(this.angle) * 1.7;
    this.initialized = true;
    return this;
  }
}
