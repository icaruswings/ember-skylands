/** Horizontal locomotion, independent of terrain, rendering and input devices.
 * Rates are radians/second; speeds and acceleration are world units/second.
 * Sharp ground turns shed speed; charge/glide retain their forward momentum.
 */
export const LOCOMOTION = Object.freeze({
  runSpeed: 7,
  chargeSpeed: 15,
  glideSpeed: 9,
  groundTurn: 11,
  airTurn: 7,
  chargeTurn: 5.0,
  glideTurn: 3.4,
  chargeCornerSpeed: 0.78,
  acceleration: 50,
  chargeAcceleration: 80,
  braking: 100,
});
export function movePlayer(p, input, dt) {
  const t = LOCOMOTION,
    previousAngle = p.angle;
  const x = input.x || 0,
    z = input.z || 0;
  const magnitude = Math.min(1, Math.hypot(x, z));
  const moving = magnitude > 0;
  let error = 0;
  if (moving) {
    const desired = Math.atan2(x, z);
    error = Math.atan2(Math.sin(desired - p.angle), Math.cos(desired - p.angle));
    const rate = p.gliding
      ? t.glideTurn
      : p.charging
        ? t.chargeTurn
        : p.grounded
          ? t.groundTurn
          : t.airTurn;
    const turn = Math.max(-rate * dt, Math.min(rate * dt, error));
    p.angle += turn;
    error -= turn;
  }
  const turnRate =
    Math.atan2(Math.sin(p.angle - previousAngle), Math.cos(p.angle - previousAngle)) /
    Math.max(dt, 1e-6);
  p.turnRate = (p.turnRate ?? 0) + (turnRate - (p.turnRate ?? 0)) * (1 - Math.exp(-dt * 12));
  p.turning = Math.abs(error) > 0.3;
  p.viewX = input.viewX;
  p.viewZ = input.viewZ;
  const target = p.gliding
    ? t.glideSpeed
    : p.charging
      ? t.chargeSpeed *
        (1 - (1 - t.chargeCornerSpeed) * Math.min(1, Math.abs(error) / (Math.PI / 2)))
      : t.runSpeed * magnitude * Math.max(0, Math.cos(error));
  const speed = Math.hypot(p.vx, p.vz);
  const rate = target < speed ? t.braking : p.charging ? t.chargeAcceleration : t.acceleration;
  const next = speed + Math.max(-rate * dt, Math.min(rate * dt, target - speed));
  p.vx = Math.sin(p.angle) * next;
  p.vz = Math.cos(p.angle) * next;
}
