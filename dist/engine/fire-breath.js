import * as T from '../assets/three.module.js';
import { FlamePool } from './flame-pool.js';

// Crossed transparent flame sheets provide depth without volumetric ray marching.
const plumeVertex = `
  varying vec2 vUv;
  uniform float time;
  uniform float phase;
  void main() {
    vUv = uv;
    vec3 p = position;
    float width = 0.12 + sin(uv.y * 3.0) * 0.82;
    p.x *= width;
    p.x += sin(uv.y * 12.0 - time * 15.0 + phase) * uv.y * 0.13;
    p.y += uv.y * uv.y * 0.32;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const plumeFragment = `
  varying vec2 vUv;
  uniform float time;
  uniform float phase;
  uniform float strength;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    vec2 flow = vec2(vUv.x * 5.0 + phase, vUv.y * 7.0 - time * 13.0);
    float turbulence = noise(flow) * 0.65 + noise(flow * 2.1) * 0.35;
    float edge = abs(vUv.x * 2.0 - 1.0);
    float ragged = 0.65 + turbulence * 0.35;
    float body = 1.0 - smoothstep(ragged - 0.22, ragged, edge);
    float end = 1.0 - smoothstep(0.52 + turbulence * 0.28, 1.0, vUv.y);
    float heat = clamp((1.0 - edge) * 0.6 + (1.0 - vUv.y) * 0.3 + turbulence * 0.12, 0.0, 1.0);
    vec3 color = mix(vec3(0.85, 0.09, 0.015), vec3(1.0, 0.19, 0.012), smoothstep(0.15, 0.52, heat));
    color = mix(color, vec3(1.0, 0.81, 0.14), smoothstep(0.52, 0.8, heat));
    color = mix(color, vec3(1.0, 0.97, 0.72), smoothstep(0.83, 1.0, heat));
    float alpha = body * end * strength * (0.68 + turbulence * 0.25);
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;
const emberVertex = `
  attribute float heat;
  attribute float size;
  attribute float seed;
  uniform float viewportHeight;
  varying float vHeat;
  varying float vSeed;
  void main() {
    vHeat = heat;
    vSeed = seed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(size * viewportHeight * projectionMatrix[1][1] / max(1.0, -mv.z), 0.0, 95.0);
  }
`;
const emberFragment = `
  varying float vHeat;
  varying float vSeed;
  uniform float time;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float wobble = sin(p.y * 9.0 + time * 22.0 + vSeed) * 0.09;
    p.x += wobble;
    float taper = 0.3 + smoothstep(-1.0, 0.6, p.y) * 0.7;
    float radius = length(vec2(p.x / taper, p.y * 0.9));
    float alpha = (1.0 - smoothstep(0.56, 0.96, radius)) * smoothstep(0.0, 0.22, vHeat) * 0.58;
    vec3 color = mix(vec3(0.95, 0.13, 0.015), vec3(1.0, 0.45, 0.025), vHeat);
    color = mix(color, vec3(1.0, 0.96, 0.62), smoothstep(0.62, 0.98, vHeat) * (1.0 - radius));
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

/** Dedicated fire effect: mouth-anchored plume, forward flames, cooling embers and warm light. */
export class FireBreath {
  constructor(scene) {
    this.pool = new FlamePool();
    this.root = new T.Group();
    this.root.visible = false;
    this.root.renderOrder = 5;
    scene.add(this.root);
    this.materials = [];
    const geometry = new T.PlaneGeometry(1.7, 3.1, 6, 18);
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, 0, 1.55);
    for (let i = 0; i < 3; i++) {
      const material = new T.ShaderMaterial({
        uniforms: { time: { value: 0 }, phase: { value: i * 2.1 }, strength: { value: 0 } },
        vertexShader: plumeVertex,
        fragmentShader: plumeFragment,
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
        toneMapped: false,
      });
      const flame = new T.Mesh(geometry, material);
      flame.rotation.z = (i * Math.PI) / 3;
      flame.renderOrder = 5;
      this.root.add(flame);
      this.materials.push(material);
    }
    const particles = new T.BufferGeometry();
    for (const [name, size] of [
      ['position', 3],
      ['heat', 1],
      ['size', 1],
      ['seed', 1],
    ]) {
      particles.setAttribute(
        name,
        new T.BufferAttribute(this.pool[name], size).setUsage(T.DynamicDrawUsage),
      );
    }
    this.emberMaterial = new T.ShaderMaterial({
      uniforms: { time: { value: 0 }, viewportHeight: { value: 720 } },
      vertexShader: emberVertex,
      fragmentShader: emberFragment,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    this.embers = new T.Points(particles, this.emberMaterial);
    this.embers.frustumCulled = false;
    this.embers.renderOrder = 6;
    scene.add(this.embers);
    this.light = new T.PointLight(0xff8d24, 0, 6, 2);
    scene.add(this.light);
  }
  update(dt, player, active, time, quality, viewportHeight) {
    const breathing = active && player.flame > 0.01;
    this.pool.update(dt, player, breathing, quality);
    const sin = Math.sin(player.angle),
      cos = Math.cos(player.angle);
    this.root.position.set(player.x + sin * 1.61, player.y + 1.21, player.z + cos * 1.61);
    this.root.rotation.y = player.angle;
    this.root.visible = breathing;
    const elapsed = 0.42 - player.flame;
    const strength = breathing ? Math.min(1, elapsed / 0.045 + 0.2, player.flame / 0.09) : 0;
    const flicker = 0.94 + Math.sin(time * 47) * 0.06;
    for (const m of this.materials) {
      m.uniforms.time.value = time;
      m.uniforms.strength.value = strength * flicker;
    }
    this.root.children[2].visible = quality !== 'low';
    this.root.scale.set(1, 1, 0.87 + Math.sin(time * 29) * 0.08);
    this.light.position.set(player.x + sin * 2.5, player.y + 1.4, player.z + cos * 2.5);
    this.light.visible = quality !== 'low';
    this.light.intensity = strength * flicker * 5;
    this.emberMaterial.uniforms.time.value = time;
    this.emberMaterial.uniforms.viewportHeight.value = viewportHeight;
    for (const attribute of Object.values(this.embers.geometry.attributes))
      attribute.needsUpdate = true;
    this.embers.visible = this.pool.activeCount > 0;
  }
}
