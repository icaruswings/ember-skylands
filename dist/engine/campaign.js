import { FlightSimulation } from './flight.js';
import { FLIGHT_COURSE } from '../game/flight-course.js';
import { Simulation } from './simulation.js';
import { LANDS, getLand } from '../game/lands.js';

/** Versioned campaign progress; transient positions/velocities are never persisted. */
export class Campaign {
  constructor(raw) {
    this.worlds = {};
    const migrated = raw?.version === 1 ? migrateLegacy(raw) : raw?.version === 2 ? raw.worlds : {};
    for (const land of LANDS)
      this.worlds[land.id] = new Simulation(land, migrated?.[land.id]).save();
    const record = raw?.version === 2 ? raw.flight : null;
    this.flightRecord = {
      completed:
        Number.isInteger(record?.completed) && record.completed >= 0
          ? Math.min(100000, record.completed)
          : 0,
      bestTime:
        Number.isFinite(record?.bestTime) && record.bestTime > 0 && record.bestTime < 3600
          ? record.bestTime
          : null,
    };
    this.landId = getLand(raw?.currentLand)?.id || 'artisans';
    this.lastGroundLand = this.landId;
    this.simulation = new Simulation(getLand(this.landId), this.worlds[this.landId]);
  }
  recordCurrent() {
    if (this.simulation.level.kind === 'flight') this.recordFlight();
    else this.worlds[this.landId] = this.simulation.save();
  }
  travel(id, options = {}) {
    const level = id === FLIGHT_COURSE.id ? FLIGHT_COURSE : getLand(id);
    if (!level) throw new Error('Unknown land');
    this.recordCurrent();
    this.landId = id;
    if (level.kind === 'flight') this.simulation = new FlightSimulation(level, options);
    else {
      this.lastGroundLand = id;
      this.simulation = new Simulation(level, this.worlds[id]);
    }
    return this.simulation;
  }
  recordFlight() {
    const s = this.simulation;
    if (s.level.kind !== 'flight' || s.result !== 'complete' || s.recorded) return;
    s.recorded = true;
    this.flightRecord.completed++;
    if (s.timed && (!this.flightRecord.bestTime || s.time < this.flightRecord.bestTime))
      this.flightRecord.bestTime = s.time;
  }
  resetEnemies() {
    if (this.simulation.level.kind === 'flight') return;
    const saved = this.simulation.save();
    saved.enemies = [];
    this.simulation = new Simulation(this.simulation.level, saved);
    this.recordCurrent();
  }
  save() {
    this.recordCurrent();
    return {
      version: 2,
      currentLand: this.lastGroundLand,
      worlds: structuredClone(this.worlds),
      flight: { ...this.flightRecord },
    };
  }
}
function migrateLegacy(raw) {
  const result = Object.fromEntries(
    LANDS.map((l) => [
      l.id,
      { version: 1, gems: [], rescues: [], enemies: [], chests: [], complete: false },
    ]),
  );
  const destination = (i) => result[LANDS[Math.min(2, Math.floor(i / 2))].id];
  for (const id of Array.isArray(raw.gems) ? raw.gems : []) {
    let m;
    if ((m = /^gem-(\d+)$/.exec(id)) && +m[1] < 60)
      result[LANDS[Math.floor(+m[1] / 20)].id].gems.push(`gem-${+m[1] % 20}`);
    else if ((m = /^route-gem-(\d+)$/.exec(id)) && +m[1] < 14)
      result.artisans.gems.push(`gem-${20 + +m[1]}`);
    else if ((m = /^chest-(\d+)-gem-([01])$/.exec(id)) && +m[1] < 6)
      destination(+m[1]).gems.push(`chest-${+m[1] % 2}-gem-${m[2]}`);
    else if ((m = /^enemy-(\d+)-gem$/.exec(id)) && +m[1] < 6)
      destination(+m[1]).gems.push(`enemy-${+m[1] % 2}-gem`);
    else if ((m = /^chest-secret-gem-([01])$/.exec(id)))
      result.artisans.gems.push(`chest-2-gem-${m[1]}`);
  }
  for (const key of ['enemies', 'chests'])
    for (const id of Array.isArray(raw[key]) ? raw[key] : []) {
      const m = /^(enemy|chest)-(\d+)$/.exec(id);
      if (m && +m[2] < 6) destination(+m[2])[key].push(`${m[1]}-${+m[2] % 2}`);
      else if (key === 'chests' && id === 'chest-secret') result.artisans.chests.push('chest-2');
    }
  for (const id of Array.isArray(raw.rescues) ? raw.rescues : []) {
    const m = /^spirit-([012])$/.exec(id);
    if (m) result[LANDS[+m[1]].id].rescues.push('spirit-0');
  }
  return result;
}
