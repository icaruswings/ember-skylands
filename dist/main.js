import { FixedClock, ScriptSystem } from './engine/simulation.js';
import { Campaign } from './engine/campaign.js';
import { GameRenderer } from './engine/renderer.js';
import { Input } from './engine/input.js';
import { AudioEngine } from './engine/audio.js';
import { enterFullscreen, protectGameGestures } from './engine/display.js';
import { readSave, writeSave, clearSave, readSettings, writeSettings } from './engine/storage.js';
import { LANDS } from './game/lands.js';
import { FLIGHT_COURSE } from './game/flight-course.js';
import { drawWorldMap } from './ui/world-map.js';
import { loadArtTextures } from './game/surfaces.js';
import { loadModelFiles } from './engine/models.js';
const $ = (id) => document.getElementById(id),
  icon = (id) => `<svg><use href="#i-${id}"/></svg>`;
let campaign = new Campaign(readSave()),
  sim = campaign.simulation,
  mode = 'intro',
  dialogReturn = 'intro',
  previousFocus = null,
  render = null,
  toastTimer = 0,
  saveWarning = false,
  scriptSystem;
const clock = new FixedClock(),
  audio = new AudioEngine(),
  input = new Input($('game'));
const settings = {
  sound: true,
  quality: matchMedia('(pointer:coarse)').matches ? 'low' : 'high',
  flightInverted: false,
  ...readSettings(),
};
audio.setEnabled(settings.sound !== false);
input.enabled = false;
protectGameGestures($('stage'));
const flight = () => sim.level.kind === 'flight';
const seconds = (value) =>
  `${Math.floor(Math.max(0, value) / 60)}:${String(Math.floor(Math.max(0, value) % 60)).padStart(2, '0')}`;
function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 4200);
}
function save() {
  if (!writeSave(campaign.save()) && !saveWarning) {
    saveWarning = true;
    toast('Saving is unavailable. You can keep playing this session.');
    $('save-status').textContent = '● Playing without local saves';
  }
}
function scripts() {
  scriptSystem = new ScriptSystem([
    {
      id: 'all-enemies',
      when: (s) => !flight() && s.defeated.size === s.level.enemies.length,
      run: () => toast('Every Gnorc here is defeated! Open Worlds to play them again.'),
    },
    {
      id: 'land-complete',
      when: (s) => !flight() && s.unlocked && !s.complete,
      run: (s) => {
        s.complete = true;
        save();
        toast(`${s.level.name} explored! Every other world is open too.`);
      },
    },
  ]);
}
scripts();
function setMode(next) {
  mode = next;
  input.clear();
  input.enabled = next === 'playing';
  input.lookEnabled = next === 'playing';
  clock.reset();
  audio.pause(next !== 'playing');
  $('stage').classList.toggle('intro-scene', next === 'intro');
  $('intro').classList.toggle('hidden', next !== 'intro');
  $('playing-ui').classList.toggle('hidden', next === 'intro');
  $('adventure-tab').classList.toggle('active', next !== 'dialog');
}
function start() {
  if (!render) return;
  if (matchMedia('(pointer:coarse),(max-width:700px)').matches) void enterFullscreen($('stage'));
  setMode('playing');
  audio.start();
  toast('Wide open lands. Charge, breathe fire, and explore. Every world is open.');
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
function enterLand(id, options = {}) {
  if (!render) return;
  const previous = campaign.landId;
  input.clear();
  clock.reset();
  campaign.travel(id, { inverted: !!settings.flightInverted, ...options });
  sim = campaign.simulation;
  if (previous === id) render.resetAdventure();
  else render.loadLevel(sim.level);
  scripts();
  $('dialog-layer').classList.add('hidden');
  setMode('playing');
  audio.start();
  save();
  updateHUD();
  toast(
    flight()
      ? `${sim.timed ? 'Timed challenge' : 'Practice flight'} · stick to turn and climb · flame the targets.`
      : `${sim.level.name} · room to charge. Open Worlds whenever you want to travel.`,
  );
}
function retryFlight() {
  if (flight()) enterLand('sunny-flight', { timed: sim.timed });
}
function guide() {
  openDialog(
    `<span class="dialog-eyebrow">THE EXPLORER’S COMPANION</span><h2 id="dialog-title">Room to be a dragon.</h2><p>Run through the castle gardens of Artisans, the desert forts of Peace Keepers and the crystal valley of Magic Crafters. Broad paths and enclosing walls keep the adventure on solid ground. Every destination is open from the start.</p><div class="guide-grid"><div class="guide-item"><strong>Run and charge</strong><p>Use WASD, arrows, the touch stick or a gamepad. Hold Shift / Charge / Square to run with your horns down. Release it before a tight turn. Drag the scenery to look, or press C to recenter.</p></div><div class="guide-item"><strong>Fight and explore</strong><p>F / Flame / Circle breathes fire. Charge armored Gnorcs; flame the big ones. Break wooden chests for treasure. Walk close to a stone dragon to free a friend and heal. Worlds lets you replay the bad guys without erasing treasure.</p></div><div class="guide-item"><strong>Spread your wings</strong><p>On land, Space / Jump / Cross jumps, then opens or folds your glide. In Sunny Flight you fly automatically. The stick turns and climbs; Flame breaks targets. Loop does a flip; Turn brings you around. Boost gives extra speed.</p></div><div class="guide-item"><strong>Make it your flight</strong><p>Practice has no time limit. The timed challenge adds three seconds per target. Fly through eight arches and flame eight chests, eight train barrels and eight planes. Up climbs by default; Settings offers classic inverted flight.</p></div></div><p>Flight keyboard: WASD / arrows steer, F flames, Space or L loops, R turns around, Shift boosts. Gamepad: Circle / B flame, Cross / A or R1 loop, L1 turn, Square / X boost. Pausing freezes the flight clock.</p><button id="guide-done" class="primary-button">Let’s explore ${icon('arrow')}</button>`,
  );
  $('guide-done').onclick = closeDialog;
}
function setInversion(value) {
  settings.flightInverted = !!value;
  if (flight()) sim.inverted = !!value;
  writeSettings(settings);
}
function openSettings() {
  openDialog(
    `<span class="dialog-eyebrow">YOUR ADVENTURE, YOUR WAY</span><h2 id="dialog-title">Make yourself at home.</h2><div class="settings-row"><span>Music & sound<small>An original Skylands soundtrack</small></span><button id="audio-toggle" class="toggle" role="switch" aria-label="Music and sound" aria-checked="${audio.enabled}"></button></div><div class="settings-row"><span>Visual quality<small>Balanced keeps things light on phones</small></span><select id="quality-select" aria-label="Visual quality"><option value="high" ${settings.quality === 'high' ? 'selected' : ''}>Rich · shadows</option><option value="low" ${settings.quality === 'low' ? 'selected' : ''}>Balanced · mobile</option></select></div><div class="settings-row"><span>Classic inverted flight<small>${settings.flightInverted ? 'Pull down to climb' : 'Push up to climb · easier for little dragons'}</small></span><button id="flight-invert-toggle" class="toggle" role="switch" aria-label="Classic inverted flight" aria-checked="${!!settings.flightInverted}"></button></div><div class="settings-row"><span>Saved adventure<small>All three lands and flight records stay on this device</small></span><button id="reset-button" class="text-button">Start fresh</button></div><button id="settings-done" class="primary-button">Back to exploring ${icon('arrow')}</button>`,
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
  $('flight-invert-toggle').onclick = () => {
    setInversion(!settings.flightInverted);
    $('flight-invert-toggle').setAttribute('aria-checked', !!settings.flightInverted);
  };
  $('settings-done').onclick = closeDialog;
  $('reset-button').onclick = () => {
    openDialog(
      `<span class="dialog-eyebrow">A NEW BEGINNING</span><h2 id="dialog-title">Start a fresh adventure?</h2><p>This clears treasure, friends, defeated Gnorcs and flight records from all three lands on this device.</p><div class="dialog-actions"><button id="confirm-reset" class="primary-button">Start fresh</button><button id="cancel-reset" class="secondary-button">Keep my adventure</button></div>`,
    );
    $('cancel-reset').onclick = openSettings;
    $('confirm-reset').onclick = () => {
      clearSave();
      campaign = new Campaign();
      sim = campaign.simulation;
      render.loadLevel(sim.level);
      scripts();
      dialogReturn = 'intro';
      closeDialog();
      $('start-button').innerHTML = `Let’s explore ${icon('arrow')}`;
      $('continue-note').textContent = 'Three lands and a whole sky to explore.';
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
    `<span class="dialog-eyebrow">TAKE A LITTLE BREATHER</span><h2 id="dialog-title">The adventure can wait.</h2><p>${flight() ? 'Your flight is paused. The clock is stopped.' : 'Your adventure is saved. Ready when you are.'}</p><div class="dialog-actions"><button id="resume-button" class="primary-button">Keep exploring ${icon('arrow')}</button><button id="pause-worlds" class="secondary-button">Worlds</button><button id="pause-guide" class="secondary-button">Field guide</button><button id="pause-settings" class="secondary-button">Settings</button></div>`,
  );
  $('resume-button').onclick = closeDialog;
  $('pause-worlds').onclick = () => worlds();
  $('pause-guide').onclick = guide;
  $('pause-settings').onclick = openSettings;
  save();
}
function worlds(withMap = false) {
  campaign.recordCurrent();
  const cards = LANDS.map((land) => {
    const s = campaign.worlds[land.id];
    return `<button class="world-card ${land.id === campaign.landId ? 'current' : ''}" data-land="${land.id}"><strong>${land.name}</strong><small>${land.description}</small><span class="world-progress">${s.gems.length} / ${land.gems.length} gems · ${s.rescues.length} / 3 friends · ${s.enemies.length} / ${land.enemies.length} Gnorcs</span></button>`;
  }).join('');
  openDialog(
    `<span class="dialog-eyebrow">EVERY WORLD IS OPEN</span><h2 id="dialog-title">${withMap ? sim.level.name : 'Choose a world.'}</h2>${withMap ? '<canvas id="big-map" class="big-map" width="600" height="240" aria-label="Current world map"></canvas>' : '<p>Big places to run. New places to explore. Go wherever you like.</p>'}<div class="world-grid">${cards}<div class="world-card flight-card"><strong>Sunny Flight</strong><small>Arches, chests, train barrels and planes. Practise freely or race the clock.</small><span class="world-progress">${campaign.flightRecord.bestTime ? `Best: ${seconds(campaign.flightRecord.bestTime)} · ` : ''}${campaign.flightRecord.completed} completed flights</span><div class="dialog-actions"><button id="flight-practice" class="primary-button">Practise flying</button><button id="flight-timed" class="secondary-button">Timed challenge</button></div></div></div><p class="flight-tip">Flight: push up to climb, sideways to turn. Flame targets; fly through arches. Practice has no countdown. Change flight inversion in Settings.</p>${!flight() ? '<button id="replay-enemies" class="secondary-button">Play the bad guys again</button>' : ''}<button id="map-done" class="primary-button">Back to exploring ${icon('arrow')}</button>`,
  );
  for (const button of document.querySelectorAll('[data-land]'))
    button.onclick = () => enterLand(button.dataset.land);
  $('flight-practice').onclick = () => enterLand('sunny-flight', { timed: false });
  $('flight-timed').onclick = () => enterLand('sunny-flight', { timed: true });
  $('map-done').onclick = closeDialog;
  if ($('replay-enemies'))
    $('replay-enemies').onclick = () => {
      campaign.resetEnemies();
      sim = campaign.simulation;
      render.resetAdventure();
      scripts();
      dialogReturn = 'playing';
      closeDialog();
      save();
      updateHUD();
      toast('The bad guys are back. Your treasure and friends are safe.');
    };
  if (withMap) drawWorldMap($('big-map'), sim, true);
}
function flightResult() {
  save();
  const success = sim.result === 'complete';
  openDialog(
    `<span class="dialog-eyebrow">${sim.timed ? 'SUNNY FLIGHT CHALLENGE' : 'PRACTICE FLIGHT'}</span><h2 id="dialog-title">${success ? 'Every target. Brilliant flying!' : 'A little more practice?'}</h2><p>${sim.collectedTargets.size} / 32 targets · ${seconds(sim.time)} flying${success && sim.timed ? ' · Flight record saved.' : ''}</p><div class="dialog-actions"><button id="flight-retry" class="primary-button">Fly again ${icon('arrow')}</button><button id="flight-free-practice" class="secondary-button">Untimed practice</button><button id="flight-return" class="secondary-button">Back to ${LANDS.find((l) => l.id === campaign.lastGroundLand).name}</button></div>`,
  );
  $('flight-retry').onclick = retryFlight;
  $('flight-free-practice').onclick = () => enterLand('sunny-flight', { timed: false });
  $('flight-return').onclick = () => enterLand(campaign.lastGroundLand);
}
function events() {
  for (const e of sim.drain()) {
    audio.effect(
      e.type === 'flight-target' ? 'gem' : e.type === 'flight-complete' ? 'complete' : e.type,
      e.x ? (e.x - sim.player.x) / 12 : 0,
    );
    if (['gem', 'enemy', 'rescue', 'chest', 'flight-target'].includes(e.type)) {
      render.burst(e);
      if (e.type !== 'flight-target') save();
    }
    if (e.type === 'rescue') toast(`${e.name} is free! Health restored. Checkpoint saved.`);
    if (e.type === 'respawn') toast('Back on your feet. Your treasure is safe.');
    if (e.type === 'travel') {
      if (e.destination === 'sunny-flight') worlds();
      else enterLand(e.destination);
      break;
    }
    if (e.type === 'flight-recover') toast('Wings up! Keep flying — your targets are safe.');
    if (e.type === 'flight-complete' || e.type === 'flight-timeout') {
      flightResult();
      break;
    }
  }
}
function updateHUD() {
  const p = sim.player,
    isFlight = flight(),
    level = sim.level,
    targets = isFlight ? sim.collectedTargets.size : 0;
  $('stage').classList.toggle('flight-mode', isFlight);
  $('zone-name').textContent = level.name;
  document.querySelector('.zone-tag').textContent = isFlight
    ? 'FLYING CHALLENGE'
    : level.theme.subtitle.toUpperCase();
  $('gem-count').textContent = isFlight ? targets : sim.collected.size;
  $('gem-total').textContent = '/ ' + (isFlight ? 32 : level.gems.length);
  $('rescue-count').textContent = isFlight
    ? ['arch', 'chest', 'barrel', 'plane'].filter(
        (kind) =>
          sim.targets.filter((t) => t.kind === kind && sim.collectedTargets.has(t.id)).length === 8,
      ).length
    : sim.rescued.size;
  $('rescue-total').textContent = isFlight ? '/ 4' : '/ 3';
  $('health').setAttribute('aria-label', `${p.health} health`);
  [...$('health').children].forEach((e, i) => e.classList.toggle('lost', i >= p.health));
  $('flight-counts').classList.toggle('hidden', !isFlight);
  if (isFlight) {
    $('quest-title').textContent = sim.timed
      ? `${seconds(sim.remaining)} remaining`
      : 'Practice · no time limit';
    $('quest-copy').textContent = 'Fly through arches. Flame everything else.';
    $('flight-counts').innerHTML = ['arch', 'chest', 'barrel', 'plane']
      .map(
        (kind, i) =>
          `<span>${['Arches', 'Chests', 'Barrels', 'Planes'][i]} <b>${sim.targets.filter((t) => t.kind === kind && sim.collectedTargets.has(t.id)).length}/8</b></span>`,
      )
      .join('');
    $('quest-progress').style.width = `${(targets / 32) * 100}%`;
  } else {
    $('quest-title').textContent = sim.complete ? `${level.name} explored` : 'Room to be a dragon';
    $('quest-copy').textContent =
      `${level.enemies.length - sim.defeated.size} Gnorcs · ${3 - sim.rescued.size} friends to find · ${Math.max(0, 30 - sim.collected.size)} gems to your medal`;
    $('quest-progress').style.width =
      `${Math.min(100, (Math.min(sim.collected.size, 30) / 30 + sim.rescued.size / 3) * 50)}%`;
  }
  const near = sim.nearestInteraction();
  $('interaction-prompt').classList.toggle('hidden', !near);
  $('interaction-prompt').innerHTML = near ? `Visit ${near.name} ${icon('arrow')}` : '';
  const action = document.querySelector('[data-action="interact"]');
  action.classList.toggle('hidden', !near);
  action.querySelector('span').textContent = 'Travel';
  const jump = document.querySelector('[data-action="jump"]'),
    charge = document.querySelector('[data-action="charge"]');
  jump.querySelector('span').textContent = isFlight ? 'Loop' : 'Jump';
  jump.setAttribute('aria-label', isFlight ? 'Loop in flight' : 'Jump or glide');
  charge.querySelector('span').textContent = isFlight ? 'Boost' : 'Charge';
  charge.setAttribute('aria-label', isFlight ? 'Boost in flight' : 'Charge');
  document.querySelector('[data-action="turn"]').classList.toggle('hidden', !isFlight);
  $('retry-flight-button').classList.toggle('hidden', !isFlight);
  $('joystick').setAttribute('aria-label', isFlight ? 'Turn and climb joystick' : 'Move joystick');
  $('desktop-controls').innerHTML = isFlight
    ? '<span><kbd>W A S D</kbd> Turn / climb</span><span><kbd>F</kbd> Flame</span><span><kbd>SPACE</kbd> Loop</span><span><kbd>R</kbd> Turn around</span><span><kbd>SHIFT</kbd> Boost</span>'
    : '<span><kbd>W A S D</kbd> Move</span><span><kbd>SPACE</kbd> Jump / glide</span><span><kbd>SHIFT</kbd> Charge</span><span><kbd>F</kbd> Flame</span><span class="camera-hint">Drag to look · C recenter</span>';
  drawWorldMap($('minimap'), sim);
}
$('start-button').onclick = start;
$('guide-tab').onclick = guide;
$('settings-button').onclick = openSettings;
$('mobile-settings-button').onclick = openSettings;
$('sound-button').onclick = toggleSound;
$('pause-button').onclick = pause;
$('map-button').onclick = () => worlds(true);
$('worlds-button').onclick = () => worlds();
$('dialog-close').onclick = closeDialog;
$('retry-flight-button').onclick = retryFlight;
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
    else if (!(await enterFullscreen($('stage'))))
      toast('For a bigger view, turn your phone to landscape.');
  } catch {
    toast('Fullscreen is unavailable. Landscape still gives you more room.');
  }
};
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Escape') {
    e.preventDefault();
    pause();
  }
  if (mode === 'playing' && e.code === 'KeyM') worlds(true);
  if (mode === 'playing' && e.code === 'KeyV') worlds();
  if (e.code === 'Tab' && mode === 'dialog') {
    const elements = [...$('dialog').querySelectorAll('button,select,a,[tabindex="0"]')].filter(
        (e) => !e.disabled,
      ),
      first = elements[0],
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
if (
  Object.values(campaign.worlds).some((s) => s.gems.length || s.rescues.length || s.enemies.length)
) {
  $('start-button').innerHTML = `Continue adventure ${icon('arrow')}`;
  $('continue-note').textContent = 'Your worlds and friends are saved on this device.';
}
if (!audio.enabled) {
  $('sound-button').classList.add('muted');
  $('sound-button').setAttribute('aria-label', 'Turn sound on');
  $('sound-button').setAttribute('aria-pressed', 'false');
}
try {
  await loadArtTextures();
  await loadModelFiles();
  render = new GameRenderer($('game'), sim.level);
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
    const orbit = input.orbit,
      recenter = input.recenter;
    input.orbit = 0;
    input.recenter = false;
    render.update(
      dt,
      sim,
      mode !== 'intro',
      mode === 'playing' ? orbit : 0,
      mode === 'playing',
      mode === 'playing' && recenter,
    );
    hudTime += dt;
    if (hudTime > 0.12) {
      updateHUD();
      hudTime = 0;
    }
  }
  requestAnimationFrame(frame);
  window.ember = Object.freeze({
    snapshot: () => ({
      mode,
      world: campaign.landId,
      adventureTime: sim.time,
      player: { ...sim.player },
      gems: sim.collected.size,
      rescues: sim.rescued.size,
      enemies: sim.defeated.size,
      chests: sim.broken.size,
      enemyStates: sim.enemies
        .filter((e) => !sim.defeated.has(e.id))
        .map((e) => ({ id: e.id, state: e.state, timer: e.timer })),
      dragonPose: {
        jaw: render.dragon.userData.jaw?.rotation.x,
        blink: render.dragon.userData.eyes?.[0].scale.y,
        head: render.dragon.userData.head.rotation.x,
      },
      fireActive: render.fire.root.visible,
      fireParticles: render.fire.pool.activeCount,
      singedGrass: render.world.grassSystem.field.burn.reduce((n, b) => n + (b > 0 ? 1 : 0), 0),
      activeGems: sim.gems.filter((g) => g.active && !sim.collected.has(g.id)).length,
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
      landmarks: render.world.landmarks || [],
      memory: { ...render.renderer.info.memory },
      audioState: audio.ctx?.state || 'not-started',
      flight: flight()
        ? {
            targets: sim.collectedTargets.size,
            remaining: sim.remaining,
            result: sim.result,
            timed: sim.timed,
            inverted: sim.inverted,
          }
        : null,
    }),
  });
} catch (error) {
  console.error(error);
  $('loading').innerHTML =
    '<div class="error-message"><h2>The adventure needs WebGL.</h2><p>Try a current Chrome, Safari, Firefox or Edge browser with graphics acceleration enabled.</p><button class="primary-button" onclick="location.reload()">Try again</button></div>';
}
