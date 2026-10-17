import test from 'node:test';
import assert from 'node:assert/strict';
const create = async (saved) => {
  const { Campaign } = await import('../dist/engine/campaign.js');
  return new Campaign(saved);
};
test('world progress stays independent across travel and reloading', async () => {
  const c = await create();
  const id = c.simulation.level.gems[0].id;
  c.simulation.collected.add(id);
  c.travel('peace-keepers');
  assert.equal(c.simulation.collected.size, 0);
  c.simulation.rescued.add(c.simulation.level.rescues[0].id);
  const restored = await create(c.save());
  assert.equal(restored.landId, 'peace-keepers');
  assert.equal(restored.simulation.rescued.size, 1);
  restored.travel('artisans');
  assert.ok(restored.simulation.collected.has(id));
  assert.equal(restored.simulation.rescued.size, 0);
});
test('legacy progress migrates into its corresponding first three lands', async () => {
  const c = await create({
    version: 1,
    gems: ['gem-0', 'gem-20', 'gem-40', 'fake'],
    rescues: ['spirit-0', 'spirit-1', 'spirit-2'],
    enemies: ['enemy-0', 'enemy-2', 'enemy-4'],
    chests: ['chest-0', 'chest-2', 'chest-4'],
  });
  for (const id of ['artisans', 'peace-keepers', 'magic-crafters']) {
    c.travel(id);
    assert.equal(c.simulation.collected.size, 1);
    assert.equal(c.simulation.rescued.size, 1);
    assert.equal(c.simulation.defeated.size, 1);
    assert.equal(c.simulation.broken.size, 1);
  }
});
test('corrupt campaign selections and records recover to a clean playable state', async () => {
  const c = await create({
    version: 2,
    currentLand: 'unknown',
    worlds: { artisans: { version: 1, gems: ['fake'], rescues: 'bad' } },
    flight: { bestTime: -4, completed: 'bad' },
  });
  assert.equal(c.landId, 'artisans');
  assert.equal(c.simulation.collected.size, 0);
  assert.equal(c.flightRecord.bestTime, null);
  assert.throws(() => c.travel('unknown'));
  assert.equal(c.landId, 'artisans');
});
test('replaying enemies preserves treasure and rescues', async () => {
  const c = await create(),
    s = c.simulation;
  s.collected.add(s.level.gems[0].id);
  s.rescued.add(s.level.rescues[0].id);
  s.hitEnemy(s.enemies[0].id, 'charge');
  c.resetEnemies();
  assert.equal(c.simulation.defeated.size, 0);
  assert.equal(c.simulation.collected.size, 1);
  assert.equal(c.simulation.rescued.size, 1);
});
