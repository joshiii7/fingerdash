import type { Weapon } from './weapons';

export type SoundKind = 'shot' | 'miss';

/** The loudest the volume slider can go, as a multiple of normal (so 2 is "200%"). */
export const MAX_LEVEL = 2;

export interface GunAudio {
  /** Creates and resumes the audio context. Call it from a key press or click (browsers block it before). */
  unlock(): void;
  /** Volume from 0 to 2 (0 to 200%). Applied at once, including to sounds already playing. */
  setVolume(level: number): void;
  play(kind: SoundKind, weapon: Weapon, delaySec?: number): void;
}

/** Above this many live sound nodes, new shots are skipped so a long burst can't pile up CPU work. */
const MAX_NODES = 60;
/** Each shot's pitch is nudged by up to this much either way, so it never sounds copy-pasted. */
const PITCH_SPREAD = 0.05;
const SILENT = 0.0001;
/** Master gain at 100%. Gun Mode is meant to be loud, so this is already well above unity. */
const FULL_GAIN = 1.8;

const jitter = () => 1 + (Math.random() * 2 - 1) * PITCH_SPREAD;

interface NoiseOptions {
  hz: number;
  /** When set, the filter sweeps from `hz` to this over the burst. */
  sweepToHz?: number;
  q: number;
  ms: number;
  gain: number;
}

interface ToneOptions {
  fromHz: number;
  toHz: number;
  ms: number;
  gain: number;
  type: OscillatorType;
}

/**
 * Synthesises every gun sound with the Web Audio API: a filtered noise burst for the crack and a
 * falling sine for the thump, each with a fast decay. Every sound is its own short-lived set of
 * nodes feeding one master gain, so shots overlap freely and the volume slider is instant.
 */
export function createGunAudio(): GunAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let unavailable = false;
  let level = 0.8;
  let nodes = 0;

  // Gentle at the bottom of the slider and hot at the top. Past 100% it keeps rising in a straight
  // line, so 200% is twice as loud as 100%; the limiter below keeps the peaks from clipping.
  const masterGain = () => (level <= 1 ? level ** 1.5 : level) * FULL_GAIN;

  function ensure(): AudioContext | null {
    if (ctx) return ctx;
    if (unavailable || typeof window === 'undefined') return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      unavailable = true;
      return null;
    }
    try {
      ctx = new Ctor({ latencyHint: 'interactive' });
    } catch {
      // No usable audio device: Gun Mode stays silent but typing is unaffected.
      unavailable = true;
      return null;
    }
    master = ctx.createGain();
    master.gain.value = masterGain();
    // Keeps a dense burst of overlapping, very loud shots from clipping.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 12;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.1;
    master.connect(limiter);
    limiter.connect(ctx.destination);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function noiseBurst(c: AudioContext, at: number, o: NoiseOptions, rate: number): void {
    if (!noise || !master) return;
    const dur = o.ms / 1000;
    const src = c.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = rate;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = o.q;
    filter.frequency.setValueAtTime(o.hz, at);
    if (o.sweepToHz) filter.frequency.exponentialRampToValueAtTime(o.sweepToHz, at + dur);
    const env = c.createGain();
    env.gain.setValueAtTime(o.gain, at);
    env.gain.exponentialRampToValueAtTime(SILENT, at + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(master);
    nodes += 3;
    src.onended = () => {
      nodes -= 3;
      src.disconnect();
      filter.disconnect();
      env.disconnect();
    };
    // A random slice of the noise each time, so no two cracks are identical.
    src.start(at, Math.random() * 0.5, dur + 0.02);
  }

  function tone(c: AudioContext, at: number, o: ToneOptions): void {
    if (!master) return;
    const dur = o.ms / 1000;
    const osc = c.createOscillator();
    osc.type = o.type;
    osc.frequency.setValueAtTime(o.fromHz, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(o.toHz, 1), at + dur);
    const env = c.createGain();
    env.gain.setValueAtTime(o.gain, at);
    env.gain.exponentialRampToValueAtTime(SILENT, at + dur);
    osc.connect(env);
    env.connect(master);
    nodes += 2;
    osc.onended = () => {
      nodes -= 2;
      osc.disconnect();
      env.disconnect();
    };
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  function shot(c: AudioContext, at: number, weapon: Weapon): void {
    const s = weapon.shot;
    const r = jitter();
    noiseBurst(c, at, { hz: s.noiseHz * r, q: s.noiseQ, ms: s.noiseMs, gain: s.gain }, r);
    tone(c, at, {
      fromHz: s.thumpHz * r,
      toHz: s.thumpHz * r * 0.4,
      ms: s.thumpMs,
      gain: s.gain * 0.85,
      type: 'sine',
    });
  }

  /** A wrong key: a bullet skipping off metal. */
  function ricochet(c: AudioContext, at: number): void {
    const r = jitter();
    noiseBurst(c, at, { hz: 4200 * r, sweepToHz: 1400 * r, q: 2.5, ms: 170, gain: 0.55 }, r);
    tone(c, at, { fromHz: 2800 * r, toHz: 1900 * r, ms: 150, gain: 0.3, type: 'sine' });
  }

  function unlock(): void {
    const c = ensure();
    if (c && c.state === 'suspended') {
      c.resume().catch(() => {
        // Still blocked (no user gesture yet): the next key press tries again.
      });
    }
  }

  return {
    unlock,

    setVolume(next) {
      level = Math.min(MAX_LEVEL, Math.max(0, next));
      if (ctx && master) master.gain.setTargetAtTime(masterGain(), ctx.currentTime, 0.01);
    },

    play(kind, weapon, delaySec = 0) {
      const c = ensure();
      if (!c) return;
      if (c.state === 'suspended') unlock();
      if (nodes > MAX_NODES) return;
      const at = c.currentTime + delaySec;
      if (kind === 'shot') shot(c, at, weapon);
      else ricochet(c, at);
    },
  };
}
