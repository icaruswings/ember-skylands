# Art pipeline

## Direction

Original storybook fantasy: teal scaled dragons, amber translucent-looking wing membranes, carved green-grey golems with gold trim, and warm-barked branching oaks. Silhouettes stay legible at phone size. This art uses shaped meshes and physically based materials rather than higher tessellation of overlapping spheres.

## Canonical textures

All three stored files are original image-generated artwork. Lossless WebP encoding preserves the source PNG's decoded pixels exactly. The combined download is approximately 6.6 MB. No art service or CDN is contacted at runtime.

| File                              | Native resolution | Purpose                                                      |
| --------------------------------- | ----------------- | ------------------------------------------------------------ |
| `dist/assets/dragon-scales.webp`  | 1254 × 1254       | Neutral overlapping scales, tinted per dragon                |
| `dist/assets/oak-bark.webp`       | 1254 × 1254       | Vertical organic bark grain                                  |
| `dist/assets/material-atlas.webp` | 1254 × 1254       | Four generated swatches; wing and foliage quadrants are used |

Generation direction: a seamless, evenly lit, flat albedo swatch with crisp hand-painted detail, no text, labels, border, characters or perspective. Scales use pale ivory shield shapes for tinting; bark uses warm neutral brown winding fissures. Atlas quadrants contain ivory scales, amber veined membrane, oak bark and green foliage. Native output dimensions are recorded above rather than claiming the requested generation size.

`surfaces.js` loads local textures before scene construction, extracts the used atlas quadrants into independent 627px textures, and creates bounded 512px linear-data normal maps from painted luminance. This approximates fine surface relief; it is not a sculpt-to-mesh normal bake. The same material module generates a 1024px armor wear texture. Environment grass, stone, wood and water textures are also generated at 1024px. Color maps use sRGB, normal maps use linear data, and filtering uses mipmaps and anisotropy.

## Models

`model-geometry.js` supplies curved elliptical lofts, continuous tapered curves, limb links, planar UV mapping and beveled armor blocks. Duplicated UV seam vertices retain their coordinates while sharing averaged normals. `characters.js` owns silhouettes and animation joints. `trees.js` owns deterministic trunks, roots, boughs and curved leaf shapes. Public factories and animation signatures remain exported through `assets.js`.

| Asset            | Triangles |
| ---------------- | --------: |
| Dragon           |    11,828 |
| Armored sentinel |     4,436 |
| Giant sentinel   |     4,068 |
| Normal sentinel  |     3,684 |
| Oak              |     2,984 |

The prior dragon used 14,724 triangles. Mesh parts are batched by material within each animation joint, preserving head, leg, tail and wing movement. Sentinels batch to four draw calls per visible model. Tree geometry is batched across the static world; individual leaves do not create individual gameplay draw calls. Balanced mode retains detailed textures while limiting pixel ratio and disabling shadows.

## Review and change

Run `npm test` and `npm run check`. With the local server running, `python tests/browser_assets.py` checks loaded texture/normal resolution and scene budgets, then renders isolated dragon, sentinel and tree previews into `docs/model-*.png`. The viewer is test-only and does not add a shipping game mode.

Review both close-ups and the real game camera: inspect eye occlusion, mouth/fire alignment, curved-surface seams, UV stretching, leaf silhouettes, shadow edges and animation joints. Then run phone and flame integration checks. Geometry, UV/normal validity, budgets, seam continuity, pupil visibility and rig transforms have automated coverage. Physical-device performance still needs hardware validation.
