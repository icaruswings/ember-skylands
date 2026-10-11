# Spyro reference notes

The character and gameplay images below were downloaded to temporary reference files and visually inspected during this pass. They guide newly authored geometry and mechanics; the reference image files and third-party game models are not included in the repository.

## Visual references

- [Spyro character overview](<https://en.wikipedia.org/wiki/Spyro_(character)>), with the [character image](https://upload.wikimedia.org/wikipedia/en/5/53/Spyro.png). The inspected image shows a purple quadruped with a broad muzzle, large white eyes, thick swept golden horns, yellow segmented throat/belly plates, orange wing membranes with golden supports, a long tapered tail and pronounced dorsal fins. The horns are a major silhouette feature and extend well above the head. This image represents a later character rendering rather than an exact PlayStation mesh.
- [Spyro the Dragon overview](https://en.wikipedia.org/wiki/Spyro_the_Dragon), with the [original PlayStation gameplay screenshot](https://upload.wikimedia.org/wikipedia/en/4/42/Spyro_ingame_psx.jpg). The screenshot shows a low camera directly behind Spyro, a wide green lawn, warm pink/gold castle walls and arches, and a squat olive-green Gnorc carrying a large brown sack near a gateway. The enemy has a substantial nose, short limbs and a gold/brown garment; it has an organic silhouette rather than block-shaped armor. Sparx floats beside Spyro. The low-resolution lawn in this original screenshot is a painted surface, so dense individual blades and dynamic singeing are modern embellishments.

## Gameplay reference and requested interpretation

The game overview describes flame breath, charging, jumping/gliding, collectible treasure, imprisoned dragons and Sparx. Treasure comes from the environment, containers and defeated enemies. Dragons are released by reaching their petrified forms. Sparx reflects health and helps retrieve nearby treasure. The original game also allows camera movement; the current implementation uses a low following camera with smooth heading changes for touch play.

The requested interpretation adds red loose gems, green treasure released from smashable chests or fleeing sack carriers, generous gem attraction, proximity rescue and a short freedom celebration. Flame-singed grass is an additional interactive detail. These should be evaluated as implemented behaviors rather than claims that every detail matches every original level.

## Authored assets in this pass

`dist/game/characters.js` constructs the models from cached UV-mapped lofts, continuous curved tapers and small rounded forms. The dragon retains independently animated torso, head, four legs, tail and two wings. Gnorc variants replace the former blocky golems with a round cloth-covered belly, green head, broad nose, pointed ears, tusks, curved arms, rounded boots and a shoulder sack. Their `userData` exposes `legs`, `head` and `sack` so the renderer can animate a running gait and sack sway. The armor variant adds a curved helmet and shoulder pieces; the giant uses a larger root scale.

`dist/game/surfaces.js` includes a woven neutral cloth texture for tinting tunics and sacks. Every surface material records `userData.surfaceKind` and `userData.tint` for the GLB export/loading pipeline. Models use artist-built geometry and locally produced textures; no ripped model files were used.

The authored geometry contains 11,828 triangles/25 material meshes for the dragon, 5,816/13 for the normal and giant Gnorcs, and 6,362/15 for the armored Gnorc. Final polish shortens the muzzle, enlarges the swept golden horns, adds subtle horn bands and gives Gnorc skin a mottled surface separate from dragon scales. Geometry, UV seams, pupil visibility and rig joints have automated coverage; browser results are recorded in the verification report.
