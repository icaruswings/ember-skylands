import * as T from '../assets/three.module.js';
import { batchParts } from '../engine/batching.js';
/** All artwork is generated locally. Shared geometry/material caches limit GPU allocations. */
export const palette = {
  dragon: 0x53baa3,
  belly: 0xf6d490,
  wing: 0xf29b59,
  stone: 0xdfd0af,
  roof: 0xc97848,
  leaf: 0x68994c,
};
const materials = new Map();
export const mat = (color, extra = {}) => {
  if (Object.keys(extra).length)
    return new T.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
  if (!materials.has(color))
    materials.set(color, new T.MeshStandardMaterial({ color, roughness: 0.85 }));
  return materials.get(color);
};
export function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const sphere = new T.SphereGeometry(1, 16, 12),
  cone = new T.ConeGeometry(1, 1, 10),
  box = new T.BoxGeometry(1, 1, 1);
export function orb(parent, material, x, y, z, sx, sy = sx, sz = sx) {
  const m = mesh(sphere, material, parent, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
export function block(parent, material, x, y, z, sx, sy, sz) {
  const m = mesh(box, material, parent, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
function point(parent, material, x, y, z, sx, sy, sz = sx) {
  const m = mesh(cone, material, parent, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
function membrane(sign) {
  const shape = new T.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(sign * 1.25, 0.65);
  shape.lineTo(sign * 2.5, 0.15);
  shape.lineTo(sign * 1.7, -0.6);
  shape.quadraticCurveTo(sign * 1.2, -0.3, sign * 0.8, -0.85);
  shape.quadraticCurveTo(sign * 0.5, -0.4, 0, -0.6);
  const geo = new T.ShapeGeometry(shape);
  return geo;
}
export function createDragon(scale = 1, color = palette.dragon) {
  const root = new T.Group(),
    body = mat(color),
    belly = mat(palette.belly),
    wingMat = mat(palette.wing, { side: T.DoubleSide }),
    horn = mat(0xffe8b5),
    white = mat(0xffffed),
    black = mat(0x203d38),
    ridge = mat(0x387e76);
  const torso = new T.Group();
  root.add(torso);
  orb(torso, body, 0, 0.83, 0, 0.65, 0.64, 1.07);
  orb(torso, belly, 0, 0.55, 0.45, 0.48, 0.37, 0.7);
  const head = new T.Group();
  head.position.set(0, 1.27, 0.94);
  torso.add(head);
  orb(head, body, 0, 0.15, 0.1, 0.65, 0.6, 0.6);
  orb(head, body, 0, -0.05, 0.65, 0.59, 0.36, 0.56);
  orb(head, belly, 0, -0.25, 0.58, 0.45, 0.13, 0.46);
  for (const s of [-1, 1]) {
    orb(head, white, s * 0.46, 0.32, 0.43, 0.22, 0.3, 0.23);
    orb(head, black, s * 0.48, 0.32, 0.61, 0.1, 0.17, 0.065);
    orb(head, white, s * 0.51, 0.39, 0.66, 0.035);
    orb(head, black, s * 0.24, 0.06, 1.12, 0.058, 0.036, 0.04);
    const brow = orb(head, body, s * 0.44, 0.58, 0.42, 0.28, 0.08, 0.2);
    brow.rotation.z = s * -0.15;
    const h = point(head, horn, s * 0.42, 0.82, -0.15, 0.14, 0.65);
    h.rotation.z = s * -0.3;
    h.rotation.x = -0.35;
    const ear = point(head, body, s * 0.72, 0.37, -0.16, 0.24, 0.5);
    ear.rotation.z = s * -1.1;
  }
  const legs = [];
  for (const z of [-0.65, 0.6])
    for (const s of [-1, 1]) {
      const leg = new T.Group();
      leg.position.set(s * 0.47, 0.52, z);
      torso.add(leg);
      orb(leg, body, 0, -0.1, 0, 0.23, 0.42, 0.24);
      orb(leg, body, s * 0.06, -0.36, 0.15, 0.26, 0.17, 0.35);
      for (let i = 0; i < 3; i++)
        orb(leg, horn, s * 0.06 + (i - 1) * 0.12, -0.4, 0.42, 0.05, 0.06, 0.13);
      legs.push(leg);
    }
  const tail = new T.Group();
  tail.position.set(0, 0.8, -0.7);
  torso.add(tail);
  for (let i = 0; i < 6; i++) {
    const o = orb(
      tail,
      body,
      Math.sin(i * 0.4) * 0.18,
      -i * 0.055,
      -i * 0.32,
      0.34 - i * 0.045,
      0.3 - i * 0.04,
      0.4 - i * 0.045,
    );
    o.rotation.y = 0.2;
  }
  for (let i = 0; i < 5; i++) {
    point(torso, ridge, 0, 1.45 - i * 0.045, 0.45 - i * 0.4, 0.13, 0.29);
  }
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new T.Group();
    w.position.set(s * 0.42, 1.17, -0.12);
    torso.add(w);
    const m = mesh(membrane(s), wingMat, w);
    m.rotation.x = 0.3;
    for (const end of [
      [s * 1.25, 0.65, 0],
      [s * 2.5, 0.15, 0],
      [s * 0.8, -0.85, 0],
    ]) {
      const curve = new T.LineCurve3(new T.Vector3(0, 0, 0.02), new T.Vector3(...end));
      mesh(new T.TubeGeometry(curve, 1, 0.045, 5, false), body, w);
    }
    w.rotation.y = s * 0.65;
    w.rotation.z = s * 0.25;
    wings.push(w);
  }
  batchParts(root);
  root.scale.setScalar(scale);
  root.userData = { torso, head, legs, tail, wings };
  return root;
}
export function animateDragon(root, time, speed, gliding, charging) {
  const a = root.userData;
  const running = speed > 0.5;
  a.torso.position.y =
    running && !gliding ? Math.abs(Math.sin(time * 12)) * 0.1 : Math.sin(time * 2) * 0.035;
  a.head.rotation.x = charging ? 0.2 : Math.sin(time * 2) * 0.035;
  a.tail.rotation.y = Math.sin(time * 3) * 0.15;
  for (let i = 0; i < a.legs.length; i++)
    a.legs[i].rotation.x = gliding
      ? 0.5
      : running
        ? Math.sin(time * (charging ? 19 : 12) + (i % 2) * Math.PI) * 0.65
        : 0;
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    a.wings[i].rotation.y = s * (gliding ? 0.08 : 0.72);
    a.wings[i].rotation.z =
      s * (gliding ? 0.1 + Math.sin(time * 7) * 0.12 : 0.3 + Math.sin(time * 3) * 0.08);
  }
}
export function texture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d');
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (kind === 'grass') {
    c.fillStyle = '#9eb45f';
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2400; i++) {
      const v = 100 + random() * 70;
      c.fillStyle = `rgba(${v - 10},${v + 20},${v * 0.48},.18)`;
      c.beginPath();
      c.ellipse(
        random() * 256,
        random() * 256,
        2 + random() * 9,
        1 + random() * 3,
        random() * 6,
        0,
        7,
      );
      c.fill();
    }
  }
  if (kind === 'stone') {
    c.fillStyle = '#b4a98e';
    c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++)
      for (let x = -1; x < 5; x++) {
        c.fillStyle = ['#e2d6b7', '#d2c5a8', '#c8b99c'][Math.floor(random() * 3)];
        c.beginPath();
        c.roundRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28, 5);
        c.fill();
        c.fillStyle = 'rgba(255,250,220,.2)';
        c.fillRect(x * 64 + (y % 2) * 32 + 5, y * 32 + 3, 53, 3);
      }
  }
  if (kind === 'water') {
    c.fillStyle = '#61caca';
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 80; i++) {
      c.strokeStyle = 'rgba(225,255,255,.35)';
      c.beginPath();
      const x = random() * 256,
        y = random() * 256;
      c.moveTo(x, y);
      c.bezierCurveTo(x + 5, y - 5, x + 15, y + 5, x + 30, y);
      c.stroke();
    }
  }
  if (kind === 'wood') {
    c.fillStyle = '#a77a4d';
    c.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 8; x++) {
      c.fillStyle = '#77583c';
      c.fillRect(x * 32, 0, 2, 256);
      for (let i = 0; i < 20; i++) {
        c.strokeStyle = 'rgba(70,40,20,.16)';
        c.beginPath();
        c.moveTo(x * 32 + random() * 28, 0);
        c.lineTo(x * 32 + random() * 28, 256);
        c.stroke();
      }
    }
  }
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
export function createSentinel(type) {
  const root = new T.Group(),
    body = mat(type === 'giant' ? 0xb587b5 : 0x759a91),
    stone = mat(0x526e75),
    gold = mat(0xefbe67),
    dark = mat(0x183333);
  orb(root, body, 0, 0.7, 0, 0.65, 0.75, 0.6);
  orb(root, body, 0, 1.5, 0, 0.57, 0.5, 0.5);
  for (const s of [-1, 1]) {
    orb(root, dark, s * 0.23, 1.56, 0.44, 0.11, 0.09, 0.04);
    block(root, body, s * 0.38, 0.2, 0, 0.35, 0.4, 0.5);
    orb(root, body, s * 0.75, 0.8, 0, 0.23, 0.4, 0.23);
  }
  if (type === 'armor') {
    orb(root, stone, 0, 1.8, -0.1, 0.66, 0.3, 0.55);
    block(root, gold, 0, 1.73, 0.46, 1.15, 0.12, 0.15);
    point(root, gold, 0, 2.2, 0, 0.16, 0.65);
  }
  if (type === 'giant') {
    root.scale.setScalar(1.35);
    for (const s of [-1, 1]) point(root, gold, s * 0.45, 1.99, 0, 0.13, 0.5);
  }
  batchParts(root);
  return root;
}
