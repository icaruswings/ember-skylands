import * as T from '../assets/three.module.js';

const textures = new Map(),
  normals = new Map(),
  materials = new Map();
// Each atlas region stays inside its swatch, including the filtering footprint.
const regions = { membrane: [0.5, 0.5], foliage: [0.5, 0] };
export async function loadArtTextures() {
  const loader = new T.TextureLoader();
  const [atlas, scales, bark] = await Promise.all([
    loader.loadAsync(new URL('../assets/material-atlas.webp', import.meta.url).href),
    loader.loadAsync(new URL('../assets/dragon-scales.webp', import.meta.url).href),
    loader.loadAsync(new URL('../assets/oak-bark.webp', import.meta.url).href),
  ]);
  for (const [kind, position] of Object.entries(regions)) {
    // Extract swatches so mipmaps never bleed another material across an edge.
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = atlas.image.width / 2;
    canvas
      .getContext('2d')
      .drawImage(
        atlas.image,
        position[0] * atlas.image.width,
        (0.5 - position[1]) * atlas.image.height,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    const tex = new T.CanvasTexture(canvas);
    textures.set(kind, tex);
  }
  textures.set('scales', scales);
  textures.set('bark', bark);
  textures.set('armor', armorTexture());
  textures.set('cloth', clothTexture());
  textures.set('skin', skinTexture());
  textures.set('horn', hornTexture());
  for (const tex of textures.values()) {
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.wrapS = tex.wrapT = T.ClampToEdgeWrapping;
  }
  for (const [kind, tex] of textures) normals.set(kind, reliefNormals(tex.image));
  atlas.dispose();
  materials.clear();
}

function clothTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const c = canvas.getContext('2d');
  c.fillStyle = '#e2d6bd';
  c.fillRect(0, 0, 1024, 1024);
  // Woven neutral fibers tint cleanly for tunics and overfilled treasure sacks.
  for (let i = 0; i < 1024; i += 4) {
    c.strokeStyle = i % 8 ? '#cabda5' : '#f4e8d2';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i, 1024);
    c.stroke();
    c.beginPath();
    c.moveTo(0, i);
    c.lineTo(1024, i);
    c.stroke();
  }
  return new T.CanvasTexture(canvas);
}
function skinTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e9e2cf';
  ctx.fillRect(0, 0, 1024, 1024);
  let seed = 917;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 3200; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(116,108,82,.035)' : 'rgba(255,247,216,.12)';
    ctx.beginPath();
    ctx.ellipse(
      random() * 1024,
      random() * 1024,
      8 + random() * 25,
      4 + random() * 13,
      random() * 6.28,
      0,
      6.28,
    );
    ctx.fill();
  }
  for (let i = 0; i < 19000; i++) {
    ctx.fillStyle = i % 3 ? 'rgba(116,107,79,.09)' : 'rgba(255,251,228,.2)';
    ctx.beginPath();
    ctx.arc(random() * 1024, random() * 1024, 0.35 + random() * 0.7, 0, 6.28);
    ctx.fill();
  }
  return new T.CanvasTexture(canvas);
}
function hornTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f4e9c7';
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 12; y < 512; y += 42) {
    const band = ctx.createLinearGradient(0, y - 5, 0, y + 8);
    band.addColorStop(0, 'rgba(137,106,47,0)');
    band.addColorStop(0.55, 'rgba(137,106,47,.2)');
    band.addColorStop(1, 'rgba(255,254,221,.15)');
    ctx.fillStyle = band;
    ctx.fillRect(0, y - 5, 512, 13);
  }
  return new T.CanvasTexture(canvas);
}

function armorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const c = canvas.getContext('2d');
  c.fillStyle = '#edeeeb';
  c.fillRect(0, 0, 1024, 1024);
  let seed = 91;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 6000; i++) {
    const v = 180 + Math.floor(random() * 55);
    c.strokeStyle = `rgba(${v},${v},${v},.13)`;
    c.lineWidth = 0.6;
    const x = random() * 1024,
      y = random() * 1024;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + random() * 40, y + (random() - 0.5) * 2);
    c.stroke();
  }
  return new T.CanvasTexture(canvas);
}

// Small normal maps derive restrained relief from the painted surface grain.
// They use linear color data and are capped at 512px to bound phone memory.
function reliefNormals(image) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.min(512, image.width);
  const c = canvas.getContext('2d', { willReadFrequently: true });
  c.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = c.getImageData(0, 0, canvas.width, canvas.height),
    size = canvas.width;
  const height = (x, y) => {
    const i = (((y + size) % size) * size + ((x + size) % size)) * 4;
    return (data.data[i] * 0.21 + data.data[i + 1] * 0.72 + data.data[i + 2] * 0.07) / 255;
  };
  const output = c.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (height(x - 1, y) - height(x + 1, y)) * 1.6;
      const dy = (height(x, y + 1) - height(x, y - 1)) * 1.6;
      const n = Math.hypot(dx, dy, 1),
        i = (y * size + x) * 4;
      output.data[i] = ((dx / n) * 0.5 + 0.5) * 255;
      output.data[i + 1] = ((dy / n) * 0.5 + 0.5) * 255;
      output.data[i + 2] = ((1 / n) * 0.5 + 0.5) * 255;
      output.data[i + 3] = 255;
    }
  c.putImageData(output, 0, 0);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.NoColorSpace;
  return texture;
}

export function surface(kind, color = 0xffffff) {
  const key = `${kind}:${color}`;
  if (!materials.has(key)) {
    const map = textures.get(kind);
    // Loading is complete before scene construction. Untextured materials also
    // support geometry tests and asset tools that do not own a browser canvas.
    materials.set(
      key,
      new T.MeshStandardMaterial({
        color,
        map: map ?? null,
        normalMap: normals.get(kind) ?? null,
        normalScale: new T.Vector2(kind === 'skin' ? 0.18 : 0.6, kind === 'skin' ? 0.18 : 0.6),
        roughness: kind === 'scales' ? 0.67 : kind === 'armor' ? 0.6 : 0.9,
        metalness: kind === 'armor' ? 0.3 : 0,
        emissive: kind === 'foliage' ? 0x5f7937 : 0x000000,
        emissiveIntensity: kind === 'foliage' ? 0.24 : 0,
        side: kind === 'membrane' || kind === 'foliage' ? T.DoubleSide : T.FrontSide,
      }),
    );
  }
  const material = materials.get(key);
  material.userData.surfaceKind = kind;
  material.userData.tint = color;
  return material;
}
