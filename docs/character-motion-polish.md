# Character and movement polish — 2026-10-17

Base: 0cd118e26998168268836294b4fe7c43f8ffbc27. Branch: character-motion-polish.

The user selected character art, object skins and movement as the next priority, then explicitly requested denser models because polygon edges looked rough. This is a bounded pass on the existing geometry/material/animation and locomotion systems. The wide rolling valleys, forgiving boundaries, travel, saves and flight rules remain the current campaign design. The user's standing autonomy covers implementation and saving to GitHub; updated screenshots are required for visual approval before completion.

## Changes

- Denser rounded facial details, horns, skulls, torsos, limbs and feet. The dragon is slimmer with swept horns and wings tucked on the ground; armored Gnorcs have a fitted breastplate and brighter steel. Giants have a broader silhouette.
- Indexed material batches preserve UV seams and transform rigs while reducing GLB size. Current dragon: 25,680 triangles / 688,664 bytes; normal/giant Gnorc: 15,376 triangles / about 397 KB; armored Gnorc: 19,128 triangles / 490,608 bytes. Caps: 26,000 dragon triangles, 20,000 per Gnorc, under 2 MB per model. The rendering budget is 400,000 visible triangles / 450 calls in the existing phone scenarios. Physical-device frame rate remains unmeasured.
- A newly image-generated 1254 × 1254 prop atlas provides four independently extracted 627px swatches: limestone, wood, slate and steel. Each has a bounded 512px derived relief normal map. Shared assets survive scene changes. Painted chests, castle masonry and roofs now use these materials; UV density follows scenery dimensions instead of stretching over an entire wall.
- Fine dragon scales have richer color and restrained relief. Steel and skin have revised material response; existing generated bark, foliage and membrane maps remain.
- Tap for a shorter hop; hold for the original full jump. A queued tap that ends between frames still makes the short hop. An 80 ms ledge grace period and 100 ms landing-jump buffer make timing forgiving. A second airborne tap still toggles glide.
- Charge steering uses a slightly tighter bounded turn and eases speed through sharp corners. Actual distance drives the gallop. Charge/glide poses ease, the body banks into turns, the tail counters the turn, and landings add a small compression. Input-release ownership is unchanged.

## Verification

Regression tests were observed failing before implementing the corresponding changes. The existing suite passes after updating the explicitly requested high-definition model budgets. New checks cover rounded silhouettes, tucked wings, visible breastplate coverage, painted chest materials, indexed vertex cost, consistent masonry UV scale, stride, turn lean, variable jump height, queued taps, landing buffers, ledge grace, glide toggles and charge corners.

The bounded independent asset review identified a glide-entry wing snap: the interpolation used the grounded fold angle after an airborne pose. A regression reproduced it, the airborne baseline now drives the transition, and the reviewer verified the fix. GLBs match procedural source exports; no remaining actionable asset findings.

The six-switch phone campaign integration passes all four destinations, multitouch release, flight controls/pause/retry/timer, save/reload and portrait layout, with stable geometry/texture counts and zero page errors. Dedicated movement touch checks, the release regression and final artwork close-ups are in progress. Initial rendered Artisans view: 332,930 triangles / 213 calls; Peace Keepers: 293,144 / 206. The user explicitly requested publication after testing, followed by a separate layout/exploration/secrets pass. Publication is authorized once the remaining tests pass.
