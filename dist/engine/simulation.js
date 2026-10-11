/** Rendering-independent 60 Hz simulation. No DOM, GPU, or audio dependencies. */
export function terrainHeight(level, x, z) {
  let height = null;
  for (const p of level.islands)
    if (Math.hypot(x - p.x, z - p.z) <= p.r) height = Math.max(height ?? -Infinity, p.y);
  for (const b of level.bridges) {
    const dx = b.bx - b.ax,
      dz = b.bz - b.az,
      t = ((x - b.ax) * dx + (z - b.az) * dz) / (dx * dx + dz * dz);
    if (t >= 0 && t <= 1 && Math.hypot(x - b.ax - t * dx, z - b.az - t * dz) < b.width / 2)
      height = Math.max(height ?? -Infinity, b.ay + t * (b.by - b.ay));
  }
  return height;
}
export function validSave(raw, level) {
  const empty = { gems: [], rescues: [], enemies: [], complete: false };
  if (!raw || raw.version !== 1) return empty;
  const clean = (v, all) =>
    Array.isArray(v)
      ? [...new Set(v.filter((id) => typeof id === 'string' && all.some((a) => a.id === id)))]
      : [];
  const gems = clean(raw.gems, level.gems),
    rescues = clean(raw.rescues, level.rescues),
    enemies = clean(raw.enemies, level.enemies);
  return {
    gems,
    rescues,
    enemies,
    complete:
      raw.complete === true &&
      gems.length >= level.goal.gems &&
      rescues.length >= level.goal.rescues,
  };
}
export class FixedClock {
  constructor() {
    this.accumulator = 0;
    this.step = 1 / 60;
  }
  advance(delta, update) {
    this.accumulator += Math.min(Math.max(delta, 0), 0.125);
    let steps = 0;
    while (this.accumulator >= this.step && steps < 8) {
      update(this.step);
      this.accumulator -= this.step;
      steps++;
    }
    return steps;
  }
  reset() {
    this.accumulator = 0;
  }
}
export class ScriptSystem {
  constructor(scripts) {
    this.scripts = scripts;
    this.fired = new Set();
  }
  update(state) {
    for (const s of this.scripts)
      if (!this.fired.has(s.id) && s.when(state)) {
        this.fired.add(s.id);
        s.run(state);
      }
  }
}
export class Simulation {
  constructor(level, saved) {
    this.level = level;
    const v = validSave(saved, level);
    this.collected = new Set(v.gems);
    this.rescued = new Set(v.rescues);
    this.defeated = new Set(v.enemies);
    this.complete = v.complete;
    this.events = [];
    this.time = 0;
    this.checkpoint = { ...level.spawn };
    this.player = {
      ...level.spawn,
      vx: 0,
      vz: 0,
      vy: 0,
      angle: Math.PI,
      grounded: true,
      gliding: false,
      charging: false,
      health: 3,
      invincible: 0,
      flame: 0,
    };
    this.jumpHeld = false;
    this.flameHeld = false;
    this.interactHeld = false;
    this.enemies = level.enemies.map((e) => ({ ...e, homeX: e.x, homeZ: e.z, phase: 0 }));
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  drain() {
    return this.events.splice(0);
  }
  save() {
    return {
      version: 1,
      gems: [...this.collected],
      rescues: [...this.rescued],
      enemies: [...this.defeated],
      complete: this.complete,
    };
  }
  get unlocked() {
    return (
      this.collected.size >= this.level.goal.gems && this.rescued.size >= this.level.goal.rescues
    );
  }
  update(dt, input = {}) {
    this.time += dt;
    const p = this.player;
    p.invincible = Math.max(0, p.invincible - dt);
    p.flame = Math.max(0, p.flame - dt);
    if (input.jumpPressed || (input.jump && !this.jumpHeld)) {
      if (p.grounded) {
        p.vy = 10;
        p.grounded = false;
        this.emit('jump');
      } else {
        p.gliding = !p.gliding;
        this.emit('glide');
      }
    }
    this.jumpHeld = !!input.jump;
    if (input.flamePressed || (input.flame && !this.flameHeld)) {
      p.flame = 0.42;
      this.emit('flame');
    }
    this.flameHeld = !!input.flame;
    p.charging = !!input.charge && !p.gliding;
    const speed = p.charging ? 15 : p.gliding ? 9 : 7;
    let x = input.x || 0,
      z = input.z || 0;
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    if (p.gliding && length < 0.08) {
      x = Math.sin(p.angle);
      z = Math.cos(p.angle);
    }
    if (length > 0.08) p.angle = Math.atan2(x, z);
    p.vx = x * speed;
    p.vz = z * speed;
    let nx = p.x + p.vx * dt,
      nz = p.z + p.vz * dt;
    for (const o of this.level.obstacles) {
      if (p.y > 3) continue;
      if (o.r) {
        const d = Math.hypot(nx - o.x, nz - o.z),
          r = o.r + 0.55;
        if (d < r && d > 0) {
          nx = o.x + ((nx - o.x) / d) * r;
          nz = o.z + ((nz - o.z) / d) * r;
        }
      } else {
        const hx = o.halfX + 0.55,
          hz = o.halfZ + 0.55,
          dx = nx - o.x,
          dz = nz - o.z;
        if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
          if (hx - Math.abs(dx) < hz - Math.abs(dz)) nx = o.x + Math.sign(dx || 1) * hx;
          else nz = o.z + Math.sign(dz || 1) * hz;
        }
      }
    }
    const floor = terrainHeight(this.level, nx, nz);
    const old = terrainHeight(this.level, p.x, p.z);
    if (p.grounded && floor !== null && old !== null && floor - old < 0.65) {
      p.y = floor;
      p.vy = 0;
    } else {
      p.vy -= 24 * dt;
      if (p.gliding) p.vy = Math.max(-2.2, p.vy);
      p.y += p.vy * dt;
      if (floor !== null && p.y <= floor && p.vy <= 0) {
        p.y = floor;
        p.vy = 0;
        p.grounded = true;
        p.gliding = false;
      } else p.grounded = false;
    }
    p.x = nx;
    p.z = nz;
    if (p.y < -12) {
      this.damage(true);
      return;
    }
    for (const g of this.level.gems)
      if (
        !this.collected.has(g.id) &&
        Math.hypot(p.x - g.x, p.z - g.z) < 1.35 &&
        Math.abs(p.y + 0.7 - g.y) < 2
      ) {
        this.collected.add(g.id);
        this.emit('gem', { id: g.id, x: g.x, y: g.y, z: g.z });
      }
    for (const e of this.enemies) {
      if (this.defeated.has(e.id)) continue;
      e.phase += dt;
      const distance = Math.hypot(p.x - e.x, p.z - e.z);
      if (distance < 7 && Math.abs(p.y - e.y) < 2) {
        const chase = e.type === 'giant' ? 1.2 : 1.8;
        if (distance > 1.2) {
          e.x += ((p.x - e.x) / distance) * dt * chase;
          e.z += ((p.z - e.z) / distance) * dt * chase;
        }
      } else {
        e.x = e.homeX + Math.sin(e.phase) * 1.1;
        e.z = e.homeZ + Math.cos(e.phase) * 0.8;
      }
      const d = Math.hypot(p.x - e.x, p.z - e.z),
        ahead = (e.x - p.x) * Math.sin(p.angle) + (e.z - p.z) * Math.cos(p.angle);
      if (p.charging && d < 1.8 && Math.abs(p.y - e.y) < 2) this.hitEnemy(e.id, 'charge');
      if (p.flame > 0 && d < 4.5 && ahead > -0.3 && Math.abs(p.y - e.y) < 2.5)
        this.hitEnemy(e.id, 'flame');
      if (!this.defeated.has(e.id) && d < 1.1 && Math.abs(p.y - e.y) < 1.6) this.damage();
    }
    if (input.interactPressed || (input.interact && !this.interactHeld)) this.interact();
    this.interactHeld = !!input.interact;
  }
  hitEnemy(id, attack) {
    const e = this.enemies.find((e) => e.id === id);
    if (
      !e ||
      this.defeated.has(id) ||
      (e.type === 'armor' && attack !== 'charge') ||
      (e.type === 'giant' && attack !== 'flame')
    )
      return false;
    this.defeated.add(id);
    this.emit('enemy', { id, x: e.x, y: e.y + 1, z: e.z });
    return true;
  }
  damage(fall = false) {
    const p = this.player;
    if (p.invincible > 0 && !fall) return;
    p.health--;
    p.invincible = 2;
    this.emit('damage');
    if (p.health <= 0 || fall) {
      if (p.health <= 0) p.health = 3;
      Object.assign(p, this.checkpoint, { vy: 0, vx: 0, vz: 0, grounded: true, gliding: false });
      this.emit('respawn');
    }
  }
  interact() {
    const p = this.player;
    for (const r of this.level.rescues)
      if (
        !this.rescued.has(r.id) &&
        Math.hypot(p.x - r.x, p.z - r.z) < 3 &&
        Math.abs(p.y - r.y) < 2
      ) {
        this.rescued.add(r.id);
        this.checkpoint = { x: r.x, z: r.z + 2, y: r.y };
        p.health = 3;
        const event = { type: 'rescue', ...r };
        this.events.push(event);
        return event;
      }
    const g = this.level.portal;
    if (Math.hypot(p.x - g.x, p.z - g.z) < 4 && Math.abs(p.y - g.y) < 2) {
      const event = { type: this.unlocked ? 'complete' : 'locked' };
      if (this.unlocked) this.complete = true;
      this.events.push(event);
      return event;
    }
    return null;
  }
  nearestInteraction() {
    const p = this.player;
    return (
      this.level.rescues.find(
        (r) =>
          !this.rescued.has(r.id) &&
          Math.hypot(p.x - r.x, p.z - r.z) < 3 &&
          Math.abs(p.y - r.y) < 2,
      ) ||
      (Math.hypot(p.x - this.level.portal.x, p.z - this.level.portal.z) < 4
        ? { name: this.unlocked ? 'Journey home' : 'Sunstone portal', portal: true }
        : null)
    );
  }
}
