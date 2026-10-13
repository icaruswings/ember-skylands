# Character and exploration upgrade

The approved next round addresses the remaining gaps in compact character proportions, expressive movement, enemy personality and deliberate exploration spaces. It extends the existing browser game and its authored GLB pipeline; existing saves, main objectives and touch controls remain compatible.

## Character and motion

Compact broad head, recessed expressive eyes, shorter neck, gold wing supports and finer skin relief. Independent jaw/eye joints support breath and blinking. Idle, gallop, charge, airborne and glide poses use real simulation state; pause freezes active adventure animation. The dragonfly becomes a recognizable four-winged companion with health color and smooth following.

## Playable spaces

A two-ramp watchtower ascent leads to a raised launch terrace. The player jumps and glides across a gap to a hidden garden, finds additional red treasure and a chest, and takes a one-way footbridge back. Existing main bridges and three dragon rescues remain reachable. New treasure is optional and uses new save identifiers. Height-aware floor queries stop the player snapping onto raised platforms from below.

## Enemy personality

Sack carriers flee and look back while running. Giants approach, visibly wind up, strike, then recover. Flame can interrupt the windup; retreating or gliding avoids the strike. Movement stays bounded and terrain-safe.

## Verification

Behavior tests cover raised-platform landing, ground under platforms, route traversal from spawn without teleporting, optional treasure/save compatibility, giant windup/interruption/recovery, animation resets and companion health. Rebuild and parse all four GLBs, inspect real close-ups, run desktop and phone real-input browser flows plus persistence/fullscreen regressions, review the final changes, then push the same source commit to GitHub and Sites. Preserve the current public Sites audience.

This completes the specified upgrade round. It continues an authored small dragon adventure and does not claim the entire retail Spyro campaign or exact map reproduction.
