import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readSave,
  writeSave,
  clearSave,
  readSettings,
  writeSettings,
} from '../dist/engine/storage.js';
test('browser save roundtrip and clear preserve unrelated settings', () => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
  const value = { version: 1, gems: ['gem-0'] };
  assert.equal(writeSave(value), true);
  assert.deepEqual(readSave(), value);
  writeSettings({ quality: 'low' });
  clearSave();
  assert.equal(readSave(), null);
  assert.deepEqual(readSettings(), { quality: 'low' });
});
test('corrupted JSON is ignored', () => {
  globalThis.localStorage = { getItem: () => '{bad' };
  assert.equal(readSave(), null);
  assert.deepEqual(readSettings(), {});
});
test('disabled browser storage does not crash playing', () => {
  globalThis.localStorage = {
    getItem: () => {
      throw new Error('disabled');
    },
    setItem: () => {
      throw new Error('quota');
    },
    removeItem: () => {
      throw new Error('disabled');
    },
  };
  assert.equal(readSave(), null);
  assert.equal(writeSave({}), false);
  assert.doesNotThrow(clearSave);
  assert.doesNotThrow(() => writeSettings({}));
});
