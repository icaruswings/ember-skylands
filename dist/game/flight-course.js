/** Original coastal course, using the four eight-target Sunny Flight task groups. */
const arches = [
  [0, 18, 80],
  [0, 20, 55],
  [20, 24, 30],
  [45, 24, 10],
  [60, 22, -18],
  [45, 20, -44],
  [18, 18, -60],
  [-10, 18, -65],
];
const chests = [
  [-35, 12, -60],
  [-60, 12, -52],
  [-82, 12, -34],
  [-94, 12, -10],
  [-94, 12, 14],
  [-80, 12, 38],
  [-58, 12, 56],
  [-32, 12, 65],
];
const targets = arches.map(([x, y, z], i) => {
  const previous = i ? arches[i - 1] : [0, 18, 110],
    next = arches[Math.min(i + 1, 7)];
  const dx = next[0] - previous[0],
    dz = next[2] - previous[2],
    length = Math.hypot(dx, dz);
  return {
    id: `arch-${i}`,
    kind: 'arch',
    x,
    y,
    z,
    radius: 6,
    normal: { x: dx / length, y: 0, z: dz / length },
  };
});
for (const [i, [x, y, z]] of chests.entries())
  targets.push({ id: `chest-${i}`, kind: 'chest', x, y, z, radius: 1.8 });
for (const kind of ['barrel', 'plane'])
  for (let i = 0; i < 8; i++) {
    const plane = kind === 'plane',
      phase = (i * Math.PI) / 4,
      radius = plane ? 84 : 40,
      cx = plane ? 15 : 0,
      cz = plane ? -5 : 0;
    targets.push({
      id: `${kind}-${i}`,
      kind,
      x: cx + Math.sin(phase) * radius,
      y: plane ? 34 : 10,
      z: cz + Math.cos(phase) * radius,
      radius: plane ? 2.6 : 2,
      motion: { cx, cz, radius, phase, speed: plane ? -0.075 : 0.1, bob: plane ? 3 : 0 },
    });
  }
export const FLIGHT_COURSE = {
  id: 'sunny-flight',
  name: 'Sunny Flight',
  kind: 'flight',
  description:
    'A coastal flying playground. Fly through arches and flame chests, train barrels and planes.',
  spawn: { x: 0, y: 18, z: 112, angle: Math.PI },
  bounds: { minX: -132, maxX: 132, minZ: -125, maxZ: 132, minY: 4, maxY: 65 },
  timeLimit: 90,
  timeBonus: 3,
  targets,
  islands: [],
  bridges: [],
  obstacles: [],
  enemies: [],
  gems: [],
  chests: [],
  rescues: [],
  goal: { gems: 0, rescues: 0 },
  theme: { sky: 0x8ac9e0, fog: 0xcbe6e4 },
};
