"use client";

import { create } from "zustand";
import { trackKey } from "./playable";
import { toast } from "./toast";
import type { Track } from "./types";
import { vibrate } from "./utils";

interface LibraryState {
  /** Stable provider keys of liked tracks ("itunes:1", "yt:abc", "local:5"…). */
  likedKeys: string[];
  version: number;
  loaded: boolean;
  setLiked: (keys: string[]) => void;
  reload: () => Promise<void>;
  bump: () => void;
  isLiked: (track: Track) => boolean;
  toggleLikeSmart: (track: Track) => Promise<boolean>;
}

const HEADERS = { "Content-Type": "application/json", "X-Sonara-Client": "app" };

export const useLibrary = create<LibraryState>((set, get) => ({
  likedKeys: [],
  version: 0,
  loaded: false,

  setLiked: (keys) => set({ likedKeys: keys, loaded: true }),

  reload: async () => {
    try {
      const res = await fetch("/api/liked?ids=1", { cache: "no-store" });
      if (!res.ok) return;
      const d = (await res.json()) as { keys?: string[] };
      set({ likedKeys: d.keys ?? [], loaded: true });
    } catch {
      /* keep optimistic state */
    }
  },

  bump: () => set({ version: get().version + 1 }),

  isLiked: (track) => get().likedKeys.includes(trackKey(track)),

  /** One request: saves the track (any provider) AND toggles the like. Rolls back on failure. */
  toggleLikeSmart: async (track) => {
    const key = trackKey(track);
    const was = get().likedKeys.includes(key);
    vibrate(12);
    set({
      likedKeys: was ? get().likedKeys.filter((k) => k !== key) : [...get().likedKeys, key],
      version: get().version + 1,
    });
    try {
      const body =
        track.id > 0 && !track.extKey && !track.itunesId && !track.audiusId && !track.youtubeId
          ? { trackId: track.id, like: !was }
          : { track, like: !was };
      let res = await fetch("/api/liked", {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // one quick retry covers cold-start / transient DB hiccups
        await new Promise((r) => setTimeout(r, 600));
        res = await fetch("/api/liked", {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) throw new Error(`like failed ${res.status}`);
      const data = (await res.json()) as { track?: Track | null };
      if (data.track && track.id !== data.track.id) {
        const { usePlayer } = await import("./player");
        usePlayer.getState().replaceTrack(track.id, data.track);
      }
      return !was;
    } catch {
      set({
        likedKeys: was ? [...get().likedKeys, key] : get().likedKeys.filter((k) => k !== key),
      });
      toast("Like save nahi hua — internet check karein");
      return was;
    }
  },
}));
