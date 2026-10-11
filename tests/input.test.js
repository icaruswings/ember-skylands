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
    buttons = ['jump', 'flame', 'charge', 'interact'].map((x) => new Element(x));
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
  joy.emit('pointerdown', { pointerId: 1, clientX: 90, clientY: 50 });
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
test('holding right follows a straight heading as the chase camera turns', () => {
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
  assert.ok(Math.abs(sim.player.z - 10) < 0.01);
  input.keys.clear();
  input.sample(camera.angle);
  input.keys.add('KeyW');
  const next = input.sample(camera.angle);
  assert.ok(next.x > 0.9, 'new gesture must use the new camera direction');
});
test('a released and restarted movement gesture uses the new view between samples', () => {
  const { input, joy } = setup();
  window.emit('keydown', { code: 'KeyD' });
  input.sample(0);
  window.emit('keyup', { code: 'KeyD' });
  window.emit('keydown', { code: 'KeyW' });
  assert.ok(input.sample(-Math.PI / 2).x > 0.9);
  input.clear();
  joy.emit('pointerdown', { pointerId: 1, clientX: 90, clientY: 50 });
  input.sample(0);
  joy.emit('pointerup', { pointerId: 1 });
  joy.emit('pointerdown', { pointerId: 2, clientX: 50, clientY: 10 });
  assert.ok(input.sample(-Math.PI / 2).x > 0.9);
});
