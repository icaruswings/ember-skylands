/** Declarative world content. Coordinates are world-space meters. */
const islands = [
  { id: 'meadow', name: 'Sunstone Meadow', x: 0, z: 0, y: 0, r: 22, color: 0x8eae4e },
  { id: 'willow', name: 'Willow Rise', x: 34, z: -20, y: 3, r: 13, color: 0x82a858 },
  { id: 'crown', name: 'Crystal Crown', x: -31, z: -24, y: 7, r: 12, color: 0x809e70 },
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
      color: [0xffb34b, 0x79e5ca, 0xe69af0][i % 3],
    });
  }
export const LEVEL = {
  islands,
  bridges,
  gems,
  spawn: { x: 0, z: 10, y: 0 },
  portal: { x: 0, z: -10.8, y: 0 },
  rescues: [
    {
      id: 'spirit-0',
      name: 'Sol',
      x: 12,
      z: 1,
      y: 0,
      zone: 'Sunstone Meadow',
      message:
        'The meadow glows again! Follow the gem trails to the bridges. A second jump spreads your wings.',
    },
    {
      id: 'spirit-1',
      name: 'Fern',
      x: 38,
      z: -23,
      y: 3,
      zone: 'Willow Rise',
      message:
        'You found me among the willows. Armored sentinels fear your charge. The large ones fear your flame.',
    },
    {
      id: 'spirit-2',
      name: 'Luma',
      x: -33,
      z: -27,
      y: 7,
      zone: 'Crystal Crown',
      message:
        'The sky spirits are free! Bring 30 gems to the Sunstone portal. Your journey home awaits.',
    },
  ],
  enemies: [
    { id: 'enemy-0', x: 7, z: -4, y: 0, type: 'armor' },
    { id: 'enemy-1', x: -7, z: 2, y: 0, type: 'giant' },
    { id: 'enemy-2', x: 32, z: -17, y: 3, type: 'normal' },
    { id: 'enemy-3', x: 39, z: -16, y: 3, type: 'armor' },
    { id: 'enemy-4', x: -28, z: -22, y: 7, type: 'giant' },
    { id: 'enemy-5', x: -35, z: -19, y: 7, type: 'normal' },
  ],
  obstacles: [
    { x: -4, z: -12, r: 1.7 },
    { x: 4, z: -12, r: 1.7 },
    { x: 0, z: -13, halfX: 3.5, halfZ: 1.5 },
    { x: 11, z: -10, halfX: 1.5, halfZ: 1.5 },
    { x: -10, z: -11, halfX: 1.5, halfZ: 1.5 },
  ],
  goal: { gems: 30, rescues: 3 },
};
