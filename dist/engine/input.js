import { bindHold } from './hold-control.js';

/** Radial response preserves diagonal precision and leaves room for walking. */
export function shapeStick(x, z, deadzone = 0.12) {
  const length = Math.hypot(x, z);
  if (length <= deadzone) return { x: 0, z: 0 };
  const magnitude = ((Math.min(length, 1) - deadzone) / (1 - deadzone)) ** 1.45;
  return { x: (x / length) * magnitude, z: (z / length) * magnitude };
}

/** Keyboard, pointer and standard gamepad controls share one action state. */
export class Input {
  constructor(canvas) {
    this.cancelHolds = [];
    this.keys = new Set();
    this.touch = { x: 0, z: 0 };
    this.buttons = new Set();
    this.pulses = new Map();
    this.pointers = new Map();
    this.orbit = 0;
    this.drag = null;
    this.lookEnabled = false;
    this.recenter = false;
    this.padRecenterHeld = false;
    const prevent = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    window.addEventListener('keydown', (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (prevent.has(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat) {
        if (e.code === 'KeyC') this.recenter = true;
        const action = { Space: 'jump', KeyF: 'flame', KeyE: 'interact' }[e.code];
        if (action) this.pulses.set(action, (this.pulses.get(action) || 0) + 1);
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    for (const event of ['blur', 'pagehide', 'resize', 'orientationchange'])
      window.addEventListener(event, () => this.clear());
    document.addEventListener('fullscreenchange', () => this.clear());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.clear();
    });
    this.cancelHolds.push(
      bindHold(canvas, {
        start: (e) => {
          if (!this.lookEnabled || this.drag) return false;
          this.drag = { id: e.pointerId, x: e.clientX };
        },
        move: (e) => {
          if (this.drag?.id !== e.pointerId) return;
          this.orbit -= (e.clientX - this.drag.x) * 0.006;
          this.drag.x = e.clientX;
        },
        end: (e) => {
          if (this.drag?.id === e.pointerId) this.drag = null;
        },
      }),
    );
    const joy = document.querySelector('#joystick'),
      thumb = document.querySelector('#thumb');
    let joyId = null,
      anchor = null;
    this.releaseJoystick = () => {
      joyId = null;
      anchor = null;
    };
    const update = (e) => {
      const r = joy.getBoundingClientRect(),
        dx = e.clientX - anchor.x,
        dy = e.clientY - anchor.y,
        len = Math.hypot(dx, dy),
        max = r.width * 0.36,
        scale = len > max ? max / len : 1;
      this.touch = shapeStick(dx / max, dy / max);
      thumb.style.transform = `translate(${anchor.x - r.left - r.width / 2 + dx * scale}px,${anchor.y - r.top - r.height / 2 + dy * scale}px)`;
    };
    this.cancelHolds.push(
      bindHold(joy, {
        start: (e) => {
          if (joyId !== null) return false;
          joyId = e.pointerId;
          anchor = { x: e.clientX, y: e.clientY };
          update(e);
        },
        move: (e) => {
          if (e.pointerId === joyId) update(e);
        },
        end: (e) => {
          if (e.pointerId !== joyId) return;
          this.releaseJoystick();
          this.touch = { x: 0, z: 0 };
          thumb.style.transform = 'translate(0,0)';
        },
      }),
    );
    for (const b of document.querySelectorAll('[data-action]')) {
      const action = b.dataset.action,
        active = new Set();
      this.pointers.set(action, active);
      const down = (e) => {
        active.add(e.pointerId);
        this.buttons.add(action);
        if (action === 'recenter') this.recenter = true;
        else if (action !== 'charge') this.pulses.set(action, (this.pulses.get(action) || 0) + 1);
        b.classList.add('pressed');
      };
      const up = (e) => {
        active.delete(e.pointerId);
        if (active.size === 0) {
          this.buttons.delete(action);
          b.classList.remove('pressed');
        }
      };
      this.cancelHolds.push(bindHold(b, { start: down, end: up }));
      if (action === 'recenter')
        b.addEventListener('click', (e) => {
          if (e.detail === 0) this.recenter = true;
        });
    }
  }
  clear() {
    for (const cancel of this.cancelHolds) cancel();
    this.recenter = false;
    this.orbit = 0;
    this.releaseJoystick();
    this.keys.clear();
    this.buttons.clear();
    this.pulses.clear();
    for (const active of this.pointers.values()) active.clear();
    this.touch = { x: 0, z: 0 };
    this.drag = null;
    document.querySelector('#thumb').style.transform = 'translate(0,0)';
    document.querySelectorAll('.pressed').forEach((e) => e.classList.remove('pressed'));
  }
  sample(cameraAngle) {
    let x =
        +(this.keys.has('KeyD') || this.keys.has('ArrowRight')) -
        +(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) +
        this.touch.x,
      z =
        +(this.keys.has('KeyS') || this.keys.has('ArrowDown')) -
        +(this.keys.has('KeyW') || this.keys.has('ArrowUp')) +
        this.touch.z;
    let pad = null;
    try {
      pad = Array.from(navigator.getGamepads?.() || []).find((p) => p?.connected);
    } catch {}
    if (pad) {
      const stick = shapeStick(pad.axes[0] || 0, pad.axes[1] || 0, 0.14);
      x += stick.x;
      z += stick.z;
      this.orbit -= Math.abs(pad.axes[2]) > 0.15 ? pad.axes[2] * 0.04 : 0;
    }
    const recenterHeld = !!pad?.buttons[11]?.pressed;
    if (recenterHeld && !this.padRecenterHeld) this.recenter = true;
    this.padRecenterHeld = recenterHeld;
    this.orbit += (+!!pad?.buttons[6]?.pressed - +!!pad?.buttons[7]?.pressed) * 0.035;
    const pressed = {};
    for (const action of ['jump', 'flame', 'interact']) {
      const count = this.pulses.get(action) || 0;
      pressed[action + 'Pressed'] = count > 0;
      if (count > 0) this.pulses.set(action, count - 1);
    }
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    const cos = Math.cos(cameraAngle),
      sin = Math.sin(cameraAngle);
    return {
      ...pressed,
      viewX: x,
      viewZ: z,
      x: x * cos + z * sin,
      z: z * cos - x * sin,
      jump: this.keys.has('Space') || this.buttons.has('jump') || !!pad?.buttons[0]?.pressed,
      flame: this.keys.has('KeyF') || this.buttons.has('flame') || !!pad?.buttons[1]?.pressed,
      charge:
        this.keys.has('ShiftLeft') ||
        this.keys.has('ShiftRight') ||
        this.buttons.has('charge') ||
        !!pad?.buttons[2]?.pressed,
      interact: this.keys.has('KeyE') || this.buttons.has('interact') || !!pad?.buttons[3]?.pressed,
    };
  }
}
