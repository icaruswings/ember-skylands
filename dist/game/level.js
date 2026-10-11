/** Declarative world content. Coordinates are world-space meters. */
const islands = [
  { id: 'meadow', name: 'Artisan Gardens', x: 0, z: 0, y: 0, r: 22, color: 0x7cbe55 },
  { id: 'willow', name: 'Willow Hollow', x: 34, z: -20, y: 3, r: 13, color: 0x72b64e },
  { id: 'crown', name: 'Dragon Heights', x: -31, z: -24, y: 7, r: 12, color: 0x79b755 },
];
const bridges = [
  { ax: 14, az: -8, bx: 27, bz: -16, ay: 0, by: 3, width: 4 },
  { ax: -14, az: -10, bx: -24, bz: -20, ay: 0, by: 7, width: 4 },
];
const gems = [];
for (let k = 0; k < 3; k++)
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2,
      r = 5 + (i % 3) * 2.2,
      land = islands[k];
    gems.push({
      id: `gem-${k * 20 + i}`,
      x: land.x + Math.sin(a) * r,
      z: land.z + Math.cos(a) * r,
      y: land.y + 0.8,
      color: 0xe8253c,
      zone: land.id,
    });
  }
const chests = [
  { id: 'chest-0', x: 4, z: 6, y: 0, zone: 'meadow' },
  { id: 'chest-1', x: -5, z: 9, y: 0, zone: 'meadow' },
  { id: 'chest-2', x: 30, z: -23, y: 3, zone: 'willow' },
  { id: 'chest-3', x: 38, z: -24, y: 3, zone: 'willow' },
  { id: 'chest-4', x: -30, z: -29, y: 7, zone: 'crown' },
  { id: 'chest-5', x: -36, z: -22, y: 7, zone: 'crown' },
];
const enemies = [
  { id: 'enemy-0', x: 7, z: -4, y: 0, type: 'armor', behavior: 'flee', zone: 'meadow' },
  { id: 'enemy-1', x: -7, z: 2, y: 0, type: 'giant', zone: 'meadow' },
  { id: 'enemy-2', x: 32, z: -17, y: 3, type: 'normal', behavior: 'flee', zone: 'willow' },
  { id: 'enemy-3', x: 39, z: -16, y: 3, type: 'armor', behavior: 'flee', zone: 'willow' },
  { id: 'enemy-4', x: -28, z: -22, y: 7, type: 'giant', zone: 'crown' },
  { id: 'enemy-5', x: -35, z: -19, y: 7, type: 'normal', behavior: 'flee', zone: 'crown' },
];
for (const c of chests)
  for (let i = 0; i < 2; i++)
    gems.push({
      id: `${c.id}-gem-${i}`,
      x: c.x + (i ? 0.25 : -0.25),
      y: c.y + 0.8,
      z: c.z,
      color: 0x24db67,
      source: 'chest',
      sourceId: c.id,
      zone: c.zone,
    });
for (const e of enemies)
  gems.push({
    id: `${e.id}-gem`,
    x: e.x,
    y: e.y + 0.8,
    z: e.z,
    color: 0x24db67,
    source: 'enemy',
    sourceId: e.id,
    zone: e.zone,
  });
export const LEVEL = {
  islands,
  bridges,
  gems,
  chests,
  spawn: { x: 0, z: 10, y: 0 },
  portal: { x: 0, z: -10.8, y: 0 },
  rescues: [
    {
      id: 'spirit-0',
      name: 'Sol',
      x: 12,
      z: 1,
      y: 0,
      zone: 'Artisan Gardens',
      message:
        'The meadow glows again! Follow the gem trails to the bridges. A second jump spreads your wings.',
    },
    {
      id: 'spirit-1',
      name: 'Fern',
      x: 38,
      z: -23,
      y: 3,
      zone: 'Willow Hollow',
      message:
        'Look at those feet go! Charge the armored Gnorcs, flame the big ones, and chase the thieves for their treasure.',
    },
    {
      id: 'spirit-2',
      name: 'Luma',
      x: -33,
      z: -27,
      y: 7,
      zone: 'Dragon Heights',
      message:
        'The sky spirits are free! Bring 30 gems to the Sunstone portal. Your journey home awaits.',
    },
  ],
  enemies,
  obstacles: [
    { x: -4, z: -12, r: 1.7 },
    { x: 4, z: -12, r: 1.7 },
    { x: 0, z: -13, halfX: 3.5, halfZ: 1.5 },
    { x: 11, z: -10, halfX: 1.5, halfZ: 1.5 },
    { x: -10, z: -11, halfX: 1.5, halfZ: 1.5 },
  ],
  goal: { gems: 30, rescues: 3 },
};
