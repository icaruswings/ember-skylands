# Verification record

Date: 2026-10-11.

## Automated checks

- 34 Node test cases pass: 16 simulation tests, five input tests, three storage tests, seven fire tests and three display/gesture tests.
- Syntax checks pass for every authored JavaScript module.
- A simulation playthrough moves through both bridge routes, collects 40 gems, rescues every spirit and activates the portal without teleporting to objectives.
- Independent code review identified lost short action taps and multi-touch ownership errors. Both were reproduced, covered by failing regression tests, fixed, and verified against the complete suite. Gamepad API denial is also covered.

## Browser checks

Real headless Chromium, system binary, software WebGL rendering. Desktop viewport 1440 × 960; emulated phone 390 × 844 and landscape 844 × 390.

- Phone: full viewport before Play, native fullscreen on Play, title/pause settings access, selection prevention, canceled context menu, long press, real multi-touch joystick plus charge, release cleanup, rapid jump/glide taps, pause/resume, map, responsive bounds and portrait/landscape controls pass. Missing and rejected fullscreen APIs both retain full viewport play and functional touch jumping. Audio context enters running state after starting.
- Desktop: rendering, start, keyboard movement, jump/glide, pause freezes the simulation, resume, field guide, map, quality setting and sound initialization. Final rerun passed with no browser errors.
- Fire update: desktop balanced/rich and phone balanced shader rendering, forward flame attack, bounded draw-call budget, expiry, pause mid-attack and resume pass with no browser errors. A paused attack now stops emission, extinguishes its light and lets existing embers cool away. Recorded 200 draw calls in rich desktop mode and 217 in the full-viewport landscape phone view.
- Persistence: collect/save/reload, legal goal save restoration, actual keyboard movement to the portal, victory dialog, continue exploring, corrupt-save recovery and reset cancellation. Final rerun passed.

## Performance observations

Static scenery/model-part batching plus instanced collectibles and foliage reduced the representative scene from 649 draw calls to 188 in balanced quality. An emulated phone view recorded 111 calls and roughly 80,000 triangles. Values vary with camera/frustum. Shadows use a bounded map; balanced mode disables shadows and caps device pixel ratio to one. Collectible effects use a fixed pool of 220 slots. Dedicated fire uses an additional pool of 128 flame/ember slots, with time-based emission of 70 particles/second in balanced quality and 120 in rich quality. The flame plume uses two crossed shader sheets in balanced mode and three in rich mode; warm point lighting is enabled only in rich mode.

These are rendering complexity observations, not a physical-phone frame-rate guarantee. Software WebGL in this environment is much slower than device GPU rendering; tests wait for simulation conditions rather than assuming wall-clock frame rate.

## Limits

No physical iPhone/Android device or Safari browser was available. Real hardware touch latency, thermal behavior and frame rate remain unverified. Standard gamepad mappings are implemented and policy-denial handling is tested, but no physical controller was connected. The synthesized soundtrack and effects are generated and browser audio activation is verified; subjective listening was not available.

This is a complete small three-zone original adventure, not the scale of the commercial Spyro campaign. Its reusable engine uses Three.js for the GPU renderer.
