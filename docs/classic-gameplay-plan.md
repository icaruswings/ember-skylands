# Classic dragon adventure pass

The user wants the familiar feel of Spyro: purple dragon, low trailing camera,
red gems in the grass, green treasure in chests and enemy sacks, fleeing Gnorcs,
petrified dragon friends who release automatically, and fire that singes lush grass.
Keep phone fullscreen, touch controls, safe saves and the engine boundaries.

Implement treasure as simulation-owned gem records. Ground gems start active;
chest/enemy gems activate only after their source breaks. Pull nearby active gems
toward the player without crossing large height differences. Persist broken chests
alongside defeated enemies; older saves remain valid. Both flame and charge break
wooden chests. Fleeing enemies remain on walkable terrain and carry green treasure.

The camera trails at dragon height and follows heading along the shortest angle.
Camera-relative controls retain forward movement and manual orbit temporarily
overrides automatic tracking. Probe solid scenery to keep the camera out of walls.

Replace crystal cages with emerald dragon statues. Proximity heals, checkpoints
and releases once; the friend dances while the game keeps running. A short toast
replaces the blocking dialogue. Portal use remains an explicit action.

Render curved instanced grass with wind, root-to-tip color, deterministic placement
that avoids paths/ponds/buildings, and spatially indexed burn state. Fire shortens
affected blades and darkens their tips, with bounded, faded ground scorch marks.
Pause freezes wind/burning/rescue celebration. Share buffers and materials.

Research reference silhouettes and build the purple dragon and organic green
Gnorcs from authored geometry, rather than importing unverified game extractions.
Record reference sources, art provenance and the limits of this recreation.

Validation: test treasure gating, attraction, attack range, save restoration,
flee terrain safety, automatic rescue idempotence, camera alignment/orbit/wrap,
grass burn direction and persistence. Browser checks cover live interactions,
GLSL compilation, pause, save reload, desktop and emulated phone controls.

This pass recreates these mechanics in the existing three-zone adventure. It does
not claim to reproduce every level, script, animation or audio track of the retail game.
