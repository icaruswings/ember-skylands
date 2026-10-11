import test from 'node:test';
import assert from 'node:assert/strict';
import { enterFullscreen, protectGameGestures } from '../dist/engine/display.js';

test('fullscreen requests the game surface and hides browser navigation', async () => {
  let requested;
  const stage = {
    requestFullscreen: (options) => {
      requested = options;
    },
  };
  assert.equal(await enterFullscreen(stage, {}), true);
  assert.deepEqual(requested, { navigationUI: 'hide' });
});

test('unsupported or rejected fullscreen leaves viewport play available', async () => {
  assert.equal(await enterFullscreen({}, {}), false);
  assert.equal(
    await enterFullscreen({ requestFullscreen: () => Promise.reject(new Error('denied')) }, {}),
    false,
  );
  assert.equal(
    await enterFullscreen(
      {
        requestFullscreen: () => {
          throw new Error('must not request twice');
        },
      },
      { fullscreenElement: {} },
    ),
    false,
  );
});

test('game gestures cancel selection, dragging and context menus', () => {
  const stage = new EventTarget();
  protectGameGestures(stage);
  for (const type of ['selectstart', 'dragstart', 'contextmenu']) {
    assert.equal(stage.dispatchEvent(new Event(type, { cancelable: true })), false);
  }
  assert.equal(stage.dispatchEvent(new Event('pointerdown', { cancelable: true })), true);
});
