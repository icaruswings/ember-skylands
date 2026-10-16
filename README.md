# Ember — A Skylands Adventure

[Play on Sites](https://ember-skylands.icaruswings138.chatgpt.site) · [Public source](https://github.com/icaruswings/ember-skylands)

A small browser dragon collectathon with a classic purple dragon and artist-built Gnorcs. Run, charge, breathe fire, jump and glide across three connected garden realms and a secret glide garden. Approach emerald dragon statues to free friends and watch them dance. Collect 30 gems to open the castle portal; explore for all 94 gems, seven chests and six Gnorcs. The camera follows from behind at dragon height. Climb the west watchtower, leap and glide into the Hidden Garden, then take the return bridge back.

Built in JavaScript using Three.js 0.180.0 for rendering. The application engine supplies deterministic physics, collisions, input, animated procedural models, pooled particles, event-driven scripts, gesture-gated synthesized music/effects and local saves. No server, external fonts, asset CDN, tracking or sign-in is required by the game itself. Sites hosting controls access to the published site.

## Run locally

Requires Node.js 20+ for tests and Python 3 for the static preview.

```sh
npm ci
npm run dev
```

Open http://localhost:4173. To deploy elsewhere, serve `dist/` as a static directory. Sites configuration is in `.openai/hosting.json` and should be rebound for a different Sites project.

## Play

| Action           | Keyboard      | Touch                    | Standard gamepad      |
| ---------------- | ------------- | ------------------------ | --------------------- |
| Move             | WASD / arrows | Left joystick            | Left stick            |
| Jump, then glide | Space twice   | Jump twice               | A / ✕ twice           |
| Charge           | Hold Shift    | Hold Charge              | Hold X / □            |
| Breathe fire     | F             | Flame                    | B / ○                 |
| Enter portal     | E near portal | Contextual Portal button | Y / △                 |
| Look             | Drag scenery  | Drag scenery             | Right stick / L2 / R2 |
| Recenter camera  | C             | Camera button            | R3                    |
| Map              | M             | Map button               | —                     |
| Pause            | Escape        | Pause button             | —                     |

Small joystick movements walk slowly; touch the pad anywhere to establish a neutral thumb position, then slide to move. Walking turns gradually and brakes quickly. Charging moves forward while held, even with a neutral stick, and steers in a wider arc. The camera stays steady while walking and running; use the camera button or C to recenter behind the dragon.

Armored Gnorcs require a charge; large Gnorcs require flame. Thieves flee with shoulder sacks and glance over their shoulders. Giants raise an arm before striking, giving you time to flame them or retreat. Red gems lie in the grass; green gems emerge from defeated enemies and chests broken with flame or charge. Nearby gems pull toward the dragon. Rescues happen automatically, restore health and set your fall-recovery checkpoint. Fire shortens nearby grass and darkens its tips. The dragonfly follows smoothly and changes color with health. Blinking, breathing, galloping, charging, jumping and gliding use independently animated joints. Progress saves on this device, including collected gems, dragon friends, broken chests and defeated enemies; player position resets to the garden when reopening the game. Use Settings to reset it.

Phones fill the viewport from the title screen. Tapping Play also requests native fullscreen where the browser supports it; unsupported or denied requests keep the same immersive layout. Settings are available on the title screen and through Pause. Game text cannot be selected, and controls suppress long-press menus. Safe-area spacing keeps controls clear of phone cutouts.

## Maintain

- `dist/engine/simulation.js`: deterministic rendering-independent physics, gameplay state and safe script predicates.
- `dist/engine/terrain.js`: overlapping floors, raised terraces, ramps and height-aware obstacles.
- `dist/engine/enemy-ai.js`: terrain-safe patrols, fleeing and giant attack phases.
- `dist/game/companion.js`: animated dragonfly and health colors.
- `dist/game/exploration-scenery.js`: watchtower, staircase landing and hidden garden scenery.
- `dist/engine/movement.js`: bounded turning, acceleration and braking with centralized tuning; see [control design](docs/controls.md).
- `dist/engine/input.js`: unified keyboard, multi-touch and gamepad inputs with queued taps.
- `dist/engine/display.js`: gesture-gated fullscreen and game selection/context-menu protection.
- `dist/engine/renderer.js`: scene lighting and visual state adapter; chase-camera.js handles the low trailing view.
- `dist/engine/batching.js`: geometry/material batching to reduce draw calls.
- `dist/engine/audio.js`: original procedural soundtrack and positional effects.
- `dist/engine/particles.js`: bounded collectible/effect particle pool.
- `dist/engine/fire-breath.js`: dedicated animated fire shaders and warm light.
- `dist/engine/flame-pool.js`: bounded, frame-independent flame and ember motion.
- `dist/engine/storage.js`: resilient local storage wrappers.
- `dist/game/level.js`: declarative islands, paths, goals, enemies, gems and rescue content.
- `dist/game/assets.js`: stable model exports and 1024px environment texture generation.
- `dist/game/characters.js`: sculpted creature silhouettes, organic Gnorcs, shoulder sacks and dragon animation.
- `dist/game/model-geometry.js`: UV-mapped lofts, continuous tapers, smooth seams and beveled forms.
- `dist/game/surfaces.js`: generated local albedo textures, relief normals and shared materials.
- `dist/game/trees.js`: deterministic branching trunks, roots and individual leaf shapes.
- `dist/game/grass.js` and `dist/engine/grass-field.js`: curved instanced vegetation, wind and spatially indexed burn state.
- `dist/game/treasure.js`: faceted jewels and batched wooden chests.
- `dist/game/rescue.js`: statue and celebration rendering, including fresh-adventure restoration.
- `dist/engine/models.js`: local GLB loading and shared geometry/material instances.
- `scripts/export-models.mjs`: reproducible authored geometry/rig export; run `npm run assets` after character changes.
- `dist/game/world.js`: world geometry and decorations.
- `dist/main.js`: game state, scripts, HUD, dialogs and app integration.

Add content in `level.js`, then add its visual representation in `world.js`. Save validation restricts identifiers to the declared level. Increment the save format if existing identifiers or save semantics change. Three.js is vendored so production requires no dependency fetch; see `dist/assets/THREE-LICENSE.txt`.

## Verify

```sh
npm test
npm run check
```

The Node suite covers gameplay, a complete movement-driven adventure, touch edge cases, focus loss, forbidden gamepad access, persistence, scripts and fixed-step catch-up. Browser integration scripts require Python Playwright and Chromium, plus the local server:

```sh
python tests/browser_smoke.py
python tests/browser_mobile.py
python tests/browser_progress.py
python tests/browser_fire.py
python tests/browser_assets.py
python tests/browser_classic.py
python tests/browser_next.py
```

Browser tests use `/usr/bin/chromium` and software WebGL in headless mode. They test real input and rendered scenes. The final portal test restores a legal objective save before moving to the portal; the separate simulation adventure test reaches the objectives by moving through every bridge. See `docs/verification.md` for actual results and remaining physical-device limits.

## Original assets

Models, textures, terrain, architecture, vegetation and sound are locally authored/generated. The dragon and Gnorcs now reference the visual silhouettes of Spyro and the original game's enemies; no extracted game model or original soundtrack is bundled. The game loads authored `.glb` models through the vendored Three.js glTF loader. Creature skins and tree materials use bundled image-generated textures with normal-map relief. See `docs/art-pipeline.md` for the pipeline, `docs/spyro-references.md` for visual research, and `docs/verification.md` for checks and limits. This three-realm recreation does not reproduce the retail game's complete campaign or exact level layouts.
