# Ember — A Skylands Adventure

[Play on Sites](https://ember-skylands.icaruswings138.chatgpt.site) · [Public source](https://github.com/icaruswings/ember-skylands)

An original, complete small 3D collectathon for desktop and phone browsers. Run, charge, breathe fire, jump and glide across three connected floating islands. Rescue three sky spirits and collect 30 gems to reopen the home portal. Keep exploring for all 60 gems and six sentinels.

Built in JavaScript using Three.js 0.180.0 for rendering. The application engine supplies deterministic physics, collisions, input, animated procedural models, pooled particles, event-driven scripts, gesture-gated synthesized music/effects and local saves. No server, external fonts, asset CDN, tracking or sign-in is required by the game itself. Sites hosting controls access to the published site.

## Run locally

Requires Node.js 20+ for tests and Python 3 for the static preview.

```sh
npm ci
npm run dev
```

Open http://localhost:4173. To deploy elsewhere, serve `dist/` as a static directory. Sites configuration is in `.openai/hosting.json` and should be rebound for a different Sites project.

## Play

| Action           | Keyboard         | Touch                      | Standard gamepad |
| ---------------- | ---------------- | -------------------------- | ---------------- |
| Move             | WASD / arrows    | Left joystick              | Left stick       |
| Jump, then glide | Space twice      | Jump twice                 | A twice          |
| Charge           | Hold Shift       | Hold Charge                | Hold B           |
| Breathe fire     | F                | Flame                      | X                |
| Rescue / portal  | E near objective | Contextual Rescue / Portal | Y                |
| Look             | Drag scenery     | Drag scenery               | Right stick      |
| Map              | M                | Map button                 | —                |
| Pause            | Escape           | Pause button               | —                |

Armored sentinels require a charge; large sentinels require flame. Rescues restore health and set your fall-recovery checkpoint. Progress saves on this device, including collected gems, spirits and defeated enemies; player position resets to the meadow when reopening the game. Use Settings to reset it.

Phones fill the viewport from the title screen. Tapping Play also requests native fullscreen where the browser supports it; unsupported or denied requests keep the same immersive layout. Settings are available on the title screen and through Pause. Game text cannot be selected, and controls suppress long-press menus. Safe-area spacing keeps controls clear of phone cutouts.

## Maintain

- `dist/engine/simulation.js`: deterministic rendering-independent physics, gameplay state and safe script predicates.
- `dist/engine/input.js`: unified keyboard, multi-touch and gamepad inputs with queued taps.
- `dist/engine/display.js`: gesture-gated fullscreen and game selection/context-menu protection.
- `dist/engine/renderer.js`: scene lighting, third-person camera and visual state adapter.
- `dist/engine/batching.js`: geometry/material batching to reduce draw calls.
- `dist/engine/audio.js`: original procedural soundtrack and positional effects.
- `dist/engine/particles.js`: bounded collectible/effect particle pool.
- `dist/engine/fire-breath.js`: dedicated animated fire shaders and warm light.
- `dist/engine/flame-pool.js`: bounded, frame-independent flame and ember motion.
- `dist/engine/storage.js`: resilient local storage wrappers.
- `dist/game/level.js`: declarative islands, paths, goals, enemies, gems and rescue content.
- `dist/game/assets.js`: original textured model factories and animation.
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
```

Browser tests use `/usr/bin/chromium` and software WebGL in headless mode. They test real input and rendered scenes. The final portal test restores a legal objective save before moving to the portal; the separate simulation adventure test reaches the objectives by moving through every bridge. See `docs/verification.md` for actual results and remaining physical-device limits.

## Original assets

All dragon models, terrain, architecture, enemies, vegetation, crystals, textures, particles, logo and audio are generated by the project. No Spyro artwork, characters, maps, audio or code are included. Design research and links are in `docs/design.md`. The game shares familiar exploration, flame/charge and glide mechanics with classic dragon platformers.
