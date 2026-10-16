# Steering and camera

The goal is responsive dragon platforming on a phone: deliberate turns, readable movement, and a camera that lets children correct their direction on narrow ramps. PlayStation’s [25-year Spyro retrospective](https://blog.playstation.com/?p=384113) describes the original emphasis on intuitive 3D movement and the importance of muscle memory. Our tuning is an adaptation for this game’s scale and touch controls; these are not reverse-engineered Spyro constants.

## Input

A touch starts at rest wherever the thumb lands within the joystick. Slide from that point to move. A 12% radial dead zone absorbs jitter; a power curve of 1.45 gives the inner stick useful slow walking. Full travel is 36% of the pad width. One pointer owns the stick until release or cancellation; other fingers can use action buttons. Gamepads use the same radial curve with a 14% dead zone.

Movement uses the current camera heading every simulation step. The camera follows horizontal player translation immediately, so its rendered heading agrees with the input basis. Vertical movement remains damped to keep the viewing pitch steady during jumps.

## Locomotion

`engine/movement.js` owns horizontal movement and exposes one immutable tuning table. Rates use seconds and world units; the simulation runs at 60 Hz. Ground movement turns up to 11 radians/second, accelerates at 50 units/second², and brakes at 100. Sharp turns reduce the target running speed until the dragon faces the desired direction. A full-speed release stops within 0.35 world units, well inside a three-unit ramp.

Running tops out at 7 units/second. Charge carries forward at 15 with a 4.6 radians/second turn limit; glide carries forward at 9 with a 3.4 limit. Release charge before small pickups or tight ramp corners. Normal air steering is 7 radians/second. Folding the wings returns to normal movement and braking, allowing a controlled landing.

## Camera

Walking and running keep the camera’s yaw steady, including held diagonals. Automatic following engages during charging or gliding. This prevents a feedback loop where an automatic camera turn would rotate a held stick direction into circles. Manual orbit holds for 1.8 seconds. The camera button, C, or R3 recenters behind the dragon over roughly half a second; manual orbit cancels it. L2/R2 and the right stick orbit the view.

Standard gamepad layout: cross/A jumps, square/X charges, circle/B breathes fire, triangle/Y interacts. No saved-game schema changes are required.

## Verification

Regression coverage includes touch anchoring and jitter, pointer ownership, live camera-relative corrections, radial gamepad response, button mapping, bounded turns, braking distance, neutral-stick charge, recentering, camera framing, and an analogue ascent of both watchtower ramps. The existing movement-driven full adventure and hidden-garden glide route remain required checks. Browser checks exercise real Chromium touch events, the ramp route, multitouch, recenter controls, pause, and portrait/landscape layouts.

### Verified on 16 October 2026

- `npm test`: all 16 isolated test files pass, including the movement-driven full adventure and new steering regressions. JavaScript syntax checks and `git diff --check` pass.
- `browser_mobile.py`: portrait/landscape, immersive viewport, fullscreen and rejected/missing-fullscreen fallbacks, no text selection, multitouch, charge, jump/glide, pause/settings/map, and the 44-pixel camera button pass.
- `browser_next.py`: real touch input starts neutral off-centre, ignores jitter, ascends both watchtower ramps, recenters on the landing, pauses the rig, jumps/glides into the Hidden Garden, opens its chest, shows four realms, reloads saved progress, and interrupts a giant’s windup with flame.
- `browser_classic.py`: desktop and phone treasure/fire/save, automatic rescue, charging an armored enemy, steady sideways camera, and keyboard recenter pass. Render budgets remain within the existing limits.
- Independent review reproduced and fixed the held-diagonal feedback loop. A 20-second run now travels 139.57 units with 139.57 units displacement and zero camera yaw drift.

Browser verification uses Chromium with software WebGL and emulated touch devices. Physical iPhone/Safari testing was not available in this environment.

### Missed-release repair

A missing element-level `pointerup` could leave the last stick direction or charge held indefinitely. The regression reproduces full-speed movement after the finger has lifted when pointer-release events are blocked.

`hold-control.js` now owns hold lifetimes for the joystick, camera drag and action buttons. Touch-capable browsers use native touch identifiers and reconcile them against the browser’s active finger list. Finger input is handled once, without duplicating the accompanying pointer stream. Releasing one finger leaves other controls intact. Mouse and pen retain best-effort pointer capture, with window-level release and released-button recovery. Page suspension, focus loss, fullscreen changes and viewport/orientation changes cancel held controls and pending taps. A stationary held thumb remains valid without an inactivity timeout.

Regression coverage includes the rendering-independent stop/braking behavior, dropped pointer releases, failed capture, independent joystick/charge fingers, touch cancellation, stale-finger recovery, and layout interruption. `browser_input_release.py --baseline` reproduces the published bug; the normal command exercises the repaired lifetimes using real Chromium touch events against the production Input and Simulation modules. The full game’s phone test checks touch actions, jump/glide, recentering and fullscreen behavior.

The repair passes all 16 Node test files, including seven new release regressions. The browser fault-injection fixture passes with pointer releases suppressed, partial multitouch releases, cancellation, off-pad release, resize, rapid taps, and unavailable mouse pointer capture. The complete phone browser check passes in portrait/landscape and with native fullscreen available, missing or rejected. Review found no important issues. No physics or world-layout changes were needed.
