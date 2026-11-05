"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Play, Shuffle, UserRound } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FadeImg from "@/components/FadeImg";
import TrackRow from "@/components/TrackRow";
import { apiGet } from "@/lib/api";
import { usePlayer } from "@/lib/player";
import type { Track } from "@/lib/types";
import { vibrate } from "@/lib/utils";

export default function ArtistPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const decoded = decodeURIComponent(name ?? "");
  const playQueue = usePlayer((s) => s.playQueue);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const shuffle = usePlayer((s) => s.shuffle);

  const [data, setData] = useState<{
    tracks: Track[];
    albums: { title: string; coverUrl: string }[];
  } | null>(null);

  useEffect(() => {
    apiGet<{ tracks: Track[]; albums: { title: string; coverUrl: string }[] }>(
      `/api/artist?name=${encodeURIComponent(decoded)}`,
    )
      .then(setData)
      .catch(() => setData({ tracks: [], albums: [] }));
  }, [decoded]);

  const hero = data?.tracks[0]?.coverUrl;

  return (
    <div className="pb-44">
      <div className="relative">
        {hero && (
          <div className="pointer-events-none absolute inset-0 h-80 overflow-hidden" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero}
              alt=""
              className="h-full w-full scale-150 object-cover opacity-30 blur-3xl saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg)]/60 to-[var(--bg)]" />
          </div>
        )}
        <div className="relative px-5 pt-3">
          <button
            onClick={() => router.back()}
            className="glass flex h-10 w-10 items-center justify-center rounded-full text-white/90"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 240 }}
            className="mt-6 flex flex-col items-center"
          >
            {hero ? (
              <FadeImg
                src={hero}
                alt={decoded}
                className="h-32 w-32 rounded-full border-2 border-white/10 object-cover shadow-[0_24px_60px_-18px_rgba(0,0,0,0.9)]"
              />
            ) : (
              <div className="glass flex h-32 w-32 items-center justify-center rounded-full">
                <UserRound className="h-14 w-14 text-white/25" />
              </div>
            )}
            <h1 className="mt-5 text-center font-display text-[22px] font-bold leading-tight tracking-tight">
              {decoded}
            </h1>
            <p className="mt-1 text-[12.5px] text-white/45">
              {data ? `${data.tracks.length} songs available` : "Loading…"}
            </p>

            {data && data.tracks.length > 0 && (
              <div className="mt-5 flex w-full items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    vibrate(10);
                    playQueue(data.tracks, 0);
                  }}
                  className="glow-lime flex flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--acc)] py-3.5 text-[14.5px] font-bold text-[color:var(--on-acc)]"
                >
                  <Play className="h-4 w-4 fill-current" /> Play all
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    vibrate(8);
                    if (!shuffle) toggleShuffle();
                    playQueue(data.tracks, Math.floor(Math.random() * data.tracks.length));
                  }}
                  className="glass-soft flex h-[50px] w-[50px] items-center justify-center rounded-full text-white/85"
                  aria-label="Shuffle"
                >
                  <Shuffle className="h-[18px] w-[18px]" />
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {data && data.albums.length > 0 && (
        <div className="mt-8 px-5">
          <h2 className="mb-3 text-[12px] font-bold tracking-[0.2em] text-white/40">APPEARS ON</h2>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {data.albums.map((a) => (
              <div key={a.title} className="w-[130px] shrink-0">
                <FadeImg
                  src={a.coverUrl}
                  alt={a.title}
                  loading="lazy"
                  className="aspect-square w-full rounded-xl border border-white/[0.07] object-cover"
                />
                <p className="mt-1.5 truncate text-[12px] font-semibold text-white/80">{a.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-3 mt-8">
        <h2 className="mb-1 px-2 text-[12px] font-bold tracking-[0.2em] text-white/40">SONGS</h2>
        {data === null
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                <div className="h-12 w-12 animate-pulse rounded-xl bg-white/[0.05]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ))
          : data.tracks.map((t, i) => (
              <TrackRow key={`${t.source}-${t.id}`} track={t} tracks={data.tracks} index={i} />
            ))}
      </div>
    </div>
  );
}
