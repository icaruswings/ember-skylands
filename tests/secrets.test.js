import test from 'node:test';
import assert from 'node:assert/strict';
import { LANDS } from '../dist/game/lands.js';
import { Simulation, validSave } from '../dist/engine/simulation.js';
import { Campaign } from '../dist/engine/campaign.js';

test('entering an optional pocket discovers it once, with no main-quest reward requirement', () => {
  for (const land of LANDS) {
    const s = new Simulation(land),
      secret = land.secrets[0];
    Object.assign(s.player, { x: secret.x, y: secret.y, z: secret.z });
    s.update(1 / 60);
    assert.equal(s.drain().filter((e) => e.type === 'secret' && e.id === secret.id).length, 1);
    assert.ok(s.discovered.has(secret.id));
    s.update(1 / 60);
    assert.equal(s.drain().filter((e) => e.type === 'secret').length, 0);
    assert.equal(s.unlocked, false);
  }
});

test('flying above a pocket does not reveal it before entering at ground height', () => {
  const land = LANDS[0],
    s = new Simulation(land),
    secret = land.secrets[0];
  Object.assign(s.player, { x: secret.x, y: secret.y + 10, z: secret.z, grounded: false });
  s.update(1 / 60);
  assert.equal(
    s.drain().some((e) => e.type === 'secret'),
    false,
  );
  Object.assign(s.player, { y: secret.y, grounded: true });
  s.update(1 / 60);
  assert.equal(
    s.drain().some((e) => e.type === 'secret'),
    true,
  );
});

test('save validation accepts known discoveries once and ignores corrupt or foreign IDs', () => {
  const land = LANDS[0],
    id = land.secrets[0].id;
  assert.deepEqual(
    validSave({ version: 1, secrets: [id, id, 'camp-stores', null, {}] }, land).secrets,
    [id],
  );
  assert.deepEqual(validSave({ version: 1, secrets: 'bad' }, land).secrets, []);
  assert.deepEqual(new Simulation(land).save().secrets, []);
});

test('an old fully explored save keeps all progress and gains fresh optional treasure', () => {
  const land = LANDS[0];
  const old = {
    version: 1,
    gems: land.gems.filter((g) => !g.secretId).map((g) => g.id),
    chests: land.chests.filter((c) => !c.secretId).map((c) => c.id),
    rescues: land.rescues.map((r) => r.id),
    enemies: land.enemies.map((e) => e.id),
    complete: true,
  };
  const s = new Simulation(land, old);
  assert.equal(s.complete, true);
  assert.equal(s.collected.size, 76);
  assert.equal(s.broken.size, 8);
  assert.deepEqual(s.save().secrets, []);
  assert.equal(s.gems.filter((g) => !s.collected.has(g.id)).length, 12);
});

test('discovery survives travel, browser-save round trip and enemy replay without repeat toasts', () => {
  const c = new Campaign(),
    secret = LANDS[0].secrets[0];
  Object.assign(c.simulation.player, { x: secret.x, y: secret.y, z: secret.z });
  c.simulation.update(1 / 60);
  c.travel('peace-keepers');
  c.travel('artisans');
  c.resetEnemies();
  const restored = new Campaign(JSON.parse(JSON.stringify(c.save())));
  assert.deepEqual(restored.simulation.save().secrets, [secret.id]);
  Object.assign(restored.simulation.player, { x: secret.x, y: secret.y, z: secret.z });
  restored.simulation.update(1 / 60);
  assert.equal(
    restored.simulation.drain().some((e) => e.type === 'secret'),
    false,
  );
});
