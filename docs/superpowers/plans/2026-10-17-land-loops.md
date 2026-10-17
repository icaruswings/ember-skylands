# Distinct land loops implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Give each ground land its own wide exploration circuit and two optional treasure pockets.

**Architecture:** Author layout data separately from the shared level factory. Keep terrain, collision and rendering on the same height surface. Extend existing per-world save validation for one-time discoveries.

**Tech Stack:** ES modules, Three.js, Node test runner, Python Playwright/Chromium.

**Spec:** docs/distinct-layouts-design.md

## Global Constraints

- Preserve existing pickup/enemy/friend identifiers and old saves.
- Main routes at least six units wide; no required jumps or secrets.
- Two secrets per land; 88 gems, 10 chests, 12 enemies, three friends.
- Keep the already published polish version live; show new screenshots before layout publication.

## Review Focus

- Old complete saves still have fresh secret rewards (task 2 round-trip test).
- A fast charge can traverse every circuit and secret entrance (task 1 movement test).
- Reward objects do not intersect the new cave walls (task 1 clearance test).
- Visiting another world preserves discovery without replaying its toast (task 2 campaign test).
- Repeated travel disposes new scenery without resource growth (browser campaign verification).

### Task 1: Authored layouts and scenery

**Files:** dist/game/land-layouts.js (new data), dist/game/lands.js (stable-id factory), dist/game/land-scene.js (matching scenery), tests/land-layouts.test.js (new).

**Interfaces:** Layout provides mainLoop, paths, hills, spawn, objective positions, regions and secrets. Land factory exposes these alongside current arrays. Secret records contain id/name/x/z/y/radius and an entry point.

- [x] Write tests for distinct circuits, six-unit widths, old IDs/new counts and wall clearance. Run `node --test tests/land-layouts.test.js`; expect missing-layout assertion failures.
- [x] Implement authored data and factory; render matching cave walls, landmarks and pocket cues.
- [x] Add movement-driven traversal of circuit/secret waypoints; run `npm test`; expect all tests pass.
- [x] Commit tested layout changes.

### Task 2: Persistent discoveries and feedback

**Files:** dist/engine/simulation.js, dist/main.js, tests/secrets.test.js (new).

**Interfaces:** Simulation.discovered is a validated Set of secret IDs; save().secrets is a string array. Entering a secret emits one `secret` event with its record. Legacy levels without secrets remain supported.

- [x] Write discover-once, height, save sanitation, old-save reward and campaign travel tests. Run `node --test tests/secrets.test.js`; expect missing discovery assertions.
- [x] Implement detection, validated save, toast and optional HUD/card counts.
- [x] Run `npm test` and `npm run check`; expect all pass. Commit.

### Task 3: Browser verification and visual review

**Files:** tests/browser_worlds.py (existing actual-touch campaign test), tests/capture_worlds.py, docs/layout-world-\*.png, docs/verification.md.

- [x] Run actual phone campaign with `EMBER_CAPTURE_PREFIX=layout-world-`; inspect all screenshots and scene budgets.
- [x] Inspect secrets and collision correspondence; fix material findings using regression tests.
- [ ] Commit and push the verified review package; present screenshots of each land for approval. Leave production on the published polish version.

## Execution ledger

Base: 4b7549e, isolated feature branch distinct-land-loops. Published polish is unchanged.
Pre-flight: Task 2 consumes the exact secrets records Task 1 produces; browser verification consumes the same published game entry point. No interface conflicts.
Cloud skill helper scripts are not locally installed; track task evidence here and use native tools.

Task 1: implemented. Layout assertions failed first (missing loop, 76 rather than 88 gems, missing secret entrances), then passed. Movement-driven main loops and all branches pass with real obstacles and chests; main loops collect 30+ gems and all friends without secrets. Cave foundation regression failed on floating wall bases, then passed with buried foundations and aligned roof tops. Full isolated npm suite passes 154/154; source syntax checks pass.

Task 2: implemented. Five discovery/save tests failed first (no event or saved secrets), then passed. Includes corrupt/duplicate/foreign identifiers, old complete saves, fresh secret rewards, above-roof exclusion and campaign travel/replay persistence. Existing legacy validation assertion updated for the additive empty secrets list. Full isolated npm suite passes 154/154.

Verification note: an exploratory run with Node test isolation disabled failed the existing GLTF-loader test because another test changes global navigator. The normal isolated `npm test` run passes all 154 tests; retain the standard runner configuration.

Task 1 commit: 1752262. Task 2 commit: a72ebd9. Independent review of 4b7549e..a72ebd9 found no Critical, Important or Minor issues. Its additional continuous-charge probe also traversed every main circuit and branch with real scenery/chest collision; enemies were marked defeated to isolate navigation. GPU and visual checks are owned by task 3.

Task 3: full actual-touch phone campaign passed all four destinations, six ground scene switches, stable resource counts, move/charge/release, flight climb/flame/loop/turn, pause, retry, timer, save/reload and portrait world picker. Ground captures: Artisans 215 calls/317,806 triangles; Peace Keepers 173/234,180; Magic Crafters 164/226,104. Repeated loads stayed within the established geometry-reuse allowance. Native-touch discovery/toast/save/reload passes at all three grotto entrances with health intact and controls fully stopped. The browser fixture changes only declarative spawn to the entrance; normal-spawn approaches are covered by movement tests. Wider visual review is in progress.

Visual review: the real game-renderer viewer also passed entry/discovery/health checks at all six pockets. Initial overview screenshots exposed sky clipping from the elevated review camera and a missing HTML charset in the test-only viewer. Extend only that camera's far plane to 1200 and declare UTF-8, then regenerate the captures. Gameplay rendering is unchanged.

Final visual fix: orchard pocket hedge walls floated over the downhill side. The footprint-height regression failed first, then passed after extending all garden/grove wall foundations below sampled terrain. Grove walls now use matching obstacle geometry. Main and optional traversal still pass. Final isolated npm suite: 155/155, source syntax and whitespace checks pass. Refresh the review captures after this fix.

Task 3: verification and all captures complete. Final viewer rerun passed all six pocket entry/discovery/health checks; reviewed the corrected overview skies, labels and grounded orchard walls. No unresolved review findings. Final code fix commit: 51c8ffb. Publish remains pending the user's requested visual approval; screenshots and validation are packaged in docs/land-layouts-approval.md.
