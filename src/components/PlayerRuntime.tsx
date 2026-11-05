"use client";

import { useEffect } from "react";
import { ensureAudio, usePlayer } from "@/lib/player";
import { useSettings } from "@/lib/settings";
import { getTheme } from "@/lib/themes";
import { toast } from "@/lib/toast";

export default function PlayerRuntime() {
  const current = usePlayer((s) => s.queue[s.index] ?? null);
  const currentId = current?.id;
  const dynamicColors = useSettings((s) => s.dynamicColors);
  const themeId = useSettings((s) => s.themeId);
  const customAccent = useSettings((s) => s.accent);
  const notifications = useSettings((s) => s.notifications);

  // Warm the audio engine once so listeners exist before any playback.
  useEffect(() => {
    ensureAudio().volume = usePlayer.getState().volume;
  }, []);

  // Headphone / audio-output disconnect: pause before sound leaks from speakers.
  useEffect(() => {
    const media = navigator.mediaDevices;
    if (!media?.enumerateDevices) return;
    let previousOutputs = 0;
    let active = true;
    const count = async () => {
      try {
        const devices = await media.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === "audiooutput").length;
        if (
          active &&
          previousOutputs > 0 &&
          outputs < previousOutputs &&
          usePlayer.getState().isPlaying
        ) {
          usePlayer.getState().toggle();
          toast("Headphones disconnected — playback paused");
        }
        previousOutputs = outputs;
      } catch {
        // Device enumeration is optional.
      }
    };
    count();
    media.addEventListener?.("devicechange", count);
    return () => {
      active = false;
      media.removeEventListener?.("devicechange", count);
    };
  }, []);

  // Android lock-screen / notification controls
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      if (!notifications) {
        for (const action of [
          "play",
          "pause",
          "nexttrack",
          "previoustrack",
        ] as MediaSessionAction[]) {
          navigator.mediaSession.setActionHandler(action, null);
        }
        navigator.mediaSession.metadata = null;
        return;
      }
      navigator.mediaSession.setActionHandler("play", () => {
        if (!usePlayer.getState().isPlaying) usePlayer.getState().toggle();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (usePlayer.getState().isPlaying) usePlayer.getState().toggle();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => usePlayer.getState().next(false));
      navigator.mediaSession.setActionHandler("previoustrack", () => usePlayer.getState().prev());
    } catch {
      /* unsupported */
    }
  }, [notifications]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!notifications || !currentId || !current) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: current.albumTitle,
        artwork: [
          {
            src: new URL(current.coverUrl, window.location.origin).href,
            sizes: "1024x1024",
            type: "image/jpeg",
          },
        ],
      });
    } catch {
      /* unsupported */
    }
  }, [currentId, current, notifications]);

  useEffect(() => {
    const root = document.documentElement;
    if (!dynamicColors || !current) {
      root.style.setProperty("--acc", customAccent || getTheme(themeId).acc);
      return;
    }
    const seed = `${current.coverUrl}|${current.title}`;
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360;
    // Stay vivid and readable; global on-accent remains dark.
    root.style.setProperty("--acc", `hsl(${h} 86% 66%)`);
  }, [currentId, current, dynamicColors, themeId, customAccent]);

  return null;
}
