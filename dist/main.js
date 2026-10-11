import { Simulation, FixedClock, ScriptSystem } from './engine/simulation.js';
import { GameRenderer } from './engine/renderer.js';
import { Input } from './engine/input.js';
import { AudioEngine } from './engine/audio.js';
import { enterFullscreen, protectGameGestures } from './engine/display.js';
import { readSave, writeSave, clearSave, readSettings, writeSettings } from './engine/storage.js';
import { LEVEL } from './game/level.js';
import { loadArtTextures } from './game/surfaces.js';
import { loadModelFiles } from './engine/models.js';
const $ = (id) => document.getElementById(id),
  icon = (id) => `<svg><use href="#i-${id}"/></svg>`;
let sim = new Simulation(LEVEL, readSave()),
  mode = 'intro',
  dialogReturn = 'intro',
  previousFocus = null,
  toastTimer = 0,
  saveWarning = false,
  render = null;
const clock = new FixedClock(),
  audio = new AudioEngine(),
  settings = {
    sound: true,
    quality: matchMedia('(pointer:coarse)').matches ? 'low' : 'high',
    ...readSettings(),
  };
audio.setEnabled(settings.sound !== false);
const input = new Input($('game'));
protectGameGestures($('stage'));
let scriptSystem;
function scripts() {
  scriptSystem = new ScriptSystem([
    {
      id: 'welcome',
      when: (s) => s.rescued.size === 1,
      run: () => {},
    },
    {
      id: 'unlocked',
      when: (s) => s.unlocked,
      run: () => toast('The castle portal is open! Return to the castle.'),
    },
  ]);
}
scripts();
function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 4200);
}
function save() {
  if (!writeSave(sim.save()) && !saveWarning) {
    saveWarning = true;
    toast('Saving is unavailable in this browser. You can keep playing this session.');
    $('save-status').textContent = '● Playing without local saves';
  }
}
function setMode(next) {
  mode = next;
  $('stage').classList.toggle('intro-scene', next === 'intro');
  input.clear();
  clock.reset();
  input.lookEnabled = next === 'playing';
  audio.pause(next !== 'playing');
  $('intro').classList.toggle('hidden', next !== 'intro');
  $('playing-ui').classList.toggle('hidden', next === 'intro');
  $('adventure-tab').classList.toggle('active', next !== 'dialog');
}
function start() {
  if (!render) return;
  if (matchMedia('(pointer: coarse), (max-width: 700px)').matches) {
    void enterFullscreen($('stage'));
  }
  setMode('playing');
  audio.start();
  toast(
    sim.collected.size
      ? 'Welcome back, little dragon. Your adventure continues.'
      : 'Follow the red gems. Break chests, chase Gnorcs, and free the stone dragons.',
  );
}
function openDialog(content) {
  previousFocus = document.activeElement;
  dialogReturn = mode === 'dialog' ? dialogReturn : mode;
  setMode('dialog');
  $('dialog-content').innerHTML = content;
  $('dialog-layer').classList.remove('hidden');
  $('dialog-close').focus();
}
function closeDialog() {
  if (mode !== 'dialog') return;
  $('dialog-layer').classList.add('hidden');
  setMode(dialogReturn);
  if (previousFocus?.isConnected) previousFocus.focus();
}
function guide() {
  openDialog(
    `<span class="dialog-eyebrow">THE EXPLORER’S COMPANION</span><h2 id="dialog-title">A little field guide.</h2><p>You’re Ember, a curious young dragon. The dragon kingdom has lost its light. Free Sol, Fern and Luma from their emerald statues, gather 30 gems, and return to the castle portal.</p><div class="guide-grid"><div class="guide-item"><strong>Find your feet</strong><p>Use <kbd>W A S D</kbd>, arrows, the touch stick or gamepad to move. Drag the scenery to look around.</p></div><div class="guide-item"><strong>Spread your wings</strong><p>Press <kbd>SPACE</kbd> or Jump once to leap, then again in the air to glide. Tap again to fold your wings.</p></div><div class="guide-item"><strong>A little firepower</strong><p><kbd>F</kbd> breathes flame. Hold <kbd>SHIFT</kbd> to charge. Armored Gnorcs need a charge; large ones need flame. Flame or charge wooden chests for green treasure.</p></div><div class="guide-item"><strong>Make a new friend</strong><p>Walk close to a stone dragon and watch them break free and dance. Each rescue heals you and sets a checkpoint.</p></div></div><p>Cross the wooden bridges to Willow Hollow and Dragon Heights. Red gems pull toward you. Chase the sack-carrying Gnorcs for green gems. If you fall, you return safely to your last checkpoint. Gamepad: A jump, X flame, B charge, Y portal.</p><button id="guide-done" class="primary-button">Got it. Let’s wander ${icon('arrow')}</button>`,
  );
  $('guide-done').onclick = closeDialog;
}
function openSettings() {
  openDialog(
    `<span class="dialog-eyebrow">MAKE YOURSELF AT HOME</span><h2 id="dialog-title">Your adventure, your way.</h2><div class="settings-row"><span>Music & sound<small>An original, gentle Skylands soundtrack</small></span><button id="audio-toggle" class="toggle" role="switch" aria-label="Music and sound" aria-checked="${audio.enabled}"></button></div><div class="settings-row"><span>Visual quality<small>Balanced keeps things light on phones</small></span><select id="quality-select" aria-label="Visual quality"><option value="high" ${settings.quality === 'high' ? 'selected' : ''}>Rich · shadows</option><option value="low" ${settings.quality === 'low' ? 'selected' : ''}>Balanced · mobile</option></select></div><div class="settings-row"><span>Saved adventure<small>${sim.collected.size} gems · ${sim.rescued.size} spirits · stored on this device</small></span><button id="reset-button" class="text-button">Start fresh</button></div><p>Landscape gives you more room to explore on a phone. Sound begins when you start playing. Your progress stays in this browser.</p><button id="settings-done" class="primary-button">Back to the Skylands ${icon('arrow')}</button>`,
  );
  $('audio-toggle').onclick = () => {
    toggleSound();
    $('audio-toggle').setAttribute('aria-checked', audio.enabled);
  };
  $('quality-select').onchange = (e) => {
    settings.quality = e.target.value;
    render.setQuality(settings.quality);
    writeSettings(settings);
  };
  $('settings-done').onclick = closeDialog;
  $('reset-button').onclick = () => {
    openDialog(
      `<span class="dialog-eyebrow">A NEW BEGINNING</span><h2 id="dialog-title">Start a fresh adventure?</h2><p>This clears the gems, chests, dragon friends and Gnorcs saved on this device.</p><div class="dialog-actions"><button id="confirm-reset" class="primary-button">Start fresh</button><button id="cancel-reset" class="secondary-button">Keep my adventure</button></div>`,
    );
    $('cancel-reset').onclick = openSettings;
    $('confirm-reset').onclick = () => {
      clearSave();
      sim = new Simulation(LEVEL);
      render.resetAdventure();
      scripts();
      dialogReturn = 'intro';
      $('start-button').innerHTML = `Let’s explore ${icon('arrow')}`;
      $('continue-note').textContent = 'Made for your browser. Built for adventure.';
      closeDialog();
      updateHUD();
    };
  };
}
function toggleSound() {
  settings.sound = !audio.enabled;
  audio.setEnabled(settings.sound);
  writeSettings(settings);
  $('sound-button').classList.toggle('muted', !settings.sound);
  $('sound-button').setAttribute('aria-label', settings.sound ? 'Turn sound off' : 'Turn sound on');
  $('sound-button').setAttribute('aria-pressed', settings.sound);
  if (settings.sound && mode === 'playing') audio.start();
}
function pause() {
  if (mode === 'intro') return;
  if (mode === 'dialog') {
    closeDialog();
    return;
  }
  openDialog(
    `<span class="dialog-eyebrow">TAKE A LITTLE BREATHER</span><h2 id="dialog-title">The Skylands can wait.</h2><p>Your adventure is saved. Ready when you are.</p><div class="dialog-actions"><button id="resume-button" class="primary-button">Keep exploring ${icon('arrow')}</button><button id="pause-guide" class="secondary-button">Field guide</button><button id="pause-settings" class="secondary-button">Settings</button></div>`,
  );
  $('resume-button').onclick = closeDialog;
  $('pause-guide').onclick = guide;
  $('pause-settings').onclick = openSettings;
  save();
}
function drawMap(canvas, big = false) {
  const c = canvas.getContext('2d'),
    w = canvas.width,
    h = canvas.height,
    scale = big ? 3.5 : 1.38,
    ox = w * 0.51,
    oy = h * 0.73;
  c.clearRect(0, 0, w, h);
  const pos = (x, z) => [ox + x * scale, oy + z * scale * 0.83];
  c.strokeStyle = '#bfa575';
  c.lineWidth = big ? 9 : 4;
  for (const b of LEVEL.bridges) {
    c.beginPath();
    c.moveTo(...pos(b.ax, b.az));
    c.lineTo(...pos(b.bx, b.bz));
    c.stroke();
  }
  for (const island of LEVEL.islands) {
    const [x, z] = pos(island.x, island.z);
    c.fillStyle = island.id === 'crown' ? '#c1ceb0' : '#c3d59f';
    c.beginPath();
    c.ellipse(x, z, island.r * scale, island.r * scale * 0.83, 0, 0, 7);
    c.fill();
    c.strokeStyle = '#a5b889';
    c.lineWidth = 1;
    c.stroke();
    if (big) {
      c.fillStyle = '#5d7653';
      c.font = '12px Georgia';
      c.textAlign = 'center';
      c.fillText(island.name, x, z + island.r * scale * 0.55);
    }
  }
  for (const g of sim.gems)
    if (g.active && !sim.collected.has(g.id)) {
      const [x, z] = pos(g.x, g.z);
      c.fillStyle = g.source ? '#39a657' : '#d44b55';
      c.fillRect(x - 1, z - 1, big ? 3 : 1.5, big ? 3 : 1.5);
    }
  for (const r of LEVEL.rescues) {
    const [x, z] = pos(r.x, r.z);
    c.fillStyle = sim.rescued.has(r.id) ? '#749865' : '#a977ab';
    c.beginPath();
    c.arc(x, z, big ? 5 : 3, 0, 7);
    c.fill();
    if (big) {
      c.fillStyle = '#697353';
      c.font = '10px Arial';
      c.fillText(r.name, x, z - 10);
    }
  }
  const [gx, gz] = pos(LEVEL.portal.x, LEVEL.portal.z);
  c.strokeStyle = sim.unlocked ? '#497f6b' : '#909b83';
  c.lineWidth = 2;
  c.strokeRect(gx - 3, gz - 3, 6, 6);
  const [px, pz] = pos(sim.player.x, sim.player.z);
  c.save();
  c.translate(px, pz);
  c.rotate(-sim.player.angle);
  c.fillStyle = '#8651ba';
  c.beginPath();
  c.moveTo(0, 6);
  c.lineTo(-4, -4);
  c.lineTo(4, -4);
  c.closePath();
  c.fill();
  c.restore();
}
function map() {
  openDialog(
    `<span class="dialog-eyebrow">FOLLOW YOUR CURIOSITY</span><h2 id="dialog-title">The Skylands.</h2><canvas id="big-map" class="big-map" width="600" height="340" aria-label="Map of three islands and your position"></canvas>${LEVEL.islands.map((island, i) => `<div class="realm-row"><strong>${island.name}</strong><span>${LEVEL.gems.filter((g) => g.zone === island.id && sim.collected.has(g.id)).length} / ${LEVEL.gems.filter((g) => g.zone === island.id).length} gems</span><em>${sim.rescued.has(LEVEL.rescues[i].id) ? 'Spirit freed' : 'Find ' + LEVEL.rescues[i].name}</em></div>`).join('')}<p>Purple arrow: you · emerald dots: dragon friends · red/green dots: gems · square: home portal</p><button id="map-done" class="primary-button">Back to exploring ${icon('arrow')}</button>`,
  );
  drawMap($('big-map'), true);
  $('map-done').onclick = closeDialog;
}
function events() {
  for (const e of sim.drain()) {
    audio.effect(e.type, e.x ? (e.x - sim.player.x) / 12 : 0);
    if (['gem', 'enemy', 'rescue', 'chest'].includes(e.type)) {
      render.burst(e);
      save();
    }
    if (e.type === 'rescue') toast(`${e.name} is free! ${e.message} Checkpoint saved.`);
    if (e.type === 'locked')
      toast(
        `The portal needs ${Math.max(0, 3 - sim.rescued.size)} more spirits and ${Math.max(0, 30 - sim.collected.size)} more gems.`,
      );
    if (e.type === 'respawn') toast('A soft landing. Back at your last checkpoint.');
    if (e.type === 'complete') {
      save();
      openDialog(
        `<span class="dialog-eyebrow">THE SKYLANDS SHINE AGAIN</span><h2 id="dialog-title">Little dragon. Big hero.</h2><p>Sol, Fern and Luma are free. The kingdom’s light has returned, and the way home is open. There’s always a little more wonder to find.</p><div class="results"><div><strong>${sim.collected.size} / ${LEVEL.gems.length}</strong><span>GEMS DISCOVERED</span></div><div><strong>3 / 3</strong><span>SPIRITS FREED</span></div><div><strong>${sim.defeated.size} / 6</strong><span>GNORCS</span></div></div><button id="win-continue" class="primary-button">Keep discovering ${icon('arrow')}</button>`,
      );
      $('win-continue').onclick = closeDialog;
    }
  }
}
function updateHUD() {
  const p = sim.player;
  $('gem-count').textContent = sim.collected.size;
  $('gem-total').textContent = '/ ' + LEVEL.gems.length;
  $('rescue-count').textContent = sim.rescued.size;
  $('health').setAttribute('aria-label', `${p.health} health`);
  [...$('health').children].forEach((e, i) => e.classList.toggle('lost', i >= p.health));
  const island = LEVEL.islands.find((i) => Math.hypot(p.x - i.x, p.z - i.z) < i.r);
  if (island) $('zone-name').textContent = island.name;
  $('quest-progress').style.width =
    `${Math.min(100, (Math.min(sim.collected.size, 30) / 30 + sim.rescued.size / 3) * 50)}%`;
  $('quest-title').textContent = sim.complete
    ? 'A world worth wandering'
    : sim.unlocked
      ? 'The way home is open'
      : 'Bring the Skylands back to life';
  $('quest-copy').textContent = sim.complete
    ? 'Find every gem. Follow every possibility.'
    : sim.unlocked
      ? 'Return to the portal at the meadow castle.'
      : `Free ${3 - sim.rescued.size} dragon friends · Find ${Math.max(0, 30 - sim.collected.size)} more gems`;
  const near = sim.nearestInteraction();
  $('interaction-prompt').classList.toggle('hidden', !near);
  $('interaction-prompt').innerHTML = near
    ? `${matchMedia('(pointer:coarse)').matches ? 'Tap' : 'Press <kbd>E</kbd> to'} ${near.portal ? (sim.unlocked ? 'journey home' : 'visit the portal') : 'free ' + near.name}`
    : '';
  const tb = document.querySelector('[data-action="interact"]');
  tb.classList.toggle('hidden', !near);
  tb.querySelector('span').textContent = near?.portal ? 'Portal' : 'Rescue';
  drawMap($('minimap'));
}
$('start-button').onclick = start;
$('guide-tab').onclick = guide;
$('settings-button').onclick = openSettings;
$('mobile-settings-button').onclick = openSettings;
$('sound-button').onclick = toggleSound;
$('pause-button').onclick = pause;
$('map-button').onclick = map;
$('dialog-close').onclick = closeDialog;
$('interaction-prompt').onclick = () => {
  if (mode === 'playing') {
    sim.interact();
    events();
    updateHUD();
  }
};
$('adventure-tab').onclick = () => {
  if (mode === 'dialog') closeDialog();
};
$('fullscreen-button').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (!(await enterFullscreen($('stage')))) {
      toast('For a bigger view, turn your phone to landscape.');
    }
  } catch {
    toast('Fullscreen is unavailable. Try landscape orientation.');
  }
};
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Escape') {
    e.preventDefault();
    pause();
  }
  if (e.code === 'KeyM' && mode === 'playing') map();
  if (e.code === 'Tab' && mode === 'dialog') {
    const elements = [...$('dialog').querySelectorAll('button,select,a,[tabindex="0"]')].filter(
      (e) => !e.disabled,
    );
    const first = elements[0],
      last = elements.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'playing') pause();
});
document.addEventListener('game-context-lost', () => {
  if (mode === 'playing') pause();
  toast('The graphics context paused. Refresh if the scene does not recover.');
});
if (sim.collected.size || sim.rescued.size) {
  $('start-button').innerHTML = `Continue adventure ${icon('arrow')}`;
  $('continue-note').textContent =
    `Your adventure is saved · ${sim.collected.size} gems discovered`;
}
if (!audio.enabled) {
  $('sound-button').classList.add('muted');
  $('sound-button').setAttribute('aria-label', 'Turn sound on');
  $('sound-button').setAttribute('aria-pressed', 'false');
}
try {
  await loadArtTextures();
  await loadModelFiles();
  render = new GameRenderer($('game'));
  render.setQuality(settings.quality === 'low' ? 'low' : 'high');
  $('loading').classList.add('hidden');
  updateHUD();
  let last = performance.now(),
    hudTime = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (mode === 'playing') {
      clock.advance(dt, (step) => sim.update(step, input.sample(render.angle)));
      scriptSystem.update(sim);
      events();
      audio.update();
    }
    const orbit = input.orbit;
    input.orbit = 0;
    render.update(dt, sim, mode !== 'intro', mode === 'playing' ? orbit : 0, mode === 'playing');
    hudTime += dt;
    if (hudTime > 0.12) {
      updateHUD();
      hudTime = 0;
    }
  }
  requestAnimationFrame(frame);
  // Read-only diagnostics are useful to hosts and performance tooling.
  window.ember = Object.freeze({
    snapshot: () => ({
      mode,
      fireActive: render.fire.root.visible,
      fireParticles: render.fire.pool.activeCount,
      player: { ...sim.player },
      gems: sim.collected.size,
      rescues: sim.rescued.size,
      enemies: sim.defeated.size,
      chests: sim.broken.size,
      activeGems: sim.gems.filter((g) => g.active && !sim.collected.has(g.id)).length,
      singedGrass: render.world.grassSystem.field.burn.reduce((n, b) => n + (b > 0 ? 1 : 0), 0),
      camera: {
        x: render.camera.position.x,
        y: render.camera.position.y,
        z: render.camera.position.z,
        angle: render.angle,
      },
      complete: sim.complete,
      unlocked: sim.unlocked,
      quality: render.quality,
      drawCalls: render.renderer.info.render.calls,
      triangles: render.renderer.info.render.triangles,
      audioState: audio.ctx?.state || 'not-started',
    }),
  });
} catch (error) {
  console.error(error);
  $('loading').innerHTML =
    '<div class="error-message"><h2>The Skylands need WebGL.</h2><p>Try a current Chrome, Safari, Firefox or Edge browser with graphics acceleration enabled.</p><button class="primary-button" onclick="location.reload()">Try again</button></div>';
}
