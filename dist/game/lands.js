import { groundHeight } from '../engine/terrain.js';
import { LAND_LAYOUTS } from './land-layouts.js';

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
    description:
      'Follow the castle garden circuit. Explore the orchard and a hidden waterfall grotto.',
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
    description: 'Patrol a looping sandstone canyon, cross the training field and search the camp.',
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
    description:
      'Wind through snowy crystal hollows. Find an old observatory and a moonstone overlook.',
    friends: ['Cosmos', 'Zantor', 'Boldar'],
  },
];
/** Evenly spaced breadcrumb gems follow route distance, preserving stable save IDs. */
function routePoint(points, fraction) {
  const lengths = points
    .slice(1)
    .map(([x, z], i) => Math.hypot(x - points[i][0], z - points[i][1]));
  let distance = fraction * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]) {
      const t = distance / lengths[i];
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * t,
        points[i][1] + (points[i + 1][1] - points[i][1]) * t,
      ];
    }
    distance -= lengths[i];
  }
  return points.at(-1);
}
function makeLand(theme, index) {
  const layout = LAND_LAYOUTS[theme.id];
  const hills = layout.hills;
  const surface = { bounds: { floorY: 0 }, hills };
  const elevate = (item, offset = 0) => {
    item.y = groundHeight(surface, item.x, item.z) + offset;
  };
  const gems = [];
  for (let i = 0; i < 48; i++) {
    const [x, z] = routePoint(layout.mainLoop, (i + 0.5) / 48);
    gems.push({ id: `gem-${i}`, x, z, color: 0xe8253c, zone: theme.id });
  }
  const chests = layout.chests.map(([x, z], i) => ({ id: `chest-${i}`, x, z, zone: theme.id }));
  const secrets = layout.secrets.map((s) => ({ ...s }));
  for (const secret of secrets) {
    chests.push({
      id: `secret-${secret.id}-chest`,
      x: secret.x,
      z: secret.z - 2,
      secretId: secret.id,
      zone: theme.id,
    });
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 2 * i) / 4;
      gems.push({
        id: `secret-${secret.id}-gem-${i}`,
        x: secret.x + Math.sin(a) * 2.5,
        z: secret.z + Math.cos(a) * 2.5,
        color: 0xe8253c,
        secretId: secret.id,
        zone: theme.id,
      });
    }
  }
  const enemies = layout.enemies.map(([x, z], i) => ({
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
        secretId: c.secretId,
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
    x: layout.portals[i][0],
    y: 0,
    z: layout.portals[i][1],
    color: t.accent,
  }));
  if (index === 0)
    portals.push({
      id: 'portal-sunny-flight',
      name: 'Sunny Flight',
      destination: 'sunny-flight',
      x: layout.portals[2][0],
      y: 0,
      z: layout.portals[2][1],
      color: 0xf0ba55,
    });
  const rescues = theme.friends.map((name, i) => ({
    id: `spirit-${i}`,
    name,
    x: layout.friends[i][0],
    z: layout.friends[i][1],
    y: 0,
    zone: theme.name,
    message: 'Thanks, little dragon! Every land is open. Keep charging and exploring.',
  }));
  for (const item of [...chests, ...enemies, ...rescues, ...portals, ...secrets]) elevate(item);
  for (const gem of gems) elevate(gem, 0.8);
  const spawn = { x: layout.spawn[0], y: 0, z: layout.spawn[1] };
  elevate(spawn);
  const obstacles = layout.obstacles.map((o) => ({ ...o }));
  for (const secret of secrets.filter((s) => s.kind === 'grotto')) {
    // Three matching masonry walls; the entire south-facing entrance stays open.
    for (const side of [-1, 1])
      obstacles.push({
        x: secret.x + side * 7,
        z: secret.z,
        halfX: 0.7,
        halfZ: 8,
        height: 7.5,
        style: 'grotto',
        secretId: secret.id,
      });
    obstacles.push({
      x: secret.x,
      z: secret.z - 8,
      halfX: 7.7,
      halfZ: 0.7,
      height: 7.5,
      style: 'grotto',
      secretId: secret.id,
    });
  }
  for (const obstacle of obstacles) {
    elevate(obstacle);
    if (obstacle.style === 'grotto') {
      const secret = secrets.find((s) => s.id === obstacle.secretId);
      const heights = [];
      for (const x of [obstacle.x - obstacle.halfX, obstacle.x, obstacle.x + obstacle.halfX])
        for (const z of [obstacle.z - obstacle.halfZ, obstacle.z, obstacle.z + obstacle.halfZ])
          heights.push(groundHeight(surface, x, z));
      obstacle.y = Math.min(...heights) - 0.25;
      obstacle.height = secret.y + 8.4 - obstacle.y;
    }
  }
  const paths = [layout.mainLoop, ...layout.branches].flatMap((points, index) =>
    points.slice(1).map(([x, z], i) => [points[i][0], points[i][1], x, z, index ? 6.5 : 8]),
  );
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
    paths,
    mainLoop: layout.mainLoop,
    branches: layout.branches,
    loopName: layout.loopName,
    regions: layout.regions,
    secrets,
    goal: { gems: 30, rescues: 3 },
  };
}
export const LANDS = themes.map(makeLand);
export function getLand(id) {
  return LANDS.find((land) => land.id === id) ?? null;
}
