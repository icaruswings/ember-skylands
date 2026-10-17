# Distinct land layout validation — 2026-10-17

The published polish release remains live as Sites v9 at commit 4b7549e. The distinct-layout work is on the separate distinct-land-loops branch pending the user's requested screenshot review.

- All 155 automated cases across 26 isolated Node test files pass with the normal `npm test` command; authored JavaScript syntax checks and diff whitespace checks pass.
- Each ground land has a different closed main circuit, optional branches, hill field, objective placement and themed solid scenery. Main paths are eight units wide; branches are 6.5. A movement-driven run traverses every circuit and branch using real chest/scenery collision, without jumps. Every main circuit reaches all three friends and enough gems for the medal without secret rewards.
- All 76 old gem IDs, eight old chest IDs, twelve enemy IDs and three friend IDs per land remain valid. Each land now has 88 gems, ten chests and two optional discoveries. Old complete saves keep all progress while receiving twelve fresh secret pickups. Tests cover malformed/foreign/duplicate discovery IDs, above-roof exclusion, one-time discovery and campaign travel/replay persistence.
- Grotto walls use the same dimensions/height as collision, with foundations buried below the hill and tops aligned to their roof. Reward and entrance clearance tests pass.
- Final visual inspection caught floating orchard hedge foundations. A failing footprint-height regression reproduced it; garden and grove wall foundations now extend below their entire footprint. Grove walls also have matching collision, with the main/optional traversal suite still passing. The final full suite passes 155/155 and all pocket captures were regenerated.
- Independent code review found no Critical, Important or Minor issues. Its additional continuous-charge navigation probe passed every circuit and branch. Navigation probes disable live enemies to isolate route clearance; actual campaign runs leave enemies active.
- The full Chromium phone integration passes all four destinations, six ground scene switches, stable resources, native multitouch move/charge/release, full flight controls, pause/retry/timer, save/reload and portrait picker. Ground views: Artisans 215 calls/317,806 visible triangles; Peace Keepers 173/234,180; Magic Crafters 164/226,104 (budgets 450/400,000 in these scenarios).
- Native phone touch charge through each grotto entrance passes with the real game UI: one secret toast, saved per-land discovery, released controls stopped, health intact and progress restored after reload. This browser fixture changes only declarative initial spawn to the entrance; it does not mutate live game state or discover secrets directly. Movement tests independently cover the entire route from the normal spawn.
- The test-only game-renderer viewer passes approach/discovery checks for all six treasure pockets, including the open grove, camp and overlook; each emits one discovery and preserves health. Review captures include all three layout overviews, all six pocket close-ups, all four running-game phone destinations, three native-phone grotto discoveries and the portrait world picker. The overview camera extends its far plane to include the sky sphere from its higher position; gameplay camera settings are unchanged. See [the visual review](land-layouts-approval.md).
- Software WebGL validates functionality and geometry complexity, not physical-phone frame rate. Physical iPhone/Android, Safari and hardware controllers remain untested.

# Character/movement polish validation — 2026-10-17

- All 142 behavior cases across 23 isolated Node files pass; npm test and all authored JavaScript syntax checks pass.
- Actual phone touch checks pass: tap/held jump heights 0.85/2.0 units; jump/glide/cancel; eased charge turn; complete release stop; stationary stride; fire; paused simulation and rig. The glide check sends its second native touch during takeoff, avoiding an actionability delay into the intentional landing-jump buffer window.
- All four destinations and six ground scene switches pass the full campaign integration with stable resource counts. Artisans: 213 calls/332,930 visible triangles; Peace Keepers: 206/293,144; Magic Crafters: 209/298,496. Budgets for the requested denser models: 450 calls/400,000 visible triangles in these scenarios.
- The dedicated input-release regression passes with pointer ends suppressed and independent finger releases in either order. Mouse release without pointer capture and resize cancellation also pass.
- The standard GLB loader, exact authored export comparison, close-up art viewer, UV validity/seams, index cost, fitted armor coverage and shared-resource disposal checks pass. The reviewer’s glide-entry wing snap finding was reproduced and fixed; the reviewer verified resolution.
- Actual loaded dragon: 25,680 triangles/15,791 vertices, 688,664-byte GLB. Props have four painted 627px swatches with 512px relief normals. Close-ups and all four phone world views are saved as docs/polish-\*.png.
- The user explicitly requested publication after testing, then a separate distinct-layouts/exploration/secrets pass. Physical phone/Safari/controller limits remain as documented below.

# Worlds and flight review — 2026-10-17

The user approved all four screenshots on 2026-10-17 (“Looks great.”). This tested build is proceeding to publication.

- 126 behavior tests across 21 isolated Node files pass; all authored JavaScript syntax checks pass. Coverage includes independent land saves and migration, bounded charge/jump/glide, full flight controls and targets, timers/retry, input cancellation, resource ownership and legacy terrain contracts.
- Gentle rolling hills use one analytic height sampler for collision, terrain mesh, conforming path ribbons, grass, scenery and objectives. Tests check continuous gentle slopes, visible height variation, planted uphill/downhill charging, enemy ground contact and rendered vertex alignment.
- A movement-driven Sunny Flight playthrough completes all 32 targets in 76.75 simulated seconds using only bounded steering, pitch and flame. It does not teleport or collect targets directly, and requires no boundary recovery.
- Independent review identified four invisible generic blockers. Matching low stone boulders now render at their exact centers/radii; the reviewer verified that resolves the finding and reported no remaining blocking findings.
- The dedicated release regression also passes with all pointer release events deliberately suppressed: native touch end/cancel stops motion, independent joystick/charge fingers release in either order, resize clears holds, taps stay single, and mouse release works without pointer capture.
- Actual Chromium phone integration passed before the hill addition: all four destinations, six ground scene switches with stable geometry/texture counts, real multitouch move/charge/release, flight climb/fire/loop/turn, pause/retry/timer, save/reload and portrait world selection. The final hill-enabled rerun also passed all these checks with no browser errors. Ground views used 205–212 draw calls and 143,036–191,254 triangles; geometry counts remained 147–154 across six switches. The exact review build also renders all four approval captures successfully: Artisans 212 calls/191,830 triangles; Peace Keepers 205/143,612; Magic Crafters 208/157,236; Sunny Flight 124/34,274. Screenshots are in [the visual review](worlds-approval.md). `npm test` also passes all 126 cases through the normal test runner.

Physical iPhone/Android hardware, Safari and a physical controller remain untested. Software WebGL checks geometry and functional behavior; it cannot establish physical-phone frame rates.

The records below are historical checks of the former connected-island world, retained for provenance.

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
