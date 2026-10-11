/** Keyboard, pointer and standard gamepad controls share one action state. */
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.touch = { x: 0, z: 0 };
    this.buttons = new Set();
    this.pulses = new Map();
    this.pointers = new Map();
    this.orbit = 0;
    this.drag = null;
    this.lookEnabled = false;
    this.movementBasis = null;
    const prevent = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    window.addEventListener('keydown', (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (prevent.has(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat) {
        const action = { Space: 'jump', KeyF: 'flame', KeyE: 'interact' }[e.code];
        if (action) this.pulses.set(action, (this.pulses.get(action) || 0) + 1);
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if(this.movementNeutral())this.movementBasis=null;
    });
    window.addEventListener('blur', () => this.clear());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.clear();
    });
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.lookEnabled) return;
      this.drag = { id: e.pointerId, x: e.clientX };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (this.drag?.id === e.pointerId) {
        this.orbit -= (e.clientX - this.drag.x) * 0.006;
        this.drag.x = e.clientX;
      }
    });
    const end = (e) => {
      if (this.drag?.id === e.pointerId) this.drag = null;
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    const joy = document.querySelector('#joystick'),
      thumb = document.querySelector('#thumb');
    let joyId = null;
    const update = (e) => {
      const r = joy.getBoundingClientRect(),
        dx = e.clientX - r.left - r.width / 2,
        dy = e.clientY - r.top - r.height / 2,
        len = Math.hypot(dx, dy),
        max = r.width * 0.3,
        scale = len > max ? max / len : 1;
      this.touch = { x: (dx * scale) / max, z: (dy * scale) / max };
      thumb.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
    };
    joy.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      joyId = e.pointerId;
      joy.setPointerCapture(joyId);
      update(e);
    });
    joy.addEventListener('pointermove', (e) => {
      if (e.pointerId === joyId) update(e);
    });
    const release = (e) => {
      if (e.pointerId === joyId) {
        joyId = null;
        this.touch = { x: 0, z: 0 };
        if(this.movementNeutral())this.movementBasis=null;
        thumb.style.transform = 'translate(0,0)';
      }
    };
    joy.addEventListener('pointerup', release);
    joy.addEventListener('pointercancel', release);
    joy.addEventListener('lostpointercapture', release);
    for (const b of document.querySelectorAll('[data-action]')) {
      const action = b.dataset.action,
        active = new Set();
      this.pointers.set(action, active);
      const down = (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        active.add(e.pointerId);
        this.buttons.add(action);
        if (action !== 'charge') this.pulses.set(action, (this.pulses.get(action) || 0) + 1);
        b.classList.add('pressed');
      };
      const up = (e) => {
        active.delete(e.pointerId);
        if (active.size === 0) {
          this.buttons.delete(action);
          b.classList.remove('pressed');
        }
      };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('lostpointercapture', up);
    }
  }
  clear() {
    this.movementBasis = null;
    this.keys.clear();
    this.buttons.clear();
    this.pulses.clear();
    for (const active of this.pointers.values()) active.clear();
    this.touch = { x: 0, z: 0 };
    this.drag = null;
    document.querySelector('#thumb').style.transform = 'translate(0,0)';
    document.querySelectorAll('.pressed').forEach((e) => e.classList.remove('pressed'));
  }
  movementNeutral() {
    return Math.hypot(this.touch.x,this.touch.z)<.08 &&
      !['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].some(k=>this.keys.has(k));
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
      x += Math.abs(pad.axes[0]) > 0.15 ? pad.axes[0] : 0;
      z += Math.abs(pad.axes[1]) > 0.15 ? pad.axes[1] : 0;
      this.orbit -= Math.abs(pad.axes[2]) > 0.15 ? pad.axes[2] * 0.04 : 0;
    }
    const pressed = {};
    for (const action of ['jump', 'flame', 'interact']) {
      const count = this.pulses.get(action) || 0;
      pressed[action + 'Pressed'] = count > 0;
      if (count > 0) this.pulses.set(action, count - 1);
    }
    // Latch the view basis for a continuous movement gesture. Automatic camera
    // following must not rotate that same held direction into an endless circle.
    if (Math.hypot(x, z) <= 0.08) this.movementBasis = null;
    else if (this.movementBasis === null) this.movementBasis = cameraAngle;
    const basis = this.movementBasis ?? cameraAngle,
      cos = Math.cos(basis),
      sin = Math.sin(basis);
    return {
      ...pressed,
      x: x * cos + z * sin,
      z: z * cos - x * sin,
      jump: this.keys.has('Space') || this.buttons.has('jump') || !!pad?.buttons[0]?.pressed,
      flame: this.keys.has('KeyF') || this.buttons.has('flame') || !!pad?.buttons[2]?.pressed,
      charge:
        this.keys.has('ShiftLeft') ||
        this.keys.has('ShiftRight') ||
        this.buttons.has('charge') ||
        !!pad?.buttons[1]?.pressed,
      interact: this.keys.has('KeyE') || this.buttons.has('interact') || !!pad?.buttons[3]?.pressed,
    };
  }
}
