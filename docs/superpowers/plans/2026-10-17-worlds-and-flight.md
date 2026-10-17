# Broad Worlds and Flight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship three forgiving ground lands and a replayable flying challenge on the existing phone-friendly Site.

**Architecture:** Preserve the existing ground engine and authored assets. Add data-driven bounded lands, a campaign controller, a separate flight simulation and scene, and renderer world switching with explicit resource ownership.

**Tech Stack:** Buildless JavaScript ES modules, vendored Three.js, node:test, Python Playwright.

**Spec:** `docs/worlds-expansion-design.md`

## Global Constraints

- Preserve public Sites project identity and GitHub repository.
- Three ground lands: Artisans, Peace Keepers, Magic Crafters; Sunny Flight activity.
- No mandatory precision ramps, gaps or locked travel.
- Practice flight and non-inverted climb controls by default; optional timed/inverted modes.
- Preserve phone fullscreen, no selection and robust held-input cancellation.
- Keep GPU scene count to one active land; no new production dependencies.

## Review Focus

- Sustained charge/jump/glide toward every boundary must remain playable without falling.
- Changing land with a held input must not carry movement or stale effects into the destination.
- Old or malformed saves must not corrupt independent per-land progress.
- A fast step through a flight arch must count once; fire must reach targets in three dimensions.
- Pause, timeout, completion and retry must stop/restart the flight clock and target state consistently.

### Task 1: Safe ground lands and campaign

Files: `dist/game/lands.js`, `dist/engine/campaign.js`, `dist/engine/terrain.js`, `dist/engine/simulation.js`, `tests/lands.test.js`, `tests/campaign.test.js`.

Interfaces: `LANDS` list and `getLand(id)`; each ground definition follows the existing level schema plus `bounds` and `theme`. `Campaign(saved)` exposes `simulation`, `landId`, `travel(id)`, `save()`, `resetEnemies()` and flight records. `Simulation.save()` remains a version-1 per-land payload.

- [x] Write and run failing behavior tests for safe charge boundaries, large continuous reachable floors, separate progress, migration and corrupt saves.
- [x] Implement bounded surface containment and three authored level definitions; retain legacy level.js for terrain regression fixtures.
- [x] Implement campaign switching, save validation/migration and replayable enemies.
- [x] Run the new tests and existing suite; commit the tested engine/data changes.

### Task 2: Flight movement and challenge

Files: `dist/game/flight-course.js`, `dist/engine/flight.js`, `tests/flight.test.js`.

Interfaces: `FLIGHT_COURSE` defines bounds, spawn and 32 targets; `FlightSimulation(course,{timed,inverted})` exposes the renderer-compatible player/state/drain/update interface plus result, remaining time, target progress and restart.

- [x] Write and run failing tests for automatic flight, neutral altitude, pitch/yaw, inversion, recovery, swept arches, flame-only targets, moving targets, practice/timed completion, failure and retry.
- [x] Implement deterministic 3D flight with bounded rates, forgiving recovery and separate attempt state.
- [x] Verify all tests and commit the flight core.

### Task 3: Rendered lands and flight

Files: `dist/game/land-scene.js`, `dist/game/flight-scene.js`, `dist/game/world.js`, `dist/engine/renderer.js`.

Interfaces: Scene factories accept scene and level and return the existing world adapter plus `dispose()`; renderer `loadLevel(level)` clears transient effects and switches scene/camera safely.

- [x] Add scene-level assertions for theme landmarks, portal/target count and bounded geometry.
- [x] Build castle gardens, desert fortifications, snow/crystal courtyard and coastal flight course from existing textures and authored models.
- [x] Implement active-scene replacement, flight camera/banking, live moving targets and resource ownership.
- [x] Verify syntax, scene adapters and browser rendering before proceeding.

### Task 4: Travel, HUD and controls

Files: `dist/main.js`, `dist/index.html`, `dist/style.css`, `dist/engine/input.js`, browser tests.

Interfaces: World picker calls campaign travel; fixed-step update samples normal movement or flight intent, never both. Settings persist flight inversion. Flight practice/timed entry, retry and return use the same input-clear transition path.

- [x] Add browser scenarios for large world picker, actual touch travel/reset, flight controls, pause/retry and persistence.
- [x] Integrate campaign state, per-land map/objectives, reset-enemies action, flight target HUD and contextual control labels.
- [x] Update title/guide copy to describe three ground lands plus flight, with default forgiving play.
- [x] Run all Node checks and relevant browser tests; fix observed failures.

### Task 5: Review and publication

- [x] Request independent code review and resolve important findings.
- [ ] Record actual verification evidence, research sources and hardware/browser limits.
- [ ] Commit and push the exact tested state to GitHub and Sites source; package from that commit.
- [ ] Show screenshots of all four destinations and obtain the user’s requested visual approval.
- [ ] Save and deploy the approved upgrade to the existing public Site, confirm success, and stop the goal with a concise handoff.
