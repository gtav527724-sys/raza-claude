"use client";

import { trackKey } from "./playable";
import type { Track } from "./types";

export interface Resolved {
  youtubeIds: string[];
  fullUrl?: string;
  audiusId?: string;
}

const memo = new Map<string, Promise<Resolved | null>>();

/**
 * Finds the full-length version of a preview-only track (Audius mp3 or YouTube).
 * Results are memoised so prefetching the next songs makes skips instant.
 */
export function resolveFull(track: Track): Promise<Resolved | null> {
  const key = trackKey(track);
  const hit = memo.get(key);
  if (hit) return hit;
  const qs = new URLSearchParams({
    title: track.title,
    artist: track.artist,
    dur: String(track.durationSec || 0),
  });
  const p = (async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`/api/resolve?${qs}`, { signal: AbortSignal.timeout(25000) });
        if (res.ok) {
          const d = (await res.json()) as Resolved;
          if (d.fullUrl || d.youtubeIds?.length) return d;
        }
      } catch {
        /* retry once */
      }
    }
    return null;
  })();
  memo.set(key, p);
  p.then((r) => {
    if (!r) memo.delete(key); // allow a later retry
  });
  return p;
}

export function prefetchFull(track: Track | undefined) {
  if (!track) return;
  void resolveFull(track);
}
