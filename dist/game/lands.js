import { groundHeight } from '../engine/terrain.js';

/** Broad homeworld valleys with gentle hills and continuous, forgiving routes. */
const themes = [
  {
    id: 'artisans',
    name: 'Artisans',
    subtitle: 'Castle gardens',
    color: 0x80b955,
    stone: 0xe9d8b1,
    accent: 0xc96542,
    sky: 0x91bad5,
    fog: 0xd7dfcd,
    description: 'Green courtyards, castle towers and a waterfall. Room to run.',
    friends: ['Nestor', 'Delbin', 'Tomas'],
  },
  {
    id: 'peace-keepers',
    name: 'Peace Keepers',
    subtitle: 'Desert training grounds',
    color: 0xd7ae70,
    stone: 0xc99768,
    accent: 0xb95139,
    sky: 0xe2ab86,
    fog: 0xe3c39f,
    description: 'Sandstone forts, cannons and wide, sunlit training grounds.',
    friends: ['Titan', 'Magnus', 'Gunnar'],
  },
  {
    id: 'magic-crafters',
    name: 'Magic Crafters',
    subtitle: 'Crystal mountain valley',
    color: 0xd5e5e8,
    stone: 0xb5cbdf,
    accent: 0x7164b4,
    sky: 0x9eb4dd,
    fog: 0xd1daef,
    description: 'Snowy courtyards, wizard towers and shimmering crystal gardens.',
    friends: ['Cosmos', 'Zantor', 'Boldar'],
  },
];
const enemyPoints = [
  [-18, 18],
  [16, 18],
  [-28, 0],
  [28, 0],
  [-10, -12],
  [10, -12],
  [-36, -24],
  [36, -24],
  [0, -30],
  [-22, -38],
  [22, -38],
  [0, 0],
];
const chestPoints = [
  [4, 25],
  [-8, 22],
  [-23, 10],
  [23, 10],
  [-34, -12],
  [34, -12],
  [-16, -30],
  [16, -30],
];
function makeLand(theme, index) {
  const hills = [
    { x: -24, z: 7, rx: 21, rz: 24, height: 3.8 },
    { x: 26, z: -23, rx: 23, rz: 23, height: 4.2 },
    { x: 30, z: 33, rx: 20, rz: 22, height: 2.8 },
  ];
  const surface = { bounds: { floorY: 0 }, hills };
  const elevate = (item, offset = 0) => {
    item.y = groundHeight(surface, item.x, item.z) + offset;
  };
  const gems = [];
  for (let ray = 0; ray < 6; ray++)
    for (let i = 0; i < 8; i++) {
      const a = (ray * Math.PI) / 3,
        r = 8 + i * 5;
      gems.push({
        id: `gem-${ray * 8 + i}`,
        x: Math.sin(a) * r,
        y: 0.8,
        z: Math.cos(a) * r,
        color: 0xe8253c,
        zone: theme.id,
      });
    }
  const chests = chestPoints.map(([x, z], i) => ({ id: `chest-${i}`, x, z, y: 0, zone: theme.id }));
  const enemies = enemyPoints.map(([x, z], i) => ({
    id: `enemy-${i}`,
    x,
    z,
    y: 0,
    zone: theme.id,
    type:
      i === 4 || i === 10
        ? 'giant'
        : (index === 1 ? i % 2 === 0 : i % 4 === 1)
          ? 'armor'
          : 'normal',
    behavior: i % 4 === 3 ? 'flee' : 'patrol',
    role: index === 2 && i % 3 === 0 ? 'wizard' : null,
  }));
  for (const c of chests)
    for (let i = 0; i < 2; i++)
      gems.push({
        id: `${c.id}-gem-${i}`,
        x: c.x + (i ? 0.25 : -0.25),
        y: 0.8,
        z: c.z,
        color: 0x24db67,
        source: 'chest',
        sourceId: c.id,
        zone: theme.id,
      });
  for (const e of enemies)
    gems.push({
      id: `${e.id}-gem`,
      x: e.x,
      y: 0.8,
      z: e.z,
      color: 0x24db67,
      source: 'enemy',
      sourceId: e.id,
      zone: theme.id,
    });
  const other = themes.filter((t) => t.id !== theme.id);
  const portals = other.map((t, i) => ({
    id: `portal-${t.id}`,
    name: t.name,
    destination: t.id,
    x: i ? -36 : 36,
    y: 0,
    z: -43,
    color: t.accent,
  }));
  if (index === 0)
    portals.push({
      id: 'portal-sunny-flight',
      name: 'Sunny Flight',
      destination: 'sunny-flight',
      x: 0,
      y: 0,
      z: -43,
      color: 0xf0ba55,
    });
  const rescues = theme.friends.map((name, i) => ({
    id: `spirit-${i}`,
    name,
    x: [0, -32, 32][i],
    z: [13, -24, -24][i],
    y: 0,
    zone: theme.name,
    message: 'Thanks, little dragon! Every land is open. Keep charging and exploring.',
  }));
  for (const item of [...chests, ...enemies, ...rescues, ...portals]) elevate(item);
  for (const gem of gems) elevate(gem, 0.8);
  const spawn = { x: 0, y: 0, z: 30 };
  elevate(spawn);
  const obstacles = [
    { x: -43, z: 28, r: 2.5 },
    { x: 43, z: 28, r: 2.5 },
    { x: -45, z: -34, r: 2.5 },
    { x: 45, z: -34, r: 2.5 },
  ];
  for (const obstacle of obstacles) elevate(obstacle);
  return {
    hills,
    id: theme.id,
    name: theme.name,
    kind: 'ground',
    theme,
    description: theme.description,
    bounds: { minX: -58, maxX: 58, minZ: -58, maxZ: 58, floorY: 0 },
    islands: [
      {
        id: theme.id,
        name: theme.name,
        x: 0,
        z: 0,
        y: 0,
        r: 82,
        color: theme.color,
        tuftCount: index === 1 ? 900 : 4500,
      },
    ],
    bridges: [],
    ramps: [],
    platforms: [],
    spawn,
    portal: portals[0],
    portals,
    gems,
    chests,
    enemies,
    rescues,
    obstacles,
    paths: [
      [0, 38, 0, -45, 4.2],
      [-43, 0, 43, 0, 4],
      [-36, 28, 36, -32, 3],
      [-36, -32, 36, 28, 3],
    ],
    goal: { gems: 30, rescues: 3 },
  };
}
export const LANDS = themes.map(makeLand);
export function getLand(id) {
  return LANDS.find((land) => land.id === id) ?? null;
}
