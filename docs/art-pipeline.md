# Art pipeline

## Direction

Classic purple dragon with gold horns/yellow ventral plates, orange membranes, and organic green Gnorcs wearing cloth and carrying shoulder sacks. Warmer castle gardens and a low trailing view move the theme toward the researched reference. Models are artist-built recreations; no extracted commercial meshes are used. Reference images were inspected for silhouettes and kept outside the shipped game. See `spyro-references.md`.

## Canonical textures

All three stored files are original image-generated artwork. Lossless WebP encoding preserves the source PNG's decoded pixels exactly. The combined download is approximately 6.6 MB. No art service or CDN is contacted at runtime.

| File                              | Native resolution | Purpose                                                      |
| --------------------------------- | ----------------- | ------------------------------------------------------------ |
| `dist/assets/dragon-scales.webp`  | 1254 × 1254       | Neutral overlapping scales, tinted per dragon                |
| `dist/assets/oak-bark.webp`       | 1254 × 1254       | Vertical organic bark grain                                  |
| `dist/assets/material-atlas.webp` | 1254 × 1254       | Four generated swatches; wing and foliage quadrants are used |

Generation direction: a seamless, evenly lit, flat albedo swatch with crisp hand-painted detail, no text, labels, border, characters or perspective. Scales use pale ivory shield shapes for tinting; bark uses warm neutral brown winding fissures. Atlas quadrants contain ivory scales, amber veined membrane, oak bark and green foliage. Native output dimensions are recorded above rather than claiming the requested generation size.

`surfaces.js` loads local textures before scene construction, extracts the used atlas quadrants into independent 627px textures, and creates bounded 512px linear-data normal maps from painted luminance. This approximates fine surface relief; it is not a sculpt-to-mesh normal bake. The same material module generates 1024px armor wear, woven cloth and mottled skin textures, plus 512px horn growth bands. Environment grass, stone, wood and water textures are also generated at 1024px. Color maps use sRGB, normal maps use linear data, and filtering uses mipmaps and anisotropy.

## Models

`model-geometry.js` supplies curved elliptical lofts, continuous tapered curves, limb links, planar UV mapping and beveled armor blocks. Duplicated UV seam vertices retain their coordinates while sharing averaged normals. `characters.js` owns silhouettes and animation joints. `trees.js` owns deterministic trunks, roots, boughs and curved leaf shapes. Public factories and animation signatures remain exported through `assets.js`.

`npm run assets` exports the authored dragon and three Gnorc variants into `dist/assets/models/*.glb`. These are standard glTF 2.0 binaries containing geometry, UVs, materials and the transform rig. `engineRig` metadata identifies the head, legs, wings, tail and sack. Texture-kind/tint metadata binds the original albedo/normal maps after loading. Generic glTF viewers can inspect the mesh; the game's loader binds its shared textures and procedural animation. Export output is deterministic.

The game awaits local textures and GLBs before building the scene. Factories clone independent transform rigs while sharing geometry and materials; friend color overrides do not recolor the player. Three.js's glTF loader and geometry utilities are vendored with its MIT license, so no runtime CDN is needed. Artist source remains in `characters.js` and `model-geometry.js`; regeneration is a separate build step.

Static emerald statue proxies merge to one material draw each until freed; the animated friends appear for their release dance. Chests batch to three material draws per chest. Grass uses three instanced draw calls, deterministic curved ribbon tufts and a spatially indexed burn attribute. Balanced mode draws 55% of the tufts, caps pixel ratio and disables shadows. Both modes retain detailed textures.

Rebuild the GLBs whenever character geometry or material metadata changes, then run the asset checks against the resulting files.

## Review and change

Run `npm test` and `npm run check`. With the local server running, `python tests/browser_assets.py` checks loaded texture/normal resolution and scene budgets, then renders isolated dragon, sentinel and tree previews into `docs/model-*.png`. The viewer is test-only and does not add a shipping game mode.

Review both close-ups and the real game camera: inspect eye occlusion, mouth/fire alignment, curved-surface seams, UV stretching, leaf silhouettes, shadow edges and animation joints. Then run phone and flame integration checks. Geometry, UV/normal validity, budgets, seam continuity, pupil visibility and rig transforms have automated coverage. Physical-device performance still needs hardware validation.
