"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Clock3, Play, Shuffle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AlbumCard from "@/components/AlbumCard";
import TrackRow from "@/components/TrackRow";
import { apiGet } from "@/lib/api";
import { usePlayer } from "@/lib/player";
import type { Album, Track } from "@/lib/types";
import { formatTime, vibrate } from "@/lib/utils";

interface AlbumData {
  album: Album;
  tracks: Track[];
  more: Album[];
}

export default function AlbumPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const playQueue = usePlayer((s) => s.playQueue);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const shuffle = usePlayer((s) => s.shuffle);

  const [data, setData] = useState<AlbumData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiGet<AlbumData>(`/api/albums/${slug}`)
      .then(setData)
      .catch(() => setNotFound(true));
  }, [slug]);

  const totalSec = data?.tracks.reduce((a, t) => a + t.durationSec, 0) ?? 0;

  return (
    <div className="pb-44">
      {/* Hero */}
      <div className="relative">
        {data && (
          <div
            className="pointer-events-none absolute inset-0 h-[420px] overflow-hidden"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.album.coverUrl}
              alt=""
              className="h-full w-full scale-150 object-cover opacity-35 blur-3xl saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07070b]/60 to-[#07070b]" />
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

          {notFound && <p className="py-24 text-center text-white/50">Album not found.</p>}

          {data ? (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 240 }}
              className="mt-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.album.coverUrl}
                alt={data.album.title}
                draggable={false}
                className="mx-auto w-52 rounded-[26px] border border-white/10 object-cover"
                style={{
                  boxShadow: `0 40px 100px -20px hsla(${data.album.hue}, 95%, 62%, 0.4), 0 24px 60px -16px rgba(0,0,0,0.9)`,
                }}
              />
              <h1 className="mt-6 text-center font-display text-[24px] font-bold leading-tight tracking-tight">
                {data.album.title}
              </h1>
              <p className="mt-1.5 text-center text-[13px] text-white/50">
                {data.album.artist} · {data.album.year} · {data.album.genre}
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-white/35">
                <Clock3 className="h-3 w-3" />
                {data.tracks.length} tracks · {formatTime(totalSec)}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    vibrate(10);
                    playQueue(data.tracks, 0);
                  }}
                  className="glow-lime flex flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--acc)] py-3.5 text-[14.5px] font-bold text-black"
                >
                  <Play className="h-4 w-4 fill-black" /> Play
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    vibrate(8);
                    if (!shuffle) toggleShuffle();
                    const start = Math.floor(Math.random() * data.tracks.length);
                    playQueue(data.tracks, start);
                  }}
                  className="glass-soft flex h-[50px] w-[50px] items-center justify-center rounded-full text-white/85"
                  aria-label="Shuffle play"
                >
                  <Shuffle className="h-[18px] w-[18px]" />
                </motion.button>
              </div>
            </motion.div>
          ) : !notFound ? (
            <div className="mt-6">
              <div className="mx-auto h-52 w-52 animate-pulse rounded-[26px] bg-white/[0.05]" />
              <div className="mx-auto mt-6 h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ) : null}
        </div>
      </div>

      {/* Tracks */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mx-3 mt-7"
        >
          {data.tracks.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              tracks={data.tracks}
              index={i}
              showCover={false}
              numbered
            />
          ))}
        </motion.div>
      )}

      {/* More albums */}
      {data && data.more.length > 0 && (
        <div className="mt-10 px-5">
          <h2 className="mb-3 font-display text-[16px] font-bold tracking-tight text-white/90">
            Keep exploring
          </h2>
          <div className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
            {data.more.map((a) => (
              <AlbumCard key={a.id} album={a} width={140} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
