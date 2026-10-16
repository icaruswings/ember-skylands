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
