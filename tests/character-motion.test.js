import test from 'node:test';
import assert from 'node:assert/strict';
import { createDragon, animateDragon, createSentinel } from '../dist/game/characters.js';
import * as characters from '../dist/game/characters.js';

function pose(model) {
  const a = model.userData;
  return {
    head: a.head.rotation.toArray().slice(0, 3),
    torso: a.torso.rotation.toArray().slice(0, 3),
    legs: a.legs.map((l) => l.rotation.x),
    wings: a.wings?.map((w) => w.rotation.toArray().slice(0, 3)),
    jaw: a.jaw?.rotation.x,
    eyes: a.eyes?.map((e) => e.scale.y),
  };
}

test('fleeing Gnorcs glance over their shoulder and return to facing forward', () => {
  const gnorc = createSentinel('normal');
  let turned = 0,
    forward = Infinity;
  for (let t = 0; t < 4; t += 0.05) {
    characters.animateSentinel(gnorc, t, 4, 'flee');
    turned = Math.max(turned, Math.abs(gnorc.userData.head.rotation.y));
    forward = Math.min(forward, Math.abs(gnorc.userData.head.rotation.y));
  }
  assert.ok(turned > 1.4, 'glance should visibly look behind the run direction');
  assert.ok(forward < 0.05, 'head should face forward between glances');
});

test('breathing fire opens an independently articulated jaw and recovery closes it', () => {
  const d = createDragon();
  assert.ok(d.userData.jaw?.parent, 'jaw must remain an exportable articulated joint');
  animateDragon(d, 1, 0, false, false, { grounded: true, flame: 0 });
  const shut = d.userData.jaw.rotation.x;
  animateDragon(d, 1, 0, false, false, { grounded: true, flame: 0.35 });
  assert.ok(d.userData.jaw.rotation.x > shut + 0.15, 'breath pose must visibly open mouth');
  animateDragon(d, 1, 0, false, false, { grounded: true, flame: 0 });
  assert.equal(d.userData.jaw.rotation.x, shut, 'mouth must recover without residual state');
});

test('idle blinking remains finite, periodic and restores eyes after closure', () => {
  const d = createDragon();
  assert.equal(d.userData.eyes?.length, 2, 'each eye needs its own exportable joint');
  let minimum = 1,
    maximum = 0;
  for (let t = 0; t < 10; t += 0.03) {
    animateDragon(d, t, 0, false, false, { grounded: true });
    for (const e of d.userData.eyes) {
      assert.ok(Number.isFinite(e.scale.y) && e.scale.y > 0);
      minimum = Math.min(minimum, e.scale.y);
      maximum = Math.max(maximum, e.scale.y);
    }
  }
  assert.ok(minimum < 0.2 && maximum > 0.95, 'eyes must close and reopen');
});

test('takeoff, falling, gliding and charge produce readable distinct poses and reset to idle', () => {
  const d = createDragon();
  const rootPosition = d.position.clone(),
    rootRotation = d.rotation.clone();
  const states = [
    [0, false, false, { grounded: true }],
    [6, false, false, { grounded: false, vy: 8 }],
    [6, false, false, { grounded: false, vy: -8 }],
    [6, true, false, { grounded: false, vy: -1 }],
    [12, false, true, { grounded: true }],
  ];
  const poses = states.map((s) => {
    animateDragon(d, 1.1, ...s);
    return pose(d);
  });
  assert.equal(new Set(poses.map((p) => JSON.stringify(p))).size, states.length);
  assert.notDeepEqual(poses[1].legs, poses[2].legs, 'rising and falling leg gestures differ');
  animateDragon(d, 1.1, ...states[0]);
  assert.deepEqual(pose(d), poses[0]);
  assert.ok(d.position.equals(rootPosition));
  assert.ok(d.rotation.equals(rootRotation));
});

test('Gnorc flee, alert and windup poses preserve placement and restore the patrol pose', () => {
  assert.equal(typeof characters.animateSentinel, 'function');
  const d = createSentinel('giant'),
    position = d.position.clone(),
    rotation = d.rotation.clone();
  assert.ok(d.userData.torso?.parent);
  const states = ['patrol', 'flee', 'alert', 'windup', 'strike', 'recover'];
  const poses = states.map((state) => {
    characters.animateSentinel(d, 1.3, state === 'flee' ? 4 : 0, { state, windup: 0.45 });
    return [
      d.userData.head.rotation.toArray().slice(0, 3),
      d.userData.torso.rotation.toArray().slice(0, 3),
      d.userData.legs.map((l) => l.rotation.x),
      d.userData.sack.rotation.z,
    ];
  });
  assert.equal(new Set(poses.map((p) => JSON.stringify(p))).size, states.length);
  characters.animateSentinel(d, 1.3, 0, { state: 'patrol', windup: 0.45 });
  assert.deepEqual(
    [
      d.userData.head.rotation.toArray().slice(0, 3),
      d.userData.torso.rotation.toArray().slice(0, 3),
      d.userData.legs.map((l) => l.rotation.x),
      d.userData.sack.rotation.z,
    ],
    poses[0],
  );
  assert.ok(d.position.equals(position));
  assert.ok(d.rotation.equals(rotation));
});
