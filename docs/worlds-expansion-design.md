# Broad worlds and flight design

The player is a child who wants to charge around and defeat enemies. Success means full-throttle play stays on the ground, travel never requires a narrow ramp or a precision glide, and each destination has a distinct identity and clear objectives. Existing touch-release fixes, phone fullscreen, no-selection controls, model assets and saves remain supported.

## Scope and assumptions

Interpret the first three lands as the first homeworld themes: Artisans, Peace Keepers and Magic Crafters. Add the first flight challenge, Sunny Flight, as an activity available from Artisans. These are authored compact adaptations of those settings and mechanics, not retail-level geometry or a reproduction of every sublevel. All destinations are unlocked from the start. The user authorizes autonomous implementation and publication, and subsequently requested screenshots of every destination for approval before this upgrade is called complete.

## World design

Each ground land occupies its own broad enclosed valley, roughly 120 world units across. The playable floor is continuous with gentle rolling hills; perimeter scenery and visible boundary walls contain running, jumping and charging. Wide lanes join open combat clearings. Artisans has a green castle courtyard, hedges, a shallow decorative pond and waterfall. Peace Keepers has warm desert training grounds, sandstone fortifications, cannons and tents. Magic Crafters has a snowy mountain courtyard, blue-roofed towers, crystal gardens and wizard-flavoured enemies. There are no mandatory bridges, watchtower stairs or floating-island edges. Ordinary falling is removed from these main routes.

Each land has gems, breakable chests, multiple easy-to-find dragon friends, and a denser set of normal/armored/giant enemies. Enemies can be replayed with a clearly labelled reset-enemies action without erasing collected treasure or dragon rescues. Friendly play is the default: damage knocks health down but recovery returns locally and restores it; no lives, game over or travel gate. Existing attack distinctions remain readable.

Travel uses a world picker with large accessible destination cards, also available near portals. Changing worlds saves progress, clears held controls and transient effects, resets the fixed clock and camera, and loads only the chosen world's scene. Scene resources are disposed without disposing shared character textures/geometries. Each world's progress persists independently in a versioned campaign save. The old single-world save is migrated once to equivalent first-world collectible/rescue identifiers where possible; corrupt data is discarded safely. Resuming returns to the last ground land; flight attempts restart safely.

## Flight

Sunny Flight is a separate full-flight simulation, not ordinary glide with weaker gravity. Automatic forward motion, bounded yaw and pitch, banking and an automatic follow camera. A centred stick holds heading and altitude. Touch/keyboard default to push up to climb; a visible inversion option provides the classic aircraft-style pull-back-to-climb alternative. Flame remains the same action. Jump becomes a visual loop; charge becomes a forgiving speed boost. Camera recenter remains available. Loop and turnaround actions are available on large touch buttons and R1/L1; speed boost is an accessibility adaptation, not a claim about the original Square button.

Four groups of eight targets: arches to fly through, chests to flame, barrels on moving trains to flame, and moving planes to flame. Generous target hitboxes and a forgiving recovery envelope let children practise. Practice has no countdown or health loss. An optional timed challenge starts with a generous clock, adds time per target, has a clean success/failure result and instant retry. A failed or finished flight never contaminates a new attempt. Best completed time is saved, and progress remains separate from ground gems and enemies.

## Engineering boundaries

- World definitions are plain data, independent of rendering.
- Existing ground Simulation remains reusable; bounded ground areas opt into containment through level data.
- Campaign owns selected land, per-land progress and safe transitions.
- FlightSimulation owns 3D movement, target tests, time and attempt results.
- Ground and flight scene builders implement the renderer's world adapter, with explicit disposal ownership.
- HUD, world picker and flight instructions reflect the current activity. No implementation terms appear in player flows.

## Verification

Test full-speed charges in every direction, boundary corners, jump/glide at boundaries, reachable ground objectives, per-land independence, old/corrupt saves, input clearing during travel, flight steering/inversion, swept target crossings, flame cones, moving targets, timer pause/retry/completion, and best-time persistence. Browser checks cover actual phone touch walking/charging and release, switching all destinations, flight climb/turn/fire/boost, pause, retries, portrait/landscape and rendered performance. Keep tests for the former island world as a legacy fixture where they still exercise the unchanged terrain engine, while testing the new default worlds directly.
