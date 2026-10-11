# Ember implementation plan

Goal: Ship one complete original 3D browser dragon adventure on Sites, backed up to public GitHub.
Architecture: Deterministic simulation plus renderer adapter, procedural assets and declarative content. Native implementation in this session, as authorized by the autonomous brief.

1. Write failing simulation tests: movement, jump/glide, attacks, damage, save and win rules. Implement simulation, event scripts and storage. Run node test suite.
2. Build original textures and model factories, three connected zones, camera, lighting, water and particles. Build input adapters and gesture-gated audio.
3. Connect the presentation, HUD, journal/map, settings, touch controls and complete start-to-win flow.
4. Test in real Chromium at desktop and mobile viewports; fix observed issues. Run full suite and source checks, document actual results.
5. Commit/push to public GitHub and Sites source repository, package static build, deploy through Sites and confirm success.

Review focus: unsupported GPU, focus loss while charging, multi-touch release, corrupted or disabled local storage, large frame delta after tab suspension. No backend or analytics required.
