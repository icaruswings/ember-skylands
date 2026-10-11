import { GLTFLoader } from '../assets/GLTFLoader.js';
import { surface } from '../game/surfaces.js';

const templates = new Map();
export async function loadModelFiles() {
  const loader = new GLTFLoader();
  await Promise.all(
    ['dragon', 'gnorc-normal', 'gnorc-armor', 'gnorc-giant'].map(async (name) => {
      const gltf = await loader.loadAsync(
        new URL(`../assets/models/${name}.glb`, import.meta.url).href,
      );
      const root = gltf.scene.children[0];
      root.traverse((o) => {
        if (!o.isMesh) return;
        const { surfaceKind, tint } = o.material.userData;
        if (surfaceKind) o.material = surface(surfaceKind, tint);
        o.castShadow = o.receiveShadow = true;
      });
      templates.set(name, root);
    }),
  );
}

/** Clone transforms while sharing immutable geometry/textures between characters. */
export function cloneModel(name, scale = 1, color) {
  const template = templates.get(name);
  if (!template) return null;
  const root = template.clone(true),
    rig = root.userData.engineRig || {};
  for (const [key, names] of Object.entries(rig))
    root.userData[key] = Array.isArray(names)
      ? names.map((n) => root.getObjectByName(n))
      : root.getObjectByName(names);
  root.scale.multiplyScalar(scale);
  if (color !== undefined)
    root.traverse((o) => {
      if (o.isMesh && o.material.userData.surfaceKind === 'scales')
        o.material = surface('scales', color);
    });
  return root;
}
