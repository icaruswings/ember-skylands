import { animateDragon } from './characters.js';

/** Reconcile retained scene objects with saved, live or freshly reset rescue state. */
export function updateRescue(data, freed, time, rescueTime) {
  const d = data.dragon;
  if (freed !== data.freed) {
    for (const [object, material] of data.originals)
      object.material = freed ? material : data.emerald;
    data.freed = freed;
  }
  data.halo.visible = !freed;
  d.visible = freed;
  if (data.statue) data.statue.visible = !freed;
  if (!freed) {
    animateDragon(d, 0, 0, false, false);
    d.position.y = 0.4;
    d.rotation.y = 0.5;
    return;
  }
  const age = time - (rescueTime ?? -100);
  animateDragon(d, time, age < 4 ? 3 : 0, false, false);
  if (age < 4) {
    d.position.y = 0.4 + Math.abs(Math.sin(age * 7)) * 0.5;
    d.rotation.y = 0.5 + Math.sin(age * 5) * 0.7;
    d.userData.wings.forEach(
      (wing, i) => (wing.rotation.z = (i ? -1 : 1) * (0.35 + Math.sin(age * 8) * 0.35)),
    );
  } else {
    d.position.y = 0.4;
    d.rotation.y = 0.5;
  }
}
