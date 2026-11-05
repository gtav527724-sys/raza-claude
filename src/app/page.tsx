"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Globe2,
  Music4,
  Play,
  Radio,
  Settings2,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AlbumCard from "@/components/AlbumCard";
import FadeImg from "@/components/FadeImg";
import TrackRow from "@/components/TrackRow";
import { apiGet } from "@/lib/api";
import { fallbackHome } from "@/lib/catalog-fallback";
import { useLibrary } from "@/lib/library";
import { usePlayer } from "@/lib/player";
import type { HomeData, Track } from "@/lib/types";
import { greeting, vibrate } from "@/lib/utils";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 24, stiffness: 240 } },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-9 font-display text-[16px] font-bold tracking-tight text-white/90">
      {children}
    </h2>
  );
}

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
      <circle cx="16" cy="16" r="13" fill="none" stroke="var(--acc)" strokeWidth="2.5" />
      <path
        d="M10 18v-4M14 21V11M18 19v-6M22 17v-2"
        stroke="var(--acc)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [charts, setCharts] = useState<Track[] | null>(null);
  const [mix, setMix] = useState<Track[] | null>(null);
  const version = useLibrary((s) => s.version);
  const playQueue = usePlayer((s) => s.playQueue);

  useEffect(() => {
    let alive = true;
    const fallbackTimer = setTimeout(() => {
      if (alive) setData((current) => current ?? fallbackHome());
    }, 6000);
    apiGet<HomeData>("/api/home")
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(fallbackHome()))
      .finally(() => clearTimeout(fallbackTimer));
    return () => {
      alive = false;
      clearTimeout(fallbackTimer);
    };
  }, [version]);

  useEffect(() => {
    apiGet<{ tracks: Track[] }>("/api/dailymix")
      .then((d) => setMix(d.tracks))
      .catch(() => setMix([]));
  }, []);

  useEffect(() => {
    // Lead with full-length Audius trending, then Apple charts
    Promise.all([
      apiGet<{ tracks: Track[] }>("/api/audius").catch(() => ({ tracks: [] as Track[] })),
      apiGet<{ tracks: Track[] }>("/api/charts").catch(() => ({ tracks: [] as Track[] })),
    ])
      .then(([aud, itu]) => setCharts([...aud.tracks.slice(0, 8), ...itu.tracks.slice(0, 12)]))
      .catch(() => setCharts([]));
  }, []);

  const playFeatured = async () => {
    if (!data) return;
    vibrate(10);
    try {
      const d = await apiGet<{ tracks: Track[] }>(`/api/albums/${data.featured.slug}`);
      playQueue(d.tracks, 0);
    } catch {
      /* noop */
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="px-5 pb-44 pt-3">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <BrandMark />
        <span className="font-display text-[11px] font-bold tracking-[0.35em] text-white/50">
          SONARA
        </span>
        <Link
          href="/settings"
          aria-label="Settings"
          className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition active:scale-90 active:text-white"
        >
          <Settings2 className="h-[18px] w-[18px]" />
        </Link>
      </motion.div>

      <motion.p variants={item} className="mt-7 text-[13px] font-medium text-white/45">
        {greeting()}
      </motion.p>
      <motion.h1
        variants={item}
        className="mt-1 font-display text-[26px] font-bold leading-[1.15] tracking-tight"
      >
        Find your
        <br />
        <span className="text-[color:var(--acc)]">frequency.</span>
      </motion.h1>

      {/* Quick actions */}
      <motion.div variants={item} className="mt-5 grid grid-cols-2 gap-3">
        <Link
          href="/radio"
          className="glass sheen relative flex h-[76px] flex-col justify-center overflow-hidden rounded-[20px] px-4"
        >
          <Radio className="absolute -right-2 -top-2 h-16 w-16 text-[color:var(--acc)]/10" />
          <span className="text-[14px] font-bold text-white/90">Mood Radio</span>
          <span className="text-[11px] text-white/40">8 endless stations</span>
        </Link>
        <Link
          href="/stats"
          className="glass sheen relative flex h-[76px] flex-col justify-center overflow-hidden rounded-[20px] px-4"
        >
          <BarChart3 className="absolute -right-2 -top-2 h-16 w-16 text-[color:var(--acc)]/10" />
          <span className="text-[14px] font-bold text-white/90">Your Sound</span>
          <span className="text-[11px] text-white/40">Listening stats</span>
        </Link>
      </motion.div>

      {/* Featured album */}
      {data ? (
        <motion.div
          variants={item}
          className="sheen relative mt-6 overflow-hidden rounded-[26px] border border-white/[0.1]"
          style={{
            boxShadow: `0 34px 90px -28px hsla(${data.featured.hue}, 95%, 62%, 0.42), 0 10px 32px -14px rgba(0,0,0,0.85)`,
          }}
        >
          <Link href={`/album/${data.featured.slug}`} className="block">
            <FadeImg
              src={data.featured.coverUrl}
              alt={data.featured.title}
              className="h-60 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 pr-20">
              <span className="glow-lime rounded-full bg-[color:var(--acc)] px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.2em] text-black">
                ALBUM OF THE DAY
              </span>
              <p className="mt-2.5 font-display text-[21px] font-bold leading-tight">
                {data.featured.title}
              </p>
              <p className="mt-0.5 text-[12.5px] text-white/60">
                {data.featured.artist} · {data.featured.genre} · {data.featured.year}
              </p>
            </div>
          </Link>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={playFeatured}
            className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--acc)] text-black shadow-[0_8px_30px_rgba(198,255,63,0.4)]"
            aria-label="Play featured album"
          >
            <Play className="ml-0.5 h-5 w-5 fill-black" />
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          variants={item}
          className="mt-6 h-60 animate-pulse rounded-[26px] bg-white/[0.05]"
        />
      )}

      {/* Trending worldwide (internet) */}
      {charts && charts.length > 0 && (
        <motion.div variants={item} initial={false}>
          <div className="mb-3 mt-9 flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-[color:var(--acc)]" />
            <h2 className="font-display text-[16px] font-bold tracking-tight text-white/90">
              Trending worldwide
            </h2>
          </div>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {charts.map((t, i) => (
              <motion.button
                key={`${t.source}-${t.itunesId ?? t.audiusId ?? t.id}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  vibrate(6);
                  playQueue(charts, i);
                }}
                className="w-[140px] shrink-0 text-left"
              >
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.07]">
                  <FadeImg
                    src={t.coverUrl}
                    alt={t.title}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-extrabold tracking-widest text-white/80 backdrop-blur">
                    #{i + 1}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[12px] font-semibold text-white/85">{t.title}</p>
                <p className="truncate text-[10.5px] text-white/40">{t.artist}</p>
              </motion.button>
            ))}
          </div>
          <p className="mt-1 px-0.5 text-[10px] tracking-wide text-white/25">
            Live charts · 30-second previews via Apple Music
          </p>
        </motion.div>
      )}

      {/* Jump back in */}
      {data && data.recent.length > 0 && (
        <motion.div variants={item} initial={false}>
          <SectionTitle>Jump back in</SectionTitle>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {data.recent.map((t) => (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  vibrate(6);
                  playQueue(data.recent, data.recent.indexOf(t));
                }}
                className="w-[118px] shrink-0 text-left"
              >
                <FadeImg
                  src={t.coverUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full rounded-xl border border-white/[0.07] object-cover"
                />
                <p className="mt-1.5 truncate text-[12px] font-semibold text-white/85">{t.title}</p>
                <p className="truncate text-[10.5px] text-white/40">{t.artist}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Fresh drops */}
      <motion.div variants={item} initial={false}>
        <SectionTitle>Fresh drops</SectionTitle>
        <div className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
          {data
            ? data.albums.map((a) => <AlbumCard key={a.id} album={a} />)
            : [0, 1, 2, 3].map((i) => (
                <div key={i} className="w-40 shrink-0 animate-pulse">
                  <div className="aspect-square rounded-2xl bg-white/[0.05]" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-white/[0.06]" />
                </div>
              ))}
        </div>
      </motion.div>

      {/* Daily mix */}
      {mix && mix.length > 0 && (
        <motion.div variants={item} initial={false}>
          <div className="mb-3 mt-9 flex items-center gap-2 px-1">
            <CalendarDays className="h-4 w-4 text-[color:var(--acc)]" />
            <h2 className="font-display text-[16px] font-bold tracking-tight text-white/90">
              Daily Mix
            </h2>
            <span className="ml-auto text-[10px] font-bold tracking-widest text-white/25">
              FOR YOU
            </span>
          </div>
          <div className="-mx-2">
            {mix.slice(0, 6).map((t, i) => (
              <TrackRow key={`mix-${t.id}`} track={t} tracks={mix} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick picks */}
      <motion.div variants={item} initial={false}>
        <SectionTitle>Quick picks</SectionTitle>
        <div className="-mx-2">
          {data
            ? data.quickPicks.map((t, i) => (
                <TrackRow key={t.id} track={t} tracks={data.quickPicks} index={i} />
              ))
            : [0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-white/[0.05]" />
                  <div className="flex-1">
                    <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
                    <div className="mt-1.5 h-2.5 w-1/3 animate-pulse rounded bg-white/[0.04]" />
                  </div>
                </div>
              ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
