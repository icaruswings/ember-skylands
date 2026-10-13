import * as T from '../assets/three.module.js';
import { orb, mesh, mat } from './primitives.js';
import { batchParts } from '../engine/batching.js';

/** A small four-winged dragonfly; materials belong to this health indicator. */
export function createCompanion() {
  const root = new T.Group(),
    body = new T.Group();
  root.add(body);
  const gold = new T.MeshStandardMaterial({
    color: 0xffd23b,
    roughness: 0.5,
    emissive: 0xaa681a,
    emissiveIntensity: 0.3,
  });
  const thorax = orb(body, gold, 0, 0, 0, 0.13, 0.12, 0.2);
  for (let i = 0; i < 5; i++)
    orb(body, gold, 0, -i * 0.01, -0.18 - i * 0.12, 0.09 - i * 0.012, 0.08 - i * 0.01, 0.09);
  orb(body, gold, 0, 0.01, 0.23, 0.17, 0.15, 0.14);
  for (const s of [-1, 1]) {
    orb(body, mat(0xfffce7), s * 0.09, 0.05, 0.32, 0.066, 0.08, 0.04);
    orb(body, mat(0x242749), s * 0.09, 0.05, 0.356, 0.03, 0.05, 0.015);
  }
  const wings = [];
  const membrane = new T.MeshStandardMaterial({
    color: 0xe1f6ff,
    transparent: true,
    opacity: 0.66,
    side: T.DoubleSide,
    roughness: 0.25,
    depthWrite: false,
  });
  for (const s of [-1, 1])
    for (const z of [-0.12, 0.09]) {
      const w = new T.Group();
      w.position.set(s * 0.1, 0.08, z);
      body.add(w);
      const shape = new T.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(s * 0.26, 0.17, s * 0.58, 0.09);
      shape.quadraticCurveTo(s * 0.46, -0.12, 0, 0);
      const plane = mesh(new T.ShapeGeometry(shape, 7), membrane, w);
      plane.rotation.x = -Math.PI / 2;
      wings.push(w);
    }
  batchParts(body);
  root.userData = { body: thorax, wings, tintMeshes: [], initialized: false };
  body.traverse((o) => {
    if (o.isMesh && o.material === gold) root.userData.tintMeshes.push(o);
  });
  root.userData.body = root.userData.tintMeshes[0];
  return root;
}

export function updateCompanion(root, p, dt, time) {
  const a = root.userData;
  const color = [0x8fe558, 0x70d7fa, 0xffd23b][Math.max(0, Math.min(2, p.health - 1))];
  for (const mesh of a.tintMeshes) mesh.material.color.setHex(color);
  if (dt <= 0) return;
  const x = p.x + Math.cos(p.angle) * 1.05 - Math.sin(p.angle) * 0.55,
    z = p.z - Math.sin(p.angle) * 1.05 - Math.cos(p.angle) * 0.55,
    y = p.y + 1.4 + Math.sin(time * 4) * 0.12;
  if (!a.initialized) {
    root.position.set(x, y, z);
    a.initialized = true;
  } else {
    const blend = 1 - Math.exp(-dt * 9);
    root.position.x += (x - root.position.x) * blend;
    root.position.y += (y - root.position.y) * blend;
    root.position.z += (z - root.position.z) * blend;
  }
  root.rotation.y = p.angle + Math.sin(time * 3) * 0.13;
  a.wings.forEach((w, i) => {
    w.rotation.z = Math.sin(time * 50 + (i % 2) * 0.8) * (i < 2 ? 1 : -1) * 0.45;
  });
}
