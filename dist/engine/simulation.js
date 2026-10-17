/** Rendering-independent 60 Hz simulation. No DOM, GPU, or audio dependencies. */
import { terrainHeight, obstacleBlocks } from './terrain.js';
import { movePlayer } from './movement.js';
import { updateEnemy } from './enemy-ai.js';
export { terrainHeight } from './terrain.js';
export function validSave(raw, level) {
  const empty = { gems: [], rescues: [], enemies: [], chests: [], complete: false };
  if (!raw || raw.version !== 1) return empty;
  const clean = (v, all) =>
    Array.isArray(v)
      ? [...new Set(v.filter((id) => typeof id === 'string' && all.some((a) => a.id === id)))]
      : [];
  const gems = clean(raw.gems, level.gems),
    rescues = clean(raw.rescues, level.rescues),
    enemies = clean(raw.enemies, level.enemies),
    chests = clean(raw.chests, level.chests || []);
  return {
    gems,
    rescues,
    enemies,
    chests,
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
    this.broken = new Set(v.chests);
    this.gems = level.gems.map((g) => ({
      ...g,
      active:
        !g.source ||
        (g.source === 'chest' ? this.broken.has(g.sourceId) : this.defeated.has(g.sourceId)),
    }));
    this.rescueTimes = new Map();
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
      stride: 0,
      turnRate: 0,
      chargeBlend: 0,
      glideBlend: 0,
      landing: 0,
    };
    this.jumpGrace = 0;
    this.jumpBuffer = 0;
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
      chests: [...this.broken],
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
    this.jumpGrace = p.grounded ? 0.08 : Math.max(0, this.jumpGrace - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    p.landing *= Math.exp(-dt * 12);
    const jumpPressed = input.jumpPressed || (input.jump && !this.jumpHeld);
    if (jumpPressed) {
      if (p.grounded || this.jumpGrace > 0) this.startJump(input.jump !== false);
      else {
        const floor = terrainHeight(this.level, p.x, p.z, p.y + 0.01);
        // A late falling tap is an intended landing jump; other taps still toggle glide.
        if (!p.gliding && p.vy < 0 && floor !== null && p.y - floor < 0.5) this.jumpBuffer = 0.1;
        else {
          p.gliding = !p.gliding;
          this.emit('glide');
        }
      }
    }
    if (this.jumpHeld && !input.jump && p.vy > 6.6 && !p.gliding) p.vy = 6.6;
    this.jumpHeld = !!input.jump;
    if (input.flamePressed || (input.flame && !this.flameHeld)) {
      p.flame = 0.42;
      this.emit('flame');
    }
    this.flameHeld = !!input.flame;
    p.charging = !!input.charge && !p.gliding;
    movePlayer(p, input, dt);
    let nx = p.x + p.vx * dt,
      nz = p.z + p.vz * dt;
    for (const o of this.level.obstacles) {
      if (!obstacleBlocks(o, p.y)) continue;
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
    for (const c of this.level.chests || []) {
      if (this.broken.has(c.id) || Math.abs(p.y - c.y) > 1.2) continue;
      const dx = nx - c.x,
        dz = nz - c.z,
        d = Math.hypot(dx, dz),
        radius = 1.1;
      if (d < radius) {
        nx = c.x + (d ? dx / d : Math.sin(p.angle + Math.PI)) * radius;
        nz = c.z + (d ? dz / d : Math.cos(p.angle + Math.PI)) * radius;
      }
    }
    // Enclosed valleys opt in. Legacy terrain still supports genuine platforming.
    if (this.level.bounds) {
      const b = this.level.bounds,
        radius = 0.6;
      const cx = Math.max(b.minX + radius, Math.min(b.maxX - radius, nx));
      const cz = Math.max(b.minZ + radius, Math.min(b.maxZ - radius, nz));
      if (cx !== nx) p.vx = 0;
      if (cz !== nz) p.vz = 0;
      nx = cx;
      nz = cz;
    }
    const ceiling = p.y + (p.grounded ? 0.65 : 0.01);
    const floor = terrainHeight(this.level, nx, nz, ceiling);
    const old = terrainHeight(this.level, p.x, p.z, ceiling);
    if (p.grounded && floor !== null && old !== null && Math.abs(floor - old) < 0.65) {
      p.y = floor;
      p.vy = 0;
    } else {
      p.vy -= 24 * dt;
      if (p.gliding) p.vy = Math.max(-2.2, p.vy);
      p.y += p.vy * dt;
      if (floor !== null && p.y <= floor && p.vy <= 0) {
        p.landing = Math.min(1, Math.abs(p.vy) / 12);
        p.y = floor;
        p.vy = 0;
        p.grounded = true;
        p.gliding = false;
        if (this.jumpBuffer > 0) {
          this.startJump();
          if (!input.jump) p.vy = 6.6;
        }
      } else p.grounded = false;
    }
    p.stride += Math.hypot(nx - p.x, nz - p.z) * 1.55;
    p.chargeBlend += (+p.charging - p.chargeBlend) * (1 - Math.exp(-dt * 15));
    p.glideBlend += (+p.gliding - p.glideBlend) * (1 - Math.exp(-dt * 16));
    p.x = nx;
    p.z = nz;
    if (p.y < -12) {
      this.damage(true);
      return;
    }
    for (const c of this.level.chests || []) {
      if (this.broken.has(c.id)) continue;
      if (
        (p.charging && this.inAttackRange(c, 1.9, 2, false)) ||
        (p.flame > 0 && this.inAttackRange(c, 4.5, 2.5))
      ) {
        this.broken.add(c.id);
        this.releaseTreasure('chest', c.id, c);
        this.emit('chest', { ...c });
      }
    }
    for (const g of this.gems) {
      if (!g.active || this.collected.has(g.id)) continue;
      const distance = Math.hypot(p.x - g.x, p.z - g.z);
      if (distance < 3.4 && Math.abs(p.y + 0.7 - g.y) < 2) {
        const pull = 1 - Math.exp(-dt * 8);
        g.x += (p.x - g.x) * pull;
        g.z += (p.z - g.z) * pull;
        g.y += (p.y + 0.85 - g.y) * pull;
      }
      if (Math.hypot(p.x - g.x, p.z - g.z) < 0.65 && Math.abs(p.y + 0.7 - g.y) < 1.5) {
        this.collected.add(g.id);
        this.emit('gem', { id: g.id, x: g.x, y: g.y, z: g.z });
      }
    }
    for (const e of this.enemies) {
      if (this.defeated.has(e.id)) continue;
      const striking = updateEnemy(e, p, dt, this.level);
      const d = Math.hypot(p.x - e.x, p.z - e.z);
      if (p.charging && d < 1.8 && Math.abs(p.y - e.y) < 2) this.hitEnemy(e.id, 'charge');
      if (p.flame > 0 && this.inAttackRange(e, 4.5, 2.5)) this.hitEnemy(e.id, 'flame');
      if (
        !this.defeated.has(e.id) &&
        (e.type === 'giant' ? striking : d < 1.1 && Math.abs(p.y - e.y) < 1.6)
      )
        this.damage();
    }
    this.rescueNearby();
    if (input.interactPressed || (input.interact && !this.interactHeld)) this.interact();
    this.interactHeld = !!input.interact;
  }
  startJump(held = true) {
    const p = this.player;
    p.vy = held ? 10 : 6.6;
    p.grounded = false;
    p.gliding = false;
    this.jumpGrace = 0;
    this.jumpBuffer = 0;
    this.emit('jump');
  }
  inAttackRange(target, range, height, directional = true) {
    const p = this.player,
      dx = target.x - p.x,
      dz = target.z - p.z,
      d = Math.hypot(dx, dz);
    return (
      d < range &&
      Math.abs(p.y - target.y) < height &&
      (!directional || d < 0.5 || (dx * Math.sin(p.angle) + dz * Math.cos(p.angle)) / d > 0.55)
    );
  }
  releaseTreasure(source, sourceId, position) {
    for (const [i, g] of this.gems.entries())
      if (g.source === source && g.sourceId === sourceId) {
        g.active = true;
        g.x = position.x + (i % 2 ? 0.25 : -0.25);
        g.z = position.z;
        g.y = position.y + 0.8;
        if (source === 'enemy') g.x = position.x;
      }
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
    this.releaseTreasure('enemy', id, e);
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
      Object.assign(p, this.checkpoint, {
        vy: 0,
        vx: 0,
        vz: 0,
        grounded: true,
        gliding: false,
        turnRate: 0,
        chargeBlend: 0,
        glideBlend: 0,
        landing: 0,
      });
      this.jumpGrace = 0;
      this.jumpBuffer = 0;
      this.emit('respawn');
    }
  }
  rescueNearby() {
    const p = this.player;
    for (const r of this.level.rescues)
      if (
        !this.rescued.has(r.id) &&
        Math.hypot(p.x - r.x, p.z - r.z) < 3 &&
        Math.abs(p.y - r.y) < 2
      ) {
        this.rescued.add(r.id);
        this.rescueTimes.set(r.id, this.time);
        this.checkpoint = { x: r.x, z: r.z + 2, y: r.y };
        p.health = 3;
        const event = { type: 'rescue', ...r };
        this.events.push(event);
        return event;
      }
    return null;
  }
  interact() {
    const rescue = this.rescueNearby();
    if (rescue) return rescue;
    const p = this.player;
    const g = (this.level.portals || [this.level.portal]).find(
      (g) => Math.hypot(p.x - g.x, p.z - g.z) < 4 && Math.abs(p.y - g.y) < 2,
    );
    if (!g) return null;
    if (Math.hypot(p.x - g.x, p.z - g.z) < 4 && Math.abs(p.y - g.y) < 2) {
      if (g.destination) {
        const event = { type: 'travel', destination: g.destination };
        this.events.push(event);
        return event;
      }
      const event = { type: this.unlocked ? 'complete' : 'locked' };
      if (this.unlocked) this.complete = true;
      this.events.push(event);
      return event;
    }
    return null;
  }
  nearestInteraction() {
    const p = this.player;
    const g = (this.level.portals || [this.level.portal]).find(
      (g) => Math.hypot(p.x - g.x, p.z - g.z) < 4 && Math.abs(p.y - g.y) < 2,
    );
    return g
      ? {
          name: g.destination ? g.name : this.unlocked ? 'Journey home' : 'Sunstone portal',
          portal: true,
          destination: g.destination,
        }
      : null;
  }
}
