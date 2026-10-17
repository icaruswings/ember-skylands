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

- [ ] Write tests for distinct circuits, six-unit widths, old IDs/new counts and wall clearance. Run `node --test tests/land-layouts.test.js`; expect missing-layout assertion failures.
- [ ] Implement authored data and factory; render matching cave walls, landmarks and pocket cues.
- [ ] Add movement-driven traversal of circuit/secret waypoints; run `npm test`; expect all tests pass.
- [ ] Commit tested layout changes.

### Task 2: Persistent discoveries and feedback

**Files:** dist/engine/simulation.js, dist/main.js, tests/secrets.test.js (new).

**Interfaces:** Simulation.discovered is a validated Set of secret IDs; save().secrets is a string array. Entering a secret emits one `secret` event with its record. Legacy levels without secrets remain supported.

- [ ] Write discover-once, height, save sanitation, old-save reward and campaign travel tests. Run `node --test tests/secrets.test.js`; expect missing discovery assertions.
- [ ] Implement detection, validated save, toast and optional HUD/card counts.
- [ ] Run `npm test` and `npm run check`; expect all pass. Commit.

### Task 3: Browser verification and visual review

**Files:** tests/browser_worlds.py (existing actual-touch campaign test), tests/capture_worlds.py, docs/layout-world-*.png, docs/verification.md.

- [ ] Run actual phone campaign with `EMBER_CAPTURE_PREFIX=layout-world-`; inspect all screenshots and scene budgets.
- [ ] Inspect secrets and collision correspondence; fix material findings using regression tests.
- [ ] Run final source checks; commit and push review branch. Present screenshots of each land for approval; leave production on the published polish version.

## Execution ledger

Base: 4b7549e, isolated feature branch distinct-land-loops. Published polish is unchanged.
Pre-flight: Task 2 consumes the exact secrets records Task 1 produces; browser verification consumes the same published game entry point. No interface conflicts.
Cloud skill helper scripts are not locally installed; track task evidence here and use native tools.

Task 1: implemented. Layout assertions failed first (missing loop, 76 rather than 88 gems, missing secret entrances), then passed. Movement-driven main loops and all branches pass with real obstacles and chests; main loops collect 30+ gems and all friends without secrets. Cave foundation regression failed on floating wall bases, then passed with buried foundations and aligned roof tops. Full isolated npm suite passes 154/154; source syntax checks pass.

Task 2: implemented. Five discovery/save tests failed first (no event or saved secrets), then passed. Includes corrupt/duplicate/foreign identifiers, old complete saves, fresh secret rewards, above-roof exclusion and campaign travel/replay persistence. Existing legacy validation assertion updated for the additive empty secrets list. Full isolated npm suite passes 154/154.

Verification note: an exploratory run with Node test isolation disabled failed the existing GLTF-loader test because another test changes global navigator. The normal isolated `npm test` run passes all 154 tests; retain the standard runner configuration.
