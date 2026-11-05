"use client";

export interface Theme {
  id: string;
  name: string;
  tagline: string;
  /** primary accent */
  acc: string;
  /** secondary accent used in gradients */
  acc2: string;
  /** app background */
  bg: string;
  /** elevated surface tint (rgba) */
  surface: string;
  /** glass border */
  border: string;
  /** ambient blob colors */
  blob1: string;
  blob2: string;
  blob3: string;
  /** text on accent (for buttons) */
  onAcc: string;
  /** preview gradient for the picker */
  preview: string;
}

export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight Lime",
    tagline: "The original — neon on black",
    acc: "#c6ff3f",
    acc2: "#8b5cf6",
    bg: "#07070b",
    surface: "255,255,255",
    border: "255,255,255",
    blob1: "rgba(198,255,63,0.06)",
    blob2: "rgba(139,92,246,0.08)",
    blob3: "rgba(34,211,238,0.05)",
    onAcc: "#000000",
    preview: "linear-gradient(135deg,#07070b 0%,#1a2f0a 55%,#c6ff3f 100%)",
  },
  {
    id: "sunset",
    name: "Sunset Drive",
    tagline: "Warm dusk, amber haze",
    acc: "#ff9f43",
    acc2: "#ff5e7a",
    bg: "#120a0a",
    surface: "255,228,196",
    border: "255,190,140",
    blob1: "rgba(255,159,67,0.10)",
    blob2: "rgba(255,94,122,0.10)",
    blob3: "rgba(255,206,84,0.06)",
    onAcc: "#1a0d00",
    preview: "linear-gradient(135deg,#120a0a 0%,#7a2d2d 50%,#ff9f43 100%)",
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    tagline: "Cool cyan currents",
    acc: "#22d3ee",
    acc2: "#3b82f6",
    bg: "#040a12",
    surface: "190,230,255",
    border: "140,200,255",
    blob1: "rgba(34,211,238,0.10)",
    blob2: "rgba(59,130,246,0.11)",
    blob3: "rgba(16,185,129,0.06)",
    onAcc: "#001018",
    preview: "linear-gradient(135deg,#040a12 0%,#0d4a6b 50%,#22d3ee 100%)",
  },
  {
    id: "sakura",
    name: "Sakura Dream",
    tagline: "Soft pink blossom",
    acc: "#f472b6",
    acc2: "#c084fc",
    bg: "#0f0710",
    surface: "255,214,238",
    border: "255,180,220",
    blob1: "rgba(244,114,182,0.11)",
    blob2: "rgba(192,132,252,0.10)",
    blob3: "rgba(251,207,232,0.06)",
    onAcc: "#1a0010",
    preview: "linear-gradient(135deg,#0f0710 0%,#6b2050 50%,#f472b6 100%)",
  },
  {
    id: "matrix",
    name: "Matrix",
    tagline: "Pure terminal green",
    acc: "#22c55e",
    acc2: "#14b8a6",
    bg: "#000000",
    surface: "180,255,200",
    border: "100,255,150",
    blob1: "rgba(34,197,94,0.10)",
    blob2: "rgba(20,184,166,0.08)",
    blob3: "rgba(34,197,94,0.05)",
    onAcc: "#001a08",
    preview: "linear-gradient(135deg,#000000 0%,#0a3d1f 50%,#22c55e 100%)",
  },
  {
    id: "royal",
    name: "Royal Gold",
    tagline: "Luxury black & gold",
    acc: "#facc15",
    acc2: "#a855f7",
    bg: "#0a0812",
    surface: "255,240,200",
    border: "230,200,120",
    blob1: "rgba(250,204,21,0.09)",
    blob2: "rgba(168,85,247,0.10)",
    blob3: "rgba(251,191,36,0.05)",
    onAcc: "#1a1400",
    preview: "linear-gradient(135deg,#0a0812 0%,#4a3a0a 50%,#facc15 100%)",
  },
  {
    id: "arctic",
    name: "Arctic Frost",
    tagline: "Icy minimal silver",
    acc: "#e2e8f0",
    acc2: "#7dd3fc",
    bg: "#0b0f14",
    surface: "226,232,240",
    border: "200,220,240",
    blob1: "rgba(226,232,240,0.07)",
    blob2: "rgba(125,211,252,0.09)",
    blob3: "rgba(148,163,184,0.06)",
    onAcc: "#0b0f14",
    preview: "linear-gradient(135deg,#0b0f14 0%,#33506b 50%,#e2e8f0 100%)",
  },
  {
    id: "amethyst",
    name: "Amethyst",
    tagline: "Deep violet velvet",
    acc: "#a78bfa",
    acc2: "#ec4899",
    bg: "#0b0714",
    surface: "226,214,255",
    border: "210,190,255",
    blob1: "rgba(167,139,250,0.11)",
    blob2: "rgba(236,72,153,0.09)",
    blob3: "rgba(139,92,246,0.07)",
    onAcc: "#140a00",
    preview: "linear-gradient(135deg,#0b0714 0%,#3d1b66 50%,#a78bfa 100%)",
  },
  {
    id: "ember",
    name: "Ember Storm",
    tagline: "Molten crimson fire",
    acc: "#ff6a3d",
    acc2: "#f43f5e",
    bg: "#130205",
    surface: "255,215,190",
    border: "255,170,130",
    blob1: "rgba(255,106,61,0.11)",
    blob2: "rgba(244,63,94,0.09)",
    blob3: "rgba(251,146,60,0.07)",
    onAcc: "#1a0500",
    preview: "linear-gradient(135deg,#130205 0%,#7a1607 50%,#ff6a3d 100%)",
  },
  {
    id: "lapis",
    name: "Lapis Night",
    tagline: "Midnight royal blue",
    acc: "#60a5fa",
    acc2: "#22d3ee",
    bg: "#040812",
    surface: "210,230,255",
    border: "160,200,255",
    blob1: "rgba(96,165,250,0.11)",
    blob2: "rgba(34,211,238,0.08)",
    blob3: "rgba(59,130,246,0.07)",
    onAcc: "#000a18",
    preview: "linear-gradient(135deg,#040812 0%,#122c5e 50%,#60a5fa 100%)",
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function applyTheme(t: Theme, amoled: boolean) {
  if (typeof document === "undefined") return;
  const r = document.documentElement.style;
  r.setProperty("--acc", t.acc);
  r.setProperty("--acc2", t.acc2);
  r.setProperty("--bg", amoled ? "#000000" : t.bg);
  r.setProperty("--surface", t.surface);
  r.setProperty("--border", t.border);
  r.setProperty("--blob1", t.blob1);
  r.setProperty("--blob2", t.blob2);
  r.setProperty("--blob3", t.blob3);
  r.setProperty("--on-acc", t.onAcc);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", amoled ? "#000000" : t.bg);
}
