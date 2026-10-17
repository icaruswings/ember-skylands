/** Deterministic full-flight simulation. Ground jumps/glides never use this model. */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export class FlightSimulation {
  constructor(course, options = {}) {
    this.level = course;
    this.timed = !!options.timed;
    this.inverted = !!options.inverted;
    this.timeLimit = options.timeLimit ?? course.timeLimit ?? 90;
    this.restart();
  }
  restart() {
    this.time = 0;
    this.remaining = this.timed ? this.timeLimit : null;
    this.result = null;
    this.events = [];
    this.targets = this.level.targets.map((t) => ({ ...t }));
    this.collectedTargets = new Set();
    this.player = {
      ...this.level.spawn,
      angle: this.level.spawn.angle ?? Math.PI,
      pitch: 0,
      bank: 0,
      loop: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      grounded: false,
      gliding: true,
      flying: true,
      charging: false,
      health: 3,
      flame: 0,
      invincible: 0,
    };
    this.gems = [];
    this.enemies = [];
    this.collected = new Set();
    this.rescued = new Set();
    this.defeated = new Set();
    this.broken = new Set();
    this.rescueTimes = new Map();
    this.loopElapsed = 2;
    this.turnRemaining = 0;
    this.jumpHeld = false;
    this.turnHeld = false;
    this.flameHeld = false;
    this.recoveryCooldown = 0;
  }
  get unlocked() {
    return true;
  }
  get complete() {
    return this.result === 'complete';
  }
  drain() {
    return this.events.splice(0);
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  nearestInteraction() {
    return null;
  }
  interact() {
    return null;
  }
  update(dt, input = {}) {
    if (this.result || dt <= 0) return;
    dt = Math.min(dt, 0.5);
    this.time += dt;
    this.recoveryCooldown = Math.max(0, this.recoveryCooldown - dt);
    const p = this.player,
      previous = { x: p.x, y: p.y, z: p.z };
    const yaw = clamp(input.viewX ?? input.x ?? 0, -1, 1),
      climb = clamp(-(input.viewZ ?? input.z ?? 0) * (this.inverted ? -1 : 1), -1, 1);
    p.angle -= yaw * 1.65 * dt;
    p.pitch += (climb * 0.7 - p.pitch) * (1 - Math.exp(-dt * 10));
    if (input.turnPressed || (input.turn && !this.turnHeld)) this.turnRemaining = Math.PI;
    this.turnHeld = !!input.turn;
    if (this.turnRemaining > 0) {
      const turn = Math.min(this.turnRemaining, dt * 5);
      p.angle += turn;
      this.turnRemaining -= turn;
    }
    p.angle = Math.atan2(Math.sin(p.angle), Math.cos(p.angle));
    if (input.jumpPressed || input.loopPressed || (input.jump && !this.jumpHeld))
      this.loopElapsed = 0;
    this.jumpHeld = !!input.jump;
    this.loopElapsed += dt;
    p.loop = this.loopElapsed < 1.1 ? this.loopElapsed / 1.1 : 0;
    p.bank += ((this.turnRemaining > 0 ? -0.9 : -yaw * 0.55) - p.bank) * (1 - Math.exp(-dt * 9));
    p.flame = Math.max(0, p.flame - dt);
    if (input.flamePressed || (input.flame && !this.flameHeld)) {
      p.flame = 0.42;
      this.emit('flame');
    }
    this.flameHeld = !!input.flame;
    p.charging = !!input.charge;
    const speed = p.charging ? 23 : 16,
      cs = Math.cos(p.pitch);
    p.vx = Math.sin(p.angle) * cs * speed;
    p.vz = Math.cos(p.angle) * cs * speed;
    p.vy = Math.sin(p.pitch) * speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    const b = this.level.bounds;
    if (
      p.x < b.minX ||
      p.x > b.maxX ||
      p.z < b.minZ ||
      p.z > b.maxZ ||
      p.y < b.minY ||
      p.y > b.maxY
    ) {
      p.x = clamp(p.x, b.minX, b.maxX);
      p.z = clamp(p.z, b.minZ, b.maxZ);
      p.y = clamp(p.y, b.minY, b.maxY);
      p.angle = Math.atan2(-p.x, -p.z);
      p.pitch = p.y <= b.minY ? 0.25 : p.y >= b.maxY ? -0.25 : 0;
      if (!this.recoveryCooldown) {
        this.emit('flight-recover');
        this.recoveryCooldown = 3;
        if (this.timed) this.remaining = Math.max(0, this.remaining - 3);
      }
    }
    for (const target of this.targets) {
      if (target.motion) {
        const m = target.motion,
          a = m.phase + this.time * m.speed;
        target.x = m.cx + Math.sin(a) * m.radius;
        target.z = m.cz + Math.cos(a) * m.radius;
        target.y =
          this.level.targets.find((t) => t.id === target.id).y +
          Math.sin(this.time * 1.4 + a) * (m.bob || 0);
      }
      if (this.collectedTargets.has(target.id)) continue;
      const hit =
        target.kind === 'arch'
          ? crossedArch(previous, p, target)
          : p.flame > 0 && flameHit(p, target);
      if (hit) {
        this.collectedTargets.add(target.id);
        if (this.timed) this.remaining += this.level.timeBonus ?? 3;
        this.emit('flight-target', {
          id: target.id,
          kind: target.kind,
          x: target.x,
          y: target.y,
          z: target.z,
        });
      }
    }
    if (this.timed) this.remaining = Math.max(0, this.remaining - dt);
    if (this.targets.length && this.collectedTargets.size === this.targets.length) {
      this.result = 'complete';
      this.emit('flight-complete', { duration: this.time, timed: this.timed });
    } else if (this.timed && this.remaining <= 0) {
      this.result = 'timeout';
      this.emit('flight-timeout');
    }
  }
}
function crossedArch(a, b, t) {
  const n = t.normal || { x: 0, y: 0, z: 1 };
  const d0 = (a.x - t.x) * n.x + (a.y - t.y) * n.y + (a.z - t.z) * n.z,
    d1 = (b.x - t.x) * n.x + (b.y - t.y) * n.y + (b.z - t.z) * n.z;
  if (d0 * d1 > 0 || Math.abs(d0 - d1) < 1e-8) return false;
  const f = d0 / (d0 - d1),
    x = a.x + (b.x - a.x) * f,
    y = a.y + (b.y - a.y) * f,
    z = a.z + (b.z - a.z) * f;
  return Math.hypot(x - t.x, y - t.y, z - t.z) <= (t.radius || 6) + 0.6;
}
function flameHit(p, t) {
  const dx = t.x - p.x,
    dy = t.y - (p.y + 0.8),
    dz = t.z - p.z,
    d = Math.hypot(dx, dy, dz);
  const forward =
    dx * Math.sin(p.angle) * Math.cos(p.pitch) +
    dy * Math.sin(p.pitch) +
    dz * Math.cos(p.angle) * Math.cos(p.pitch);
  return d < 12 + (t.radius || 1.8) && (d < 1 || forward / d > 0.65);
}
