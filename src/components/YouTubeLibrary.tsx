"use client";

import { ListVideo, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { usePlayer } from "@/lib/player";
import { toast } from "@/lib/toast";
import type { Track } from "@/lib/types";

interface YtPlaylist {
  id: string;
  title: string;
  count: number;
  thumb: string;
}

/** Shown only for Google-signed-in users: their own YouTube playlists, playable in full. */
export default function YouTubeLibrary() {
  const [lists, setLists] = useState<YtPlaylist[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const playQueue = usePlayer((s) => s.playQueue);

  useEffect(() => {
    apiGet<{ playlists: YtPlaylist[] }>("/api/youtube/library")
      .then((d) => setLists(d.playlists))
      .catch(() => setLists(null));
  }, []);

  if (!lists) return null;

  const open = async (p: YtPlaylist) => {
    if (busy) return;
    setBusy(p.id);
    try {
      const d = await apiGet<{ items: Track[] }>(
        `/api/youtube/library?list=${encodeURIComponent(p.id)}`,
      );
      if (!d.items.length) toast("Is playlist mein songs nahi mile");
      else {
        playQueue(d.items, 0);
        toast(`Playing ${p.title}`);
      }
    } catch {
      toast("YouTube playlist load nahi hui");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mt-7">
      <h2 className="mb-3 text-[12px] font-bold tracking-[0.2em] text-white/40">YOUR YOUTUBE</h2>
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
        {lists.map((p) => (
          <button
            key={p.id}
            onClick={() => open(p)}
            className="w-[120px] shrink-0 text-left active:scale-[0.97]"
          >
            <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
              {p.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumb} alt="" className="h-full w-full object-cover" />
              ) : (
                <ListVideo className="h-8 w-8 text-white/40" />
              )}
              {busy === p.id && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/55">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </span>
              )}
            </span>
            <span className="mt-1.5 block truncate text-[12.5px] font-semibold text-white/85">
              {p.title}
            </span>
            {p.count > 0 && (
              <span className="block text-[11px] text-white/40">{p.count} videos</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
