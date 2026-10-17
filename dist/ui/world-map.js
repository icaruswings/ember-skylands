/** Canvas maps consume active simulation data; they never mutate gameplay. */
export function drawWorldMap(canvas, sim, big = false) {
  const c = canvas.getContext('2d'),
    w = canvas.width,
    h = canvas.height,
    level = sim.level,
    b = level.bounds,
    pad = big ? 24 : 10;
  const scale = Math.min((w - pad * 2) / (b.maxX - b.minX), (h - pad * 2) / (b.maxZ - b.minZ));
  const pos = (x, z) => [
    w / 2 + (x - (b.minX + b.maxX) / 2) * scale,
    h / 2 + (z - (b.minZ + b.maxZ) / 2) * scale,
  ];
  c.clearRect(0, 0, w, h);
  c.fillStyle =
    level.kind === 'flight'
      ? '#b4d9d9'
      : level.id === 'peace-keepers'
        ? '#e2c28e'
        : level.id === 'magic-crafters'
          ? '#dbe6ee'
          : '#cee0b2';
  c.fillRect(...pos(b.minX, b.minZ), (b.maxX - b.minX) * scale, (b.maxZ - b.minZ) * scale);
  c.strokeStyle = '#a58f70';
  c.lineWidth = big ? 6 : 2;
  for (const [ax, az, bx, bz] of level.paths || []) {
    c.beginPath();
    c.moveTo(...pos(ax, az));
    c.lineTo(...pos(bx, bz));
    c.stroke();
  }
  const dot = (x, z, color, r) => {
    c.fillStyle = color;
    c.beginPath();
    c.arc(...pos(x, z), r, 0, 7);
    c.fill();
  };
  if (level.kind === 'flight')
    for (const t of sim.targets) {
      if (!sim.collectedTargets.has(t.id))
        dot(
          t.x,
          t.z,
          { arch: '#51956a', chest: '#d49f3a', barrel: '#a9694b', plane: '#6c75b6' }[t.kind],
          big ? 4 : 2,
        );
    }
  else {
    for (const g of sim.gems)
      if (g.active && !sim.collected.has(g.id))
        dot(g.x, g.z, g.source ? '#36a56c' : '#d85761', big ? 2 : 1);
    for (const r of level.rescues)
      dot(r.x, r.z, sim.rescued.has(r.id) ? '#6c9e58' : '#9a65ab', big ? 4 : 2.5);
    for (const e of sim.enemies)
      if (!sim.defeated.has(e.id)) dot(e.x, e.z, '#b86942', big ? 3 : 1.6);
    for (const portal of level.portals) {
      const [x, z] = pos(portal.x, portal.z);
      c.strokeStyle = '#477b8a';
      c.lineWidth = 2;
      c.strokeRect(x - 3, z - 3, 6, 6);
    }
  }
  const [x, z] = pos(sim.player.x, sim.player.z);
  c.save();
  c.translate(x, z);
  c.rotate(-sim.player.angle);
  c.fillStyle = '#7b49ad';
  c.beginPath();
  c.moveTo(0, 6);
  c.lineTo(-4, -4);
  c.lineTo(4, -4);
  c.closePath();
  c.fill();
  c.restore();
}
