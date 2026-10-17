import * as T from '../assets/three.module.js';
export { palette, mat, mesh, orb, block } from './primitives.js';
import {
  createDragon as proceduralDragon,
  createSentinel as proceduralSentinel,
} from './characters.js';
import { paintedTexture } from './surfaces.js';
import { cloneModel } from '../engine/models.js';
export { animateDragon, animateSentinel } from './characters.js';
export function createDragon(scale = 1, color) {
  return cloneModel('dragon', scale, color) || proceduralDragon(scale, color);
}
export function createSentinel(type) {
  return cloneModel('gnorc-' + type) || proceduralSentinel(type);
}
export function texture(kind) {
  const painted = paintedTexture(kind === 'stone' ? 'masonry' : kind);
  if (painted) {
    const tex = painted.clone();
    tex.userData.shared = false;
    return tex;
  }
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const c = canvas.getContext('2d');
  c.scale(4, 4);
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (kind === 'grass') {
    c.fillStyle = '#719f43';
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
    for (let i = 0; i < 6000; i++) {
      const x = random() * 256,
        y = random() * 256;
      c.strokeStyle = random() > 0.5 ? 'rgba(41,81,22,.24)' : 'rgba(170,195,91,.3)';
      c.lineWidth = 0.3;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + random() * 2, y - 1, x + (random() - 0.5) * 5, y - 2 - random() * 3);
      c.stroke();
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
  if (kind === 'sand' || kind === 'snow') {
    c.fillStyle = kind === 'sand' ? '#e6d0a7' : '#eaf0f5';
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6000; i++) {
      c.fillStyle =
        i % 2
          ? 'rgba(255,255,255,.18)'
          : kind === 'sand'
            ? 'rgba(140,102,57,.12)'
            : 'rgba(110,145,178,.12)';
      c.fillRect(random() * 256, random() * 256, 0.3 + random() * 0.8, 0.3 + random() * 0.8);
    }
    c.strokeStyle = kind === 'sand' ? 'rgba(164,133,89,.12)' : 'rgba(161,188,213,.14)';
    for (let i = 0; i < 35; i++) {
      const y = random() * 256;
      c.beginPath();
      c.moveTo(0, y);
      c.bezierCurveTo(65, y - 3, 170, y + 3, 256, y);
      c.stroke();
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
