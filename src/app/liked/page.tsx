"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Heart, Play, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TrackRow from "@/components/TrackRow";
import { apiGet } from "@/lib/api";
import { useLibrary } from "@/lib/library";
import { usePlayer } from "@/lib/player";
import type { Track } from "@/lib/types";
import { vibrate } from "@/lib/utils";

export default function LikedPage() {
  const router = useRouter();
  const version = useLibrary((s) => s.version);
  const playQueue = usePlayer((s) => s.playQueue);
  const shuffle = usePlayer((s) => s.shuffle);
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [sort, setSort] = useState<"newest" | "title" | "artist" | "album">("newest");

  useEffect(() => {
    apiGet<{ tracks: Track[] }>("/api/liked")
      .then((d) => setTracks(d.tracks))
      .catch(() => setTracks([]));
  }, [version]);

  const playAll = () => {
    if (!tracks?.length) return;
    vibrate(10);
    const start = shuffle ? Math.floor(Math.random() * tracks.length) : 0;
    playQueue(tracks, start);
  };

  return (
    <div className="px-5 pb-44 pt-3">
      <button
        onClick={() => router.back()}
        className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/85"
        aria-label="Back"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 240 }}
      >
        <div
          className="mx-auto mt-6 flex h-44 w-44 items-center justify-center rounded-[28px] border border-white/10 shadow-[0_30px_80px_-20px_rgba(139,92,246,0.35)]"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.85), rgba(198,255,63,0.55))",
          }}
        >
          <Heart className="h-16 w-16 fill-white text-white drop-shadow-lg" />
        </div>

        <h1 className="mt-6 text-center font-display text-[24px] font-bold tracking-tight">
          Liked Songs
        </h1>
        <p className="mt-1 text-center text-[13px] text-white/45">
          {tracks ? `${tracks.length} song${tracks.length === 1 ? "" : "s"} you love` : "…"}
        </p>

        {tracks && tracks.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={playAll}
            className="mx-auto mt-5 flex items-center gap-2 rounded-full bg-[color:var(--acc)] px-7 py-3 text-[14.5px] font-bold text-black shadow-[0_10px_35px_rgba(198,255,63,0.3)]"
          >
            <Play className="h-4 w-4 fill-black" /> Play all
          </motion.button>
        )}
      </motion.div>

      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar px-1">
        {(
          [
            ["newest", "Recently added"],
            ["title", "Title"],
            ["artist", "Artist"],
            ["album", "Album"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-bold transition ${sort === k ? "bg-[color:var(--acc)] text-black" : "glass-soft text-white/60"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="-mx-2 mt-5">
        {tracks === null ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2.5">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-white/[0.05]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ))
        ) : tracks.length === 0 ? (
          <div className="px-2 py-14 text-center">
            <Heart className="mx-auto h-9 w-9 text-white/15" />
            <p className="mt-3 text-[14px] font-medium text-white/40">
              Nothing here yet. Tap the heart on any song.
            </p>
          </div>
        ) : (
          (() => {
            const sorted = [...tracks];
            if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
            else if (sort === "artist") sorted.sort((a, b) => a.artist.localeCompare(b.artist));
            else if (sort === "album")
              sorted.sort((a, b) => a.albumTitle.localeCompare(b.albumTitle));
            return sorted.map((t, i) => (
              <TrackRow key={t.id} track={t} tracks={sorted} index={i} />
            ));
          })()
        )}
      </div>
    </div>
  );
}
