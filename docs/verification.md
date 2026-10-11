# Verification record

Date: 2026-10-11.

## Automated checks

- 24 deterministic Node test cases pass: 16 simulation tests, five input tests and three storage tests.
- Syntax checks pass for every authored JavaScript module.
- A simulation playthrough moves through both bridge routes, collects 40 gems, rescues every spirit and activates the portal without teleporting to objectives.
- Independent code review identified lost short action taps and multi-touch ownership errors. Both were reproduced, covered by failing regression tests, fixed, and verified against the complete suite. Gamepad API denial is also covered.

## Browser checks

Real headless Chromium, system binary, software WebGL rendering. Desktop viewport 1440 × 960; emulated phone 390 × 844 and landscape 844 × 390.

- Phone: real multi-touch joystick plus charge, release cleanup, rapid jump/glide taps, pause/resume, map, responsive bounds and portrait/landscape controls pass. Audio context enters running state after starting.
- Desktop: rendering, start, keyboard movement, jump/glide, pause freezes the simulation, resume, field guide, map, quality setting and sound initialization. Final rerun passed with no browser errors.
- Persistence: collect/save/reload, legal goal save restoration, actual keyboard movement to the portal, victory dialog, continue exploring, corrupt-save recovery and reset cancellation. Final rerun passed.

## Performance observations

Static scenery/model-part batching plus instanced collectibles and foliage reduced the representative scene from 649 draw calls to 188 in balanced quality. An emulated phone view recorded 111 calls and roughly 80,000 triangles. Values vary with camera/frustum. Shadows use a bounded map; balanced mode disables shadows and caps device pixel ratio to one. Particle effects use a fixed pool of 220 slots.

These are rendering complexity observations, not a physical-phone frame-rate guarantee. Software WebGL in this environment is much slower than device GPU rendering; tests wait for simulation conditions rather than assuming wall-clock frame rate.

## Limits

No physical iPhone/Android device or Safari browser was available. Real hardware touch latency, thermal behavior and frame rate remain unverified. Standard gamepad mappings are implemented and policy-denial handling is tested, but no physical controller was connected. The synthesized soundtrack and effects are generated and browser audio activation is verified; subjective listening was not available.

This is a complete small three-zone original adventure, not the scale of the commercial Spyro campaign. Its reusable engine uses Three.js for the GPU renderer.
