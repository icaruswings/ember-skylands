import * as T from '../assets/three.module.js';
import { createWorld } from '../game/world.js';
import { createDragon, animateDragon, mat, orb } from '../game/assets.js';
import { Particles } from './particles.js';
import { FireBreath } from './fire-breath.js';
export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new T.Scene();
    this.scene.fog = new T.FogExp2(0xc7d9c8, 0.0048);
    this.camera = new T.PerspectiveCamera(53, 1, 0.1, 400);
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
      uniforms: { top: { value: new T.Color(0x83b9c6) }, bottom: { value: new T.Color(0xffe5b7) } },
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
    this.world = createWorld(this.scene);
    this.dragon = createDragon(0.86);
    this.scene.add(this.dragon);
    this.particles = new Particles(this.scene);
    this.fire = new FireBreath(this.scene);
    this.companion = new T.Group();
    orb(this.companion, mat(0xffd285, { emissive: 0xffad38, emissiveIntensity: 1 }), 0, 0, 0, 0.11);
    for (const s of [-1, 1])
      orb(
        this.companion,
        mat(0xeaffef, { transparent: true, opacity: 0.8 }),
        s * 0.17,
        0.04,
        0,
        0.18,
        0.025,
        0.1,
      );
    this.scene.add(this.companion);
    this.angle = 0.24;
    this.distance = 10.5;
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
    animateDragon(this.dragon, this.time, Math.hypot(p.vx, p.vz), p.gliding, p.charging);
    const desired = new T.Vector3(p.x, p.y + 1.5, p.z);
    this.target.lerp(desired, 1 - Math.exp(-dt * 7));
    if (playing) {
      this.angle += orbit;
      const cp = new T.Vector3(
        this.target.x + Math.sin(this.angle) * this.distance,
        this.target.y + 6.1,
        this.target.z + Math.cos(this.angle) * this.distance,
      );
      this.camera.position.lerp(cp, 1 - Math.exp(-dt * 6));
      this.camera.lookAt(this.target);
    } else {
      const a = 0.4 + Math.sin(this.time * 0.08) * 0.055;
      this.camera.position.set(p.x + Math.sin(a) * 14, p.y + 6.8, p.z + Math.cos(a) * 14);
      this.camera.lookAt(p.x - 1, p.y + 1.5, p.z - 4);
    }
    for (const [i, gem] of sim.level.gems.entries()) {
      const m = this.world.gemMeshes.get(gem.id);
      m.scale.setScalar(sim.collected.has(gem.id) ? 0 : 1);
      m.scale.x *= 0.75;
      m.scale.y *= 1.2;
      m.scale.z *= 0.75;
      m.rotation.y = this.time * 0.85;
      m.position.y = gem.y + Math.sin(this.time * 2 + m.position.x) * 0.14;
      m.updateMatrix();
      this.world.gemBatch.setMatrixAt(i, m.matrix);
    }
    this.world.gemBatch.instanceMatrix.needsUpdate = true;
    for (const [id, m] of this.world.rescueMeshes) {
      const freed = sim.rescued.has(id);
      m.userData.cage.visible = m.userData.cageLines.visible = !freed;
      m.userData.cage.rotation.y = this.time * 0.15;
      m.userData.cageLines.rotation.y = this.time * 0.15;
      m.userData.halo.rotation.z = this.time * 0.2;
      animateDragon(m.userData.dragon, this.time, 0, false, false);
    }
    for (const e of sim.enemies) {
      const m = this.world.enemyMeshes.get(e.id);
      m.visible = !sim.defeated.has(e.id);
      m.position.set(e.x, e.y + Math.abs(Math.sin(this.time * 4)) * 0.05, e.z);
      m.rotation.y = Math.atan2(p.x - e.x, p.z - e.z);
    }
    this.world.portal.userData.glow.material.color.setHex(sim.unlocked ? 0x83f7cd : 0x5e7ea3);
    this.world.portal.userData.glow.material.opacity = 0.55 + Math.sin(this.time * 2) * 0.15;
    this.world.waterTex.offset.y -= dt * 0.18;
    this.companion.position.set(
      p.x + Math.cos(this.time * 2) * 1.2,
      p.y + 1.9 + Math.sin(this.time * 4) * 0.18,
      p.z + Math.sin(this.time * 2) * 1.2,
    );
    this.companion.children[0].material.color.setHex([0xffd285, 0x97dbef, 0x8be9a1][3 - p.health]);
    this.fire.update(dt, p, effectsActive, this.time, this.quality, this.canvas.height);
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
