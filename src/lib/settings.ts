"use client";

import { create } from "zustand";
import { applyTheme, getTheme } from "./themes";

export interface AccentDef {
  name: string;
  value: string;
}

export const ACCENTS: AccentDef[] = [
  { name: "Lime", value: "#c6ff3f" },
  { name: "Violet", value: "#a78bfa" },
  { name: "Cyan", value: "#22d3ee" },
  { name: "Pink", value: "#f472b6" },
  { name: "Orange", value: "#fb923c" },
  { name: "Gold", value: "#facc15" },
];

const KEY = "sonara:settings";

interface SettingsState {
  // audio
  crossfadeSec: number; // 0 = off
  gapless: boolean;
  fadePlay: boolean;
  autoplaySimilar: boolean;
  normalize: boolean; // balances loudness between songs
  speed: number;
  dataWarn: boolean;
  resumePlayback: boolean;
  keepAwake: boolean;
  eqEnabled: boolean;
  eqPreset: string;
  eqGains: number[];
  // appearance & feel
  themeId: string;
  accent: string;
  amoled: boolean;
  reduceMotion: boolean;
  perfMode: boolean;
  haptics: boolean;
  glowLevel: number; // 0..1
  cornerRadius: number; // 18..34
  blurLevel: number; // 0..1
  fontScale: number; // 0.9..1.15
  artShadow: boolean;
  dynamicColors: boolean;
  notifications: boolean;
  autoUpdate: boolean;
  listeningGoalMin: number;
  profileName: string;
  profileEmoji: string;
  // meta
  hydrated: boolean;
  patch: (p: Partial<Omit<SettingsState, "patch" | "hydrate" | "hydrated">>) => void;
  hydrate: () => void;
}

const DEFAULTS = {
  crossfadeSec: 0,
  gapless: true,
  fadePlay: true,
  autoplaySimilar: true,
  normalize: true,
  speed: 1,
  dataWarn: true,
  resumePlayback: true,
  keepAwake: true,
  eqEnabled: false,
  eqPreset: "Flat",
  eqGains: [0, 0, 0, 0, 0],
  themeId: "midnight",
  accent: "#c6ff3f",
  amoled: false,
  reduceMotion: false,
  perfMode: false,
  haptics: true,
  glowLevel: 1,
  cornerRadius: 26,
  blurLevel: 1,
  fontScale: 1,
  artShadow: true,
  dynamicColors: true,
  notifications: true,
  autoUpdate: true,
  listeningGoalMin: 30,
  profileName: "Music Lover",
  profileEmoji: "🎧",
};

function applySideEffects(s: SettingsState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  applyTheme(getTheme(s.themeId), s.amoled);
  // custom accent overrides the theme accent when user picked one
  if (s.accent) root.style.setProperty("--acc", s.accent);
  root.classList.toggle("amoled", s.amoled);
  root.classList.toggle("rm", s.reduceMotion);
  root.classList.toggle("perf", s.perfMode);
  root.style.setProperty("--radius", `${s.cornerRadius}px`);
  root.style.setProperty("--font-scale", String(s.fontScale));
  root.style.setProperty("--glow", String(s.glowLevel));
  root.style.setProperty("--blur-amt", `${24 * s.blurLevel}px`);
  document.body.style.zoom = String(s.fontScale);
  root.classList.toggle("no-artshadow", !s.artShadow);
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  patch: (p) => {
    set(p);
    const s = get();
    applySideEffects(s);
    try {
      const { patch: _p, hydrate: _h, hydrated: _d, ...persist } = s;
      window.localStorage.setItem(KEY, JSON.stringify(persist));
    } catch {
      /* noop */
    }
    // live-apply playback prefs
    import("./player").then((m) => m.applyAudioPrefs());
  },

  hydrate: () => {
    if (get().hydrated) return;
    let stored: Partial<typeof DEFAULTS> = {};
    try {
      stored = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
    } catch {
      /* noop */
    }
    // Low-end phones and the Android WebView get the light (no-blur) renderer by default.
    const nav = navigator as Navigator & { deviceMemory?: number };
    const autoPerf =
      /SonaraAndroid/i.test(nav.userAgent) ||
      (nav.hardwareConcurrency ?? 8) <= 4 ||
      (nav.deviceMemory ?? 8) <= 3;
    set({ ...DEFAULTS, ...stored, perfMode: stored.perfMode ?? autoPerf, hydrated: true });
    applySideEffects(get());
  },
}));
