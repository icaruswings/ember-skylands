/** Gesture-gated WebAudio music and positional effects. No network or audio files. */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.32;
    this.nextBeat = 0;
    this.beat = 0;
    this.active = false;
  }
  async start() {
    if (!this.ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      this.ctx = new Context();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? this.volume : 0;
      this.master.connect(this.ctx.destination);
    }
    try {
      await this.ctx.resume();
    } catch {}
    this.active = true;
    this.nextBeat = this.ctx.currentTime + 0.1;
  }
  setEnabled(value) {
    this.enabled = value;
    if (this.master)
      this.master.gain.setTargetAtTime(value ? this.volume : 0, this.ctx.currentTime, 0.1);
  }
  tone(freq, time, length = 0.25, type = 'sine', gain = 0.1, pan = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(),
      vol = this.ctx.createGain(),
      panner = this.ctx.createStereoPanner();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    vol.gain.setValueAtTime(0, time);
    vol.gain.linearRampToValueAtTime(gain, time + 0.015);
    vol.gain.exponentialRampToValueAtTime(0.0001, time + length);
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    osc.connect(vol);
    vol.connect(panner);
    panner.connect(this.master);
    osc.start(time);
    osc.stop(time + length + 0.03);
  }
  update() {
    if (!this.ctx || !this.active || !this.enabled) return;
    const now = this.ctx.currentTime;
    if (this.nextBeat < now - 0.2) this.nextBeat = now + 0.04;
    while (this.nextBeat < now + 0.12) {
      const notes = [0, 4, 7, 12, 7, 4, 2, 7, 0, 4, 9, 12, 9, 7, 4, 2],
        root = [196, 174.61, 164.81, 174.61][Math.floor(this.beat / 16) % 4];
      this.tone(root * 2 ** (notes[this.beat % 16] / 12), this.nextBeat, 0.65, 'sine', 0.065);
      if (this.beat % 4 === 0) {
        this.tone(root / 2, this.nextBeat, 1.65, 'triangle', 0.07);
        this.tone(root * 1.5, this.nextBeat, 1.6, 'sine', 0.025);
      }
      this.nextBeat += 0.3;
      this.beat++;
    }
  }
  effect(name, pan = 0) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const notes = {
      gem: [880, 1174, 1568],
      rescue: [392, 494, 587, 784, 988],
      complete: [392, 494, 587, 784, 988, 1174],
      jump: [220, 330],
      glide: [330, 440],
      enemy: [130, 98],
      damage: [160, 80],
      flame: [90, 65, 45],
    };
    for (const [i, f] of (notes[name] || []).entries())
      this.tone(
        f,
        t + i * 0.065,
        name === 'rescue' ? 0.6 : 0.18,
        name === 'flame' ? 'sawtooth' : 'sine',
        name === 'flame' ? 0.025 : 0.14,
        pan,
      );
  }
  pause(value) {
    this.active = !value;
    if (this.ctx) {
      if (value) this.ctx.suspend().catch(() => {});
      else this.ctx.resume().catch(() => {});
    }
  }
}
