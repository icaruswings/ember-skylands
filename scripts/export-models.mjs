import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createDragon, createSentinel } from '../dist/game/characters.js';

/** Export authored geometry and transform rigs as portable glTF 2.0 binary assets. */
export function encodeModel(root) {
  const json = {
    asset: { version: '2.0', generator: 'Ember authored model pipeline' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
  };
  const objects = [],
    nodes = new Map(),
    materials = new Map(),
    geometries = new Map(),
    chunks = [];
  let byteLength = 0;
  root.traverse((o) => {
    nodes.set(o, objects.length);
    objects.push(o);
  });
  function accessor(attribute, target) {
    const array = attribute.array,
      padded = Buffer.alloc(Math.ceil(array.byteLength / 4) * 4);
    Buffer.from(array.buffer, array.byteOffset, array.byteLength).copy(padded);
    chunks.push(padded);
    const view =
      json.bufferViews.push({
        buffer: 0,
        byteOffset: byteLength,
        byteLength: array.byteLength,
        target,
      }) - 1;
    byteLength += padded.byteLength;
    const componentType =
      array instanceof Float32Array ? 5126 : array instanceof Uint32Array ? 5125 : 5123;
    const record = {
      bufferView: view,
      componentType,
      count: attribute.count,
      type: { 1: 'SCALAR', 2: 'VEC2', 3: 'VEC3', 4: 'VEC4' }[attribute.itemSize],
    };
    if (attribute.itemSize === 3) {
      record.min = [Infinity, Infinity, Infinity];
      record.max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < attribute.count; i++)
        for (let k = 0; k < 3; k++) {
          const v = array[i * 3 + k];
          record.min[k] = Math.min(record.min[k], v);
          record.max[k] = Math.max(record.max[k], v);
        }
    }
    return json.accessors.push(record) - 1;
  }
  function material(m) {
    if (materials.has(m)) return materials.get(m);
    const index = json.materials.length;
    materials.set(m, index);
    json.materials.push({
      name: m.name || `material-${index}`,
      pbrMetallicRoughness: {
        baseColorFactor: [m.color.r, m.color.g, m.color.b, m.opacity],
        metallicFactor: m.metalness ?? 0,
        roughnessFactor: m.roughness ?? 0.8,
      },
      emissiveFactor: m.emissive
        ? [
            m.emissive.r * m.emissiveIntensity,
            m.emissive.g * m.emissiveIntensity,
            m.emissive.b * m.emissiveIntensity,
          ]
        : [0, 0, 0],
      doubleSided: m.side === 2,
      alphaMode: m.transparent ? 'BLEND' : 'OPAQUE',
      extras: { ...m.userData },
    });
    return index;
  }
  for (const [index, o] of objects.entries()) {
    const node = {
      name: o.name || `part-${index}`,
      translation: o.position.toArray(),
      rotation: o.quaternion.toArray(),
      scale: o.scale.toArray(),
    };
    if (o.children.length) node.children = o.children.map((c) => nodes.get(c));
    if (o.isMesh) {
      const geometry = o.geometry;
      if (!geometries.has(geometry)) {
        const attributes = {};
        for (const [key, semantic] of [
          ['position', 'POSITION'],
          ['normal', 'NORMAL'],
          ['uv', 'TEXCOORD_0'],
        ])
          if (geometry.attributes[key])
            attributes[semantic] = accessor(geometry.attributes[key], 34962);
        const indices = geometry.index ? accessor(geometry.index, 34963) : undefined;
        geometries.set(geometry, { attributes, indices });
      }
      node.mesh =
        json.meshes.push({
          primitives: [{ ...geometries.get(geometry), material: material(o.material) }],
        }) - 1;
    }
    json.nodes.push(node);
  }
  const rig = {};
  for (const key of ['torso', 'head', 'tail', 'legs', 'wings', 'sack']) {
    const value = root.userData[key];
    if (Array.isArray(value)) rig[key] = value.map((o) => json.nodes[nodes.get(o)].name);
    else if (value) rig[key] = json.nodes[nodes.get(value)].name;
  }
  json.nodes[0].extras = { engineRig: rig };
  json.buffers = [{ byteLength }];
  const text = Buffer.from(JSON.stringify(json)),
    jsonChunk = Buffer.alloc(Math.ceil(text.length / 4) * 4, 32);
  text.copy(jsonChunk);
  const binary = Buffer.concat(chunks),
    length = 12 + 8 + jsonChunk.length + 8 + binary.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(length, 8);
  const jheader = Buffer.alloc(8);
  jheader.writeUInt32LE(jsonChunk.length, 0);
  jheader.writeUInt32LE(0x4e4f534a, 4);
  const bheader = Buffer.alloc(8);
  bheader.writeUInt32LE(binary.length, 0);
  bheader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jheader, jsonChunk, bheader, binary]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mkdirSync('dist/assets/models', { recursive: true });
  for (const [name, model] of [
    ['dragon', createDragon()],
    ...['normal', 'armor', 'giant'].map((type) => ['gnorc-' + type, createSentinel(type)]),
  ]) {
    const bytes = encodeModel(model);
    writeFileSync(`dist/assets/models/${name}.glb`, bytes);
    console.log(`${name}.glb: ${bytes.length} bytes`);
  }
}
