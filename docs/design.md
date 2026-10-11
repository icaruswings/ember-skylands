# Ember: A Skylands Adventure

The classic gameplay pass in `classic-gameplay-plan.md` supersedes the original teal/golem art direction below. The current game has a purple dragon, organic Gnorcs, GLB models, 78 red/green gems, chests, automatic emerald-statue rescues, a low trailing camera and burnable grass. This document retains the initial architecture rationale.

An original dragon collectathon for mobile and desktop browsers. Inspired by the original Spyro's exploration and movement, with original characters, geometry, layout, textures and music.

## Research

- https://blog.playstation.com/2023/09/08/spyro-at-25-insomniac-games-and-toys-for-bob-celebrate-25-years-of-spyro-the-dragon/ — retrospective emphasizing charge, glide, exploration.
- https://strategywiki.org/wiki/Spyro_the_Dragon/Gameplay — movement and flame/charge combat.
- https://www.gamedeveloper.com/art/lessons-in-color-theory-for-i-spyro-the-dragon-i- — cohesive palettes, landmarks, vista composition.
- https://david-bailly.com/portfolio/exploration-feeling-in-spyro-the-dragons-level-design/ — teaching paths and optional exploration.
- https://threejs.org/docs/pages/InstancedMesh.html — batch repeated decoration.
- https://threejs.org/manual/pages/shadows.html — mobile shadow cost management.

## Scope

One complete three-zone adventure: Sunstone Meadow, Willow Rise and Crystal Crown. Rescue three sky spirits, gather 30 of 60 gems and open the central home portal. Optional completion collects every gem and defeats every sentinel. Original teal dragon with orange wing membranes, sculpted floating islands, a castle, waterfall, bridges, crystals and trees. No external asset dependencies after download.

## Engine

Three.js 0.180.0 handles GPU rendering; the application engine owns a bounded fixed-step loop, input, physics, collisions, camera, procedural model animation, particles, event scripts, positional sound and persistence. Rendering is separate from deterministic simulation. Engine code lives under dist/engine, data and world content under dist/game. A data-driven script system responds to rescue and portal conditions. No arbitrary script evaluation.

## Controls

Camera-relative WASD/arrow movement, Space jump then glide, Shift charge, F flame, E interact, Escape pause. Touch joystick and large jump, flame, charge and interact buttons; drag the empty scene to orbit. Gamepad left stick, A jump, X flame, B charge, Y interact.

## Reliability

Clamp frame delta, fixed 60 Hz simulation, recover from falling at last rescue checkpoint, invulnerability after damage, clear input after focus loss, stop simulation while paused. Validate versioned save IDs and recover from corrupt or inaccessible storage. Sound starts only after a gesture. DPR capped to protect mobile GPUs; low quality disables shadows and reduces particles. Show a useful error for unsupported WebGL.

## Verification

Deterministic tests for movement, jump/glide, terrain, combat types, invulnerability, checkpoint recovery, gem and rescue idempotency, portal completion, invalid storage, frame stepping and script triggers. Browser tests for actual GPU rendering, start, movement, audio, pause/resume, dialogs, persistence, desktop and mobile touch controls. Physical-device performance remains a separate verification limit.
