import test from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../dist/engine/input.js';
import { ChaseCamera } from '../dist/engine/chase-camera.js';
import { Simulation } from '../dist/engine/simulation.js';
import { LEVEL } from '../dist/game/level.js';
class Element {
  constructor(action) {
    this.dataset = { action };
    this.style = {};
    this.handlers = new Map();
    this.tagName = 'DIV';
    const set = new Set();
    this.classList = {
      add: (x) => set.add(x),
      remove: (x) => set.delete(x),
      contains: (x) => set.has(x),
    };
  }
  addEventListener(name, callback) {
    if (!this.handlers.has(name)) this.handlers.set(name, []);
    this.handlers.get(name).push(callback);
  }
  emit(name, data = {}) {
    for (const fn of this.handlers.get(name) || [])
      fn({ target: this, preventDefault() {}, ...data });
  }
  setPointerCapture() {}
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 100, height: 100 };
  }
}
function setup() {
  const canvas = new Element(),
    joy = new Element(),
    thumb = new Element(),
    buttons = ['jump', 'flame', 'charge', 'interact', 'recenter'].map((x) => new Element(x));
  globalThis.window = new Element();
  globalThis.document = new Element();
  document.querySelector = (x) => (x === '#joystick' ? joy : thumb);
  document.querySelectorAll = (x) =>
    x === '[data-action]' ? buttons : buttons.filter((b) => b.classList.contains('pressed'));
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { getGamepads: () => [] },
  });
  return { input: new Input(canvas), buttons, joy };
}
test('short touch taps are queued until consumed exactly once', () => {
  for (const action of ['jump', 'flame', 'interact']) {
    const { input, buttons } = setup(),
      button = buttons.find((b) => b.dataset.action === action);
    button.emit('pointerdown', { pointerId: 1 });
    button.emit('pointerup', { pointerId: 1 });
    assert.equal(input.sample(0)[action + 'Pressed'], true);
    assert.equal(input.sample(0)[action + 'Pressed'], false);
  }
});
test('releasing one pointer preserves another pointer holding charge', () => {
  const { input, buttons } = setup(),
    button = buttons[2];
  button.emit('pointerdown', { pointerId: 1 });
  button.emit('pointerdown', { pointerId: 2 });
  button.emit('pointerup', { pointerId: 1 });
  assert.equal(input.sample(0).charge, true);
  button.emit('pointerup', { pointerId: 2 });
  assert.equal(input.sample(0).charge, false);
});
test('short keyboard jump presses are buffered', () => {
  const { input } = setup();
  window.emit('keydown', { code: 'Space', target: { tagName: 'BODY' } });
  window.emit('keyup', { code: 'Space' });
  assert.equal(input.sample(0).jumpPressed, true);
  assert.equal(input.sample(0).jumpPressed, false);
});
test('focus loss clears joystick, keys, pending taps and held pointers', () => {
  const { input, buttons, joy } = setup();
  joy.emit('pointerdown', { pointerId: 1, clientX: 50, clientY: 50 });
  joy.emit('pointermove', { pointerId: 1, clientX: 90, clientY: 50 });
  buttons[2].emit('pointerdown', { pointerId: 2 });
  buttons[0].emit('pointerdown', { pointerId: 3 });
  window.emit('blur');
  const s = input.sample(0);
  assert.equal(s.x, 0);
  assert.equal(s.charge, false);
  assert.equal(s.jumpPressed, false);
});
test('blocked gamepad policy leaves keyboard and touch playable', () => {
  const { input } = setup();
  navigator.getGamepads = () => {
    throw new Error('SecurityError');
  };
  assert.doesNotThrow(() => input.sample(0));
});
test('holding right keeps a steady camera and follows a straight heading', () => {
  const { input } = setup(),
    camera = new ChaseCamera();
  const sim = new Simulation({
    ...LEVEL,
    islands: [{ x: 0, z: 0, y: 0, r: 200 }],
    obstacles: [],
    enemies: [],
    rescues: [],
  });
  input.keys.add('KeyD');
  for (let i = 0; i < 360; i++) {
    sim.update(1 / 60, input.sample(camera.angle));
    camera.update(1 / 60, sim.player);
  }
  assert.ok(sim.player.x > 40);
  assert.ok(Math.abs(sim.player.z - 10) < 0.6);
  input.keys.clear();
  input.sample(camera.angle);
  input.keys.add('KeyW');
  const next = input.sample(camera.angle);
  assert.ok(next.z < -0.9, 'new gesture must use the visible camera direction');
});
test('a released and restarted movement gesture uses the new view between samples', () => {
  const { input, joy } = setup();
  window.emit('keydown', { code: 'KeyD' });
  input.sample(0);
  window.emit('keyup', { code: 'KeyD' });
  window.emit('keydown', { code: 'KeyW' });
  assert.ok(input.sample(-Math.PI / 2).x > 0.9);
  input.clear();
  joy.emit('pointerdown', { pointerId: 1, clientX: 50, clientY: 50 });
  joy.emit('pointermove', { pointerId: 1, clientX: 90, clientY: 50 });
  input.sample(0);
  joy.emit('pointerup', { pointerId: 1 });
  joy.emit('pointerdown', { pointerId: 2, clientX: 50, clientY: 50 });
  joy.emit('pointermove', { pointerId: 2, clientX: 50, clientY: 10 });
  assert.ok(input.sample(-Math.PI / 2).x > 0.9);
});

test('changing direction during one thumb gesture follows the current visible camera', () => {
  const { input, joy } = setup();
  joy.emit('pointerdown', { pointerId: 1, clientX: 50, clientY: 50 });
  joy.emit('pointermove', { pointerId: 1, clientX: 90, clientY: 50 });
  input.sample(0);
  joy.emit('pointermove', { pointerId: 1, clientX: 50, clientY: 10 });
  const next = input.sample(-Math.PI / 2);
  assert.ok(next.x > 0.95 && Math.abs(next.z) < 0.01);
});
test('touch starts neutral wherever the thumb lands and small jitter stays still', () => {
  const { input, joy } = setup();
  joy.emit('pointerdown', { pointerId: 1, clientX: 72, clientY: 59 });
  assert.equal(Math.hypot(input.sample(0).x, input.sample(0).z), 0);
  joy.emit('pointermove', { pointerId: 1, clientX: 74, clientY: 60 });
  assert.equal(Math.hypot(input.sample(0).x, input.sample(0).z), 0);
  joy.emit('pointermove', { pointerId: 1, clientX: 84, clientY: 59 });
  const walking = input.sample(0);
  assert.ok(walking.x > 0 && walking.x < 0.3);
});
test('the second finger cannot take ownership of an active joystick', () => {
  const { input, joy } = setup();
  joy.emit('pointerdown', { pointerId: 1, clientX: 50, clientY: 50 });
  joy.emit('pointermove', { pointerId: 1, clientX: 90, clientY: 50 });
  joy.emit('pointerdown', { pointerId: 2, clientX: 50, clientY: 50 });
  assert.ok(input.sample(0).x > 0.9);
  joy.emit('pointerup', { pointerId: 1 });
  assert.equal(input.sample(0).x, 0);
});
test('analogue gamepad response has the same radial precision in every direction', () => {
  const { input } = setup();
  const pad = { connected: true, axes: [0.2, 0, 0, 0], buttons: [] };
  navigator.getGamepads = () => [pad];
  const cardinal = input.sample(0);
  pad.axes = [Math.SQRT1_2 * 0.2, Math.SQRT1_2 * 0.2, 0, 0];
  const diagonal = input.sample(0);
  assert.ok(Math.hypot(diagonal.x, diagonal.z) > 0);
  assert.ok(
    Math.abs(Math.hypot(cardinal.x, cardinal.z) - Math.hypot(diagonal.x, diagonal.z)) < 0.001,
  );
});
test('PlayStation face buttons use square charge and circle flame', () => {
  const { input } = setup(),
    buttons = Array.from({ length: 12 }, () => ({ pressed: false }));
  navigator.getGamepads = () => [{ connected: true, axes: [0, 0, 0, 0], buttons }];
  buttons[2].pressed = true;
  assert.equal(input.sample(0).charge, true);
  buttons[2].pressed = false;
  buttons[1].pressed = true;
  assert.equal(input.sample(0).flame, true);
});

test('camera recenter works with keyboard, touch and gamepad R3 without repeating', () => {
  const { input, buttons } = setup();
  window.emit('keydown', { code: 'KeyC' });
  assert.equal(input.recenter, true);
  input.recenter = false;
  window.emit('keydown', { code: 'KeyC', repeat: true });
  assert.equal(input.recenter, false);
  buttons[4].emit('pointerdown', { pointerId: 7 });
  assert.equal(input.recenter, true);
  input.recenter = false;
  buttons[4].emit('click', { detail: 0 });
  assert.equal(input.recenter, true);
  input.recenter = false;
  const pad = {
    connected: true,
    axes: [0, 0, 0],
    buttons: Array.from({ length: 12 }, () => ({ pressed: false })),
  };
  navigator.getGamepads = () => [pad];
  pad.buttons[11].pressed = true;
  input.sample(0);
  assert.equal(input.recenter, true);
  input.recenter = false;
  input.sample(0);
  assert.equal(input.recenter, false);
  input.clear();
  assert.equal(input.orbit, 0);
});
