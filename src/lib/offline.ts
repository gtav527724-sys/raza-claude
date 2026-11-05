"use client";

import { playKind, trackKey } from "./playable";
import { resolveFull } from "./resolve";
import { create } from "zustand";
import type { Track } from "./types";

const CACHE = "sonara-downloads-v1";
const KEY = "sonara:downloads";

export function offlineProxyUrl(raw: string) {
  return `/api/stream?url=${encodeURIComponent(raw)}`;
}

function load(): Track[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Track[];
  } catch {
    return [];
  }
}

function save(items: Track[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

interface OfflineState {
  items: Track[];
  downloading: number[];
  hydrated: boolean;
  hydrate: () => void;
  has: (t: Track) => boolean;
  download: (t: Track) => Promise<void>;
  remove: (t: Track) => Promise<void>;
  clear: () => Promise<void>;
}

function key(t: Track) {
  return trackKey(t);
}

export const useOffline = create<OfflineState>((set, get) => ({
  items: [],
  downloading: [],
  hydrated: false,

  hydrate: () => {
    if (!get().hydrated) set({ items: load(), hydrated: true });
  },

  has: (t) => get().items.some((x) => key(x) === key(t)),

  download: async (t) => {
    if (get().has(t) || get().downloading.includes(t.id)) return;
    set({ downloading: [...get().downloading, t.id] });
    try {
      // Only FULL-length direct streams can be saved (never a 30s preview).
      let src = t.fullUrl || "";
      if (!src && playKind(t) === "audio") src = t.audioUrl;
      if (!src && playKind(t) === "resolve") src = (await resolveFull(t))?.fullUrl ?? "";
      if (!src) throw new Error("full-length direct stream not available for offline");
      const url = offlineProxyUrl(src);
      const cache = await caches.open(CACHE);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`download ${res.status}`);
      await cache.put(url, res);
      const items = [...get().items, { ...t, audioUrl: src, fullUrl: src }];
      save(items);
      set({ items });
    } finally {
      set({ downloading: get().downloading.filter((id) => id !== t.id) });
    }
  },

  remove: async (t) => {
    const cache = await caches.open(CACHE);
    const stored = get().items.find((x) => key(x) === key(t));
    await cache.delete(offlineProxyUrl(stored?.audioUrl ?? t.audioUrl));
    const items = get().items.filter((x) => key(x) !== key(t));
    save(items);
    set({ items });
  },

  clear: async () => {
    await caches.delete(CACHE);
    save([]);
    set({ items: [] });
  },
}));

export function isDownloadedUrl(raw: string) {
  try {
    return load().some((t) => t.audioUrl === raw);
  } catch {
    return false;
  }
}
