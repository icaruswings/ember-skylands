# Distinct land layouts and optional secrets

The polish release is live as Sites version 9, commit 4b7549eba64fcb101acfd89ae0e44ea1edab17b3, deployment appgdep_6ad37c9d21ac8191853fdffeb574928f. It was published before this separate layout pass as requested.

Goal: each existing ground land gets a distinct layout, wide exploration loop, changed objective positions, landmarks and two optional treasure discoveries. Preserve the forgiving rolling ground, safe boundaries, all-open travel and current art/movement. No mandatory precision jumps, narrow ramps or secret rescue requirements.

Artisans: a garden circuit connecting meadow, orchard, castle court and waterfall trail; optional Waterfall Grotto and Orchard Cache. Peace Keepers: a fort/canyon figure-eight with a training field and camp; optional Canyon Cache and Camp Stores. Magic Crafters: a winding crystal valley circuit with a central shortcut and gentle overlook; optional Frozen Observatory and Moonstone Overlook.

Each land uses authored data for its main route, unique hills, spawn, chests, enemies, friends, portals and regions. All 76 existing gem identifiers, eight chest identifiers, twelve enemy identifiers and three friend identifiers remain valid. Two new treasure pockets add four loose gems and one two-gem chest each, making 88 gems/10 chests. Existing progress survives; new secrets have fresh rewards even on old complete saves.

Discovery is saved as an additive per-land secrets list with validation; older saves default it to empty. Discovery is a one-time toast and optional counter. Main completion remains 30 gems/three friends and never depends on secrets. Each grotto has a wide open entrance and three visible matching collision walls; the second pocket is an open grove/camp/overlook. No invisible obstacles or lethal water.

Verification: distinct data signatures; widths >=6; slope/height/contact checks; movement-driven traversal of every main loop and secret entrance without teleporting; objective/collider clearance; one-time discovery and save/old-save validation; existing suite; repeated actual phone travel/input/resource checks; real screenshots of each destination for the user's visual approval. Layout publication remains pending that requested review.
