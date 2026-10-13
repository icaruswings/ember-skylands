import * as T from '../assets/three.module.js';
import { createWorld } from '../game/world.js';
import { createDragon, animateDragon, animateSentinel } from '../game/assets.js';
import { Particles } from './particles.js';
import { FireBreath } from './fire-breath.js';
import { ChaseCamera } from './chase-camera.js';
import { terrainHeight } from './simulation.js';
import { ScorchMarks } from '../game/scorch.js';
import { updateRescue } from '../game/rescue.js';
import { createCompanion, updateCompanion } from '../game/companion.js';
export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new T.Scene();
    this.scene.fog = new T.FogExp2(0xc9bed5, 0.0036);
    this.camera = new T.PerspectiveCamera(58, 1, 0.1, 400);
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    const skyGeo = new T.SphereGeometry(290, 24, 16);
    const skyMat = new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: { top: { value: new T.Color(0x8ca8d4) }, bottom: { value: new T.Color(0xffcc99) } },
      vertexShader:
        'varying vec3 vWorld;void main(){vWorld=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:
        'uniform vec3 top;uniform vec3 bottom;varying vec3 vWorld;void main(){float h=normalize(vWorld).y;gl_FragColor=vec4(mix(bottom,top,smoothstep(-0.3,0.55,h)),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    });
    this.scene.add(new T.Mesh(skyGeo, skyMat));
    this.scene.add(new T.HemisphereLight(0xd2f4ff, 0x756447, 1.8));
    this.sun = new T.DirectionalLight(0xffdf9c, 2.3);
    this.sun.position.set(-26, 48, 24);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -55,
      right: 55,
      top: 55,
      bottom: -55,
      near: 1,
      far: 140,
    });
    this.sun.shadow.bias = -0.0007;
    this.sun.shadow.normalBias = 0.08;
    this.scene.add(this.sun);
    this.scene.add(new T.AmbientLight(0xffe8d0, 0.25));
    const disc = new T.Mesh(
      new T.SphereGeometry(9, 16, 12),
      new T.MeshBasicMaterial({ color: 0xffecb0 }),
    );
    disc.position.set(-110, 68, -150);
    this.scene.add(disc);
    this.scene.environment = reflectionSky();
    this.world = createWorld(this.scene);
    this.scorch = new ScorchMarks(this.scene);
    this.chase = new ChaseCamera();
    this.ray = new T.Raycaster();
    this.cameraDesired = new T.Vector3();
    this.rayDirection = new T.Vector3();
    this.dragon = createDragon(0.86);
    this.mouthOrigin = new T.Vector3();
    this.scene.add(this.dragon);
    this.particles = new Particles(this.scene);
    this.fire = new FireBreath(this.scene);
    this.companion = createCompanion();
    this.scene.add(this.companion);
    this.angle = 0;
    this.companion.userData.initialized = false;
    this.target = new T.Vector3(0, 1.5, 10);
    this.time = 0;
    this.quality = 'high';
    this.resize();
    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      document.dispatchEvent(new Event('game-context-lost'));
    });
    canvas.addEventListener('webglcontextrestored', () => location.reload());
  }
  resetAdventure() {
    this.chase = new ChaseCamera();
    this.angle = 0;
    this.companion.userData.initialized = false;
    this.world.grassSystem.field.burn.fill(0);
    for (const group of this.world.grassSystem.groups) {
      group.geometry.attributes.burn.array.fill(0);
      group.geometry.attributes.burn.needsUpdate = true;
    }
    for (const mark of this.scorch.marks) {
      mark.life = 0;
      mark.mesh.visible = false;
    }
    this.scorch.lastX = Infinity;
    this.scorch.elapsed = 0;
  }
  resize() {
    const w = this.canvas.clientWidth,
      h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  setQuality(value) {
    this.quality = value;
    this.world.grassSystem.setQuality(value);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, value === 'low' ? 1 : 1.5));
    this.renderer.shadowMap.enabled = value !== 'low';
    this.resize();
  }
  update(dt, sim, playing, orbit = 0, effectsActive = playing) {
    this.time += dt;
    const p = sim.player;
    this.dragon.position.set(p.x, p.y + 0.07, p.z);
    this.dragon.rotation.y = playing ? p.angle : 0.5;
    this.dragon.visible = !(p.invincible > 0 && Math.floor(p.invincible * 10) % 2 === 0);
    animateDragon(
      this.dragon,
      playing ? sim.time : this.time,
      Math.hypot(p.vx, p.vz),
      p.gliding,
      p.charging,
      p,
    );
    if (playing) {
      const c = this.chase.update(effectsActive ? dt : 0, p, orbit);
      this.angle = c.angle;
      this.target.set(c.targetX, c.targetY, c.targetZ);
      this.cameraDesired.set(c.x, c.y, c.z);
      // Keep the low camera out of stonework and above the walkable terrain.
      const floor = terrainHeight(sim.level, c.x, c.z);
      if (floor !== null) this.cameraDesired.y = Math.max(this.cameraDesired.y, floor + 1.05);
      this.rayDirection.copy(this.cameraDesired).sub(this.target);
      const distance = this.rayDirection.length();
      this.rayDirection.normalize();
      this.ray.set(this.target, this.rayDirection);
      this.ray.far = distance;
      const hits = this.ray.intersectObjects(this.world.collisionMeshes, false);
      if (hits.length)
        this.cameraDesired
          .copy(this.target)
          .addScaledVector(this.rayDirection, Math.max(0.8, hits[0].distance - 0.4));
      this.camera.position.copy(this.cameraDesired);
      this.camera.lookAt(this.target);
    } else {
      const a = 0.4 + Math.sin(this.time * 0.08) * 0.055;
      this.camera.position.set(p.x + Math.sin(a) * 14, p.y + 6.8, p.z + Math.cos(a) * 14);
      this.camera.lookAt(p.x - 1, p.y + 1.5, p.z - 4);
    }
    for (const [i, gem] of sim.gems.entries()) {
      const m = this.world.gemMeshes.get(gem.id);
      m.scale.setScalar(!gem.active || sim.collected.has(gem.id) ? 0 : 1);

      m.rotation.y = this.time * 0.85;
      m.position.set(gem.x, gem.y + Math.sin(sim.time * 2 + gem.x) * 0.08, gem.z);
      m.updateMatrix();
      this.world.gemBatch.setMatrixAt(i, m.matrix);
    }
    this.world.gemBatch.instanceMatrix.needsUpdate = true;
    for (const [id, m] of this.world.rescueMeshes) {
      updateRescue(m.userData, sim.rescued.has(id), sim.time, sim.rescueTimes.get(id));
    }
    for (const [id, m] of this.world.chestMeshes) m.visible = !sim.broken.has(id);
    for (const e of sim.enemies) {
      const m = this.world.enemyMeshes.get(e.id);
      m.visible = !sim.defeated.has(e.id);
      m.position.set(e.x, e.y + Math.abs(Math.sin(sim.time * (e.fleeing ? 11 : 4))) * 0.06, e.z);
      m.rotation.y = e.angle ?? 0;
      animateSentinel(m, sim.time, e.speed || 0, e.state || 'patrol');
    }
    this.world.grassSystem.update(dt, p, effectsActive, sim.time);
    this.scorch.update(dt, p, effectsActive, sim.level);
    this.world.portal.userData.glow.material.color.setHex(sim.unlocked ? 0x83f7cd : 0x5e7ea3);
    this.world.portal.userData.glow.material.opacity = 0.55 + Math.sin(this.time * 2) * 0.15;
    this.world.waterTex.offset.y -= dt * 0.18;
    updateCompanion(
      this.companion,
      p,
      effectsActive || !playing ? dt : 0,
      playing ? sim.time : this.time,
    );
    this.dragon.updateMatrixWorld(true);
    this.dragon.userData.mouth.getWorldPosition(this.mouthOrigin);
    this.fire.update(
      dt,
      p,
      effectsActive,
      this.time,
      this.quality,
      this.canvas.height,
      this.mouthOrigin,
    );
    this.particles.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
  burst(event) {
    const color = event.type === 'rescue' ? 0xa6ffdb : event.type === 'enemy' ? 0xffb767 : 0xffdd86;
    this.particles.emit(
      event.x || 0,
      (event.y || 0) + 1,
      event.z || 0,
      color,
      event.type === 'rescue' ? 100 : 30,
      3,
    );
  }
}

/** Tiny procedural sky reflection, prefiltered by Three for jewel facets. */
function reflectionSky() {
  const images = [];
  for (let face = 0; face < 6; face++) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d'),
      gradient = ctx.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, '#a6dff2');
    gradient.addColorStop(0.5, '#d4eff2');
    gradient.addColorStop(0.65, '#fff1cf');
    gradient.addColorStop(1, '#629349');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#fffdf0';
    ctx.fillRect(face % 2 ? 18 : 75, 24, 15, 24);
    images.push(canvas);
  }
  const cube = new T.CubeTexture(images);
  cube.colorSpace = T.SRGBColorSpace;
  cube.needsUpdate = true;
  return cube;
}
