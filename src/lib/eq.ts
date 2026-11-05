"use client";

/**
 * Web Audio equalizer. We do NOT rap around the <audio> element mid-playback —
 * that is what used to kill the sound. Instead we grab the audio context
 * lazily, build the chain at the very first user interaction, and then
 * gently remix: when a track starts we always route through EQ (it works
 * like a master output, not a per-track interrupt).
 */

export const EQ_BANDS = [60, 250, 1000, 4000, 12000];

export type EqPresetName =
  "Flat" | "Bass Boost" | "Vocal" | "Treble" | "Rock" | "Electronic" | "Podcast";

export const EQ_PRESETS: Record<EqPresetName, number[]> = {
  Flat: [0, 0, 0, 0, 0],
  "Bass Boost": [9, 5, 0, -1, 1],
  Vocal: [-3, 0, 5, 4, 1],
  Treble: [-2, -1, 0, 5, 8],
  Rock: [5, 2, -1, 3, 5],
  Electronic: [7, 2, -2, 3, 6],
  Podcast: [-6, -2, 6, 5, 0],
};

interface Chain {
  filters: BiquadFilterNode[];
  preamp: GainNode;
  analyser: AnalyserNode;
  src: MediaElementAudioSourceNode;
}

const chains = new WeakMap<HTMLAudioElement, Chain>();
let ctx: AudioContext | null = null;
let failed = false;

function getCtx(): AudioContext | null {
  if (failed) return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    failed = true;
    return null;
  }
}

/** Attach EQ to an element — safe because we do it BEFORE the track plays or
 *  while paused, and never detach (which caused the mid-play silence). */
export function attachEq(el: HTMLAudioElement): boolean {
  if (failed) return false;
  if (chains.has(el)) return true;
  const c = getCtx();
  if (!c) return false;
  try {
    const src = c.createMediaElementSource(el);
    const preamp = c.createGain();
    preamp.gain.value = 1;
    const filters = EQ_BANDS.map((freq, i) => {
      const f = c.createBiquadFilter();
      f.type = i === 0 ? "lowshelf" : i === EQ_BANDS.length - 1 ? "highshelf" : "peaking";
      f.frequency.value = freq;
      f.Q.value = 1;
      f.gain.value = 0;
      return f;
    });
    let node: AudioNode = src;
    for (const f of filters) {
      node.connect(f);
      node = f;
    }
    node.connect(preamp);
    const analyser = c.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;
    preamp.connect(analyser);
    analyser.connect(c.destination);
    chains.set(el, { src, preamp, filters, analyser });
    return true;
  } catch {
    failed = true;
    return false;
  }
}

/** Smoothly move band gains (safe even while music is playing). */
export function setEqGains(el: HTMLAudioElement, gains: number[]) {
  const chain = chains.get(el);
  if (!chain || !ctx) return;
  const t = ctx.currentTime;
  chain.filters.forEach((f, i) => {
    const g = gains[i] ?? 0;
    try {
      f.gain.setTargetAtTime(g, t, 0.05);
    } catch {
      f.gain.value = g;
    }
  });
  const peak = Math.max(0, ...gains);
  const comp = peak > 0 ? 1 / (1 + peak / 24) : 1;
  try {
    chain.preamp.gain.setTargetAtTime(comp, t, 0.1);
  } catch {
    chain.preamp.gain.value = comp;
  }
}

/**
 * Safe bypass. Never disconnect the output: disconnecting a MediaElement chain
 * makes Android WebView permanently silent until the element is recreated.
 * Flat gains are mathematically the same as bypass and preserve audio.
 */
export function bypassEq(el: HTMLAudioElement, disabled: boolean) {
  const chain = chains.get(el);
  if (!chain || !ctx) return;
  if (disabled) setEqGains(el, [0, 0, 0, 0, 0]);
}

export function hasEqChain(el: HTMLAudioElement) {
  return chains.has(el);
}

export function resumeEqContext() {
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

export function eqAvailable() {
  return !failed;
}

/** Returns 32 live frequency bins, or null when this source cannot be analysed. */
export function getSpectrum(el: HTMLAudioElement): Uint8Array | null {
  const chain = chains.get(el);
  if (!chain) return null;
  const data = new Uint8Array(chain.analyser.frequencyBinCount);
  chain.analyser.getByteFrequencyData(data);
  return data;
}
