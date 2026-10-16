# Current upgrade validation — 2026-10-16

- 76 behavior cases across 15 isolated Node files pass, plus application syntax checks. New coverage includes route traversal from the normal spawn, raised-floor landing, giant windup/interruption/recovery, articulated character poses/blinking/shoulder glances, actual-mouth fire attachment, companion following/health/pause, and distance-based grass detail.
- Independent review found no blocking defects. All original treasure/enemy/chest/rescue records and v1 complete saves remain intact. Original bridge routes still reach all three rescues. The four GLBs match their authored exports, clone independently and stay within geometry budgets.
- The publishing retry reran the complete Node suite and syntax checks successfully. Final desktop and phone treasure/fire/save/reload checks pass with no browser errors: desktop 244 calls/228,888 triangles; landscape phone 297 calls/244,550 triangles. These pass the existing 330-call/245,000-triangle fixture budget. Automatic rescue/dance, catching a fleeing armored Gnorc, its green drop and the trailing camera turn also pass.
- Real phone touch input climbs both ramps and reaches the watchtower at height 6. A browser-test assertion incorrectly expected a nonexistent `paused` state; the test now waits for the visible resume control, then checks frozen simulation time and rig pose. The rerun after this test-only correction was canceled at the network-permission step. Final touch glide/hidden-garden chest and the remaining extended browser suite have not been revalidated against this upgrade. Their prior-release results below remain historical. The complete new route does pass the movement-driven simulation test from the normal spawn, including treasure and the return bridge.
- Rendering fixes consolidate identical crystal materials and reduce distant grass detail. The staircase corner now has a wider landing. The user requested another publishing attempt with these verification limits recorded; do not describe the unrun browser checks as passing. Physical-device/Safari/controller limits below still apply.

The release record below describes the previously published version.

# Verification record

Date: 2026-10-11.

## Automated checks

- 61 Node test cases pass across ten isolated test files: 16 simulation, seven input, three storage, seven fire, three display/gesture, six model/UV/rig, six camera/grass, ten treasure/rescue/enemy, two rescue-rendering/chest-budget and one GLB pipeline test. The GLB test parses all four shipped binaries through the official Three.js loader. Both `npm test` and direct isolated execution of every test file pass.
- Syntax checks pass for every authored JavaScript module.
- A simulation playthrough moves through both bridge routes, collects 40 gems, rescues every spirit and activates the portal without teleporting to objectives.
- Independent code review identified lost short action taps and multi-touch ownership errors. Both were reproduced, covered by failing regression tests, fixed, and verified against the complete suite. Gamepad API denial is also covered.
- The classic gameplay pass adds regressions for chest collisions, one-time treasure release, gem attraction, automatic healing/checkpoints, saved chest contents, directional flame height, fleeing enemies staying on terrain, bounded patrol returns, camera-relative movement gestures and jump-camera pitch. Review exposed enemy teleporting and camera/input feedback; both are fixed and covered.
- Exported models preserve separate animation rigs while sharing geometry/materials. Friend recoloring leaves the player unchanged; reset restores emerald statues. Statue proxies use one material draw each and chests use three. Grass burn state and pooled scorch marks remain bounded and pause with gameplay.

## Browser checks

Real headless Chromium, system binary, software WebGL rendering. Desktop viewport 1440 × 960; emulated phone 390 × 844 and landscape 844 × 390.

- Phone: full viewport before Play, native fullscreen on Play, title/pause settings access, selection prevention, canceled context menu, long press, real multi-touch joystick plus charge, release cleanup, rapid jump/glide taps, pause/resume, map, responsive bounds and portrait/landscape controls pass. Missing and rejected fullscreen APIs both retain full viewport play and functional touch jumping. Audio context enters running state after starting.
- Desktop: rendering, start, keyboard movement, jump/glide, pause freezes the simulation, resume, field guide, map, quality setting and sound initialization. Final rerun passed with no browser errors.
- Fire: desktop balanced/rich and phone balanced shader rendering, forward flame attack, bounded draw-call budget, expiry, pause mid-attack and resume pass with no browser errors. A paused attack stops emission, extinguishes its light and lets existing embers cool away. Mouth emission positions follow the shortened muzzle. Final rich desktop rendering records 224 draw calls/219,060 triangles; balanced phone rendering records 238 calls/207,198 triangles.
- Persistence: collect/save/reload, legal goal save restoration, actual keyboard movement to the portal, victory dialog, continue exploring, corrupt-save recovery and reset cancellation. Final rerun passed.
- Art: 1254px dragon skin and 512px normal-map loading pass. The final balanced world view records 216 draw calls/213,818 triangles. Isolated dragon, armored/giant Gnorc and tree render checks pass with no browser errors and inspect the actual GLB assets. Independent review caught pupil occlusion and a UV-seam shading crease; both have passing regressions. The final phone control run records 62 calls and 127,848 triangles in portrait; counts vary by camera and visible geometry.
- Classic gameplay: desktop and emulated-phone checks pass with no browser errors, using declarative initial-spawn fixtures and real control input. Breaking a chest releases attracted green gems, saves its state, survives reload and singes 31 grass tufts. Rendering records 222 calls/217,972 triangles on desktop and 284 calls/232,802 triangles on phone. The burn state freezes on pause. Walking toward a dragon statue triggers automatic release and its dance while play continues. A real charge catches a fleeing armored Gnorc and collects its green drop. The camera trails the dragon after a held-direction turn. All four model-file requests are required before starting these checks.

## Performance observations

Static scenery/model-part batching, merged statue proxies and instanced gems/grass keep the denser world within explicit browser budgets: fewer than 280 calls/240,000 triangles in the balanced art view, and fewer than 330 calls/245,000 triangles in the phone treasure/fire fixture. Grass contributes three instanced draws. Values vary with camera/frustum. Shadows use a bounded map; balanced mode disables shadows and caps device pixel ratio to one. Collectible effects use a fixed pool of 220 slots. Dedicated fire uses an additional pool of 128 flame/ember slots, with time-based emission of 70 particles/second in balanced quality and 120 in rich quality. The flame plume uses two crossed shader sheets in balanced mode and three in rich mode; warm point lighting is enabled only in rich mode.

These are rendering complexity observations, not a physical-phone frame-rate guarantee. Software WebGL in this environment is much slower than device GPU rendering; tests wait for simulation conditions rather than assuming wall-clock frame rate.

## Limits

No physical iPhone/Android device or Safari browser was available. Real hardware touch latency, thermal behavior and frame rate remain unverified. Standard gamepad mappings are implemented and policy-denial handling is tested, but no physical controller was connected. The synthesized soundtrack and effects are generated and browser audio activation is verified; subjective listening was not available.

This is a complete small three-zone original adventure, not the scale of the commercial Spyro campaign. Its reusable engine uses Three.js for the GPU renderer.
