"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Clock3, Crown, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FadeImg from "@/components/FadeImg";
import { apiGet } from "@/lib/api";

interface Insights {
  topTracks: { id: number; title: string; artist: string; coverUrl: string; plays: number }[];
  topArtists: { artist: string; plays: number }[];
  topGenres: { genre: string; plays: number }[];
  totalPlays: number;
  totalMinutes: number;
}

export default function StatsPage() {
  const router = useRouter();
  const [d, setD] = useState<Insights | null>(null);

  useEffect(() => {
    apiGet<Insights>("/api/insights")
      .then(setD)
      .catch(() => {});
  }, []);

  const maxArtist = d?.topArtists[0]?.plays ?? 1;
  const maxGenre = d?.topGenres[0]?.plays ?? 1;

  return (
    <div className="px-5 pb-44 pt-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/85"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight">Your Sound</h1>
          <p className="text-[11.5px] text-white/40">Listening insights</p>
        </div>
      </div>

      {/* Hero numbers */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass sheen mt-6 grid grid-cols-2 gap-3 rounded-[26px] p-5"
      >
        <div>
          <p className="font-display text-[34px] font-bold leading-none text-[color:var(--acc)]">
            {d?.totalMinutes ?? "—"}
          </p>
          <p className="mt-1 text-[11px] font-semibold tracking-wider text-white/40">MINUTES</p>
        </div>
        <div>
          <p className="font-display text-[34px] font-bold leading-none text-[color:var(--acc)]">
            {d?.totalPlays ?? "—"}
          </p>
          <p className="mt-1 text-[11px] font-semibold tracking-wider text-white/40">PLAYS</p>
        </div>
      </motion.div>

      {/* Top tracks */}
      <Section icon={<Crown className="h-4 w-4" />} title="TOP SONGS">
        {d?.topTracks.length ? (
          d.topTracks.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 text-center font-display text-[15px] font-bold text-white/25">
                {i + 1}
              </span>
              <FadeImg src={t.coverUrl} alt="" className="h-11 w-11 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-white/90">{t.title}</p>
                <p className="truncate text-[11.5px] text-white/40">{t.artist}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[color:var(--acc)]/15 px-2.5 py-1 text-[11px] font-bold text-[color:var(--acc)]">
                {t.plays}×
              </span>
            </div>
          ))
        ) : (
          <Empty />
        )}
      </Section>

      {/* Top artists with bars */}
      <Section icon={<Flame className="h-4 w-4" />} title="TOP ARTISTS">
        {d?.topArtists.length ? (
          <div className="space-y-3 px-4 py-4">
            {d.topArtists.map((a) => (
              <Link
                key={a.artist}
                href={`/artist/${encodeURIComponent(a.artist)}`}
                className="block"
              >
                <div className="flex items-center justify-between text-[13px]">
                  <span className="truncate pr-3 font-semibold text-white/85">{a.artist}</span>
                  <span className="shrink-0 text-[11px] text-white/40">{a.plays}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: a.plays / maxArtist }}
                    transition={{ type: "spring", damping: 26, stiffness: 160 }}
                    style={{ transformOrigin: "left" }}
                    className="h-full rounded-full bg-[color:var(--acc)]"
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Genres */}
      <Section icon={<TrendingUp className="h-4 w-4" />} title="TOP GENRES">
        {d?.topGenres.length ? (
          <div className="flex flex-wrap gap-2 p-4">
            {d.topGenres.map((g) => (
              <span
                key={g.genre}
                className="rounded-full border border-[color:var(--acc)]/30 bg-[color:var(--acc)]/10 px-3.5 py-2 text-[12.5px] font-bold text-[color:var(--acc)]"
                style={{ fontSize: `${11 + (g.plays / maxGenre) * 4}px` }}
              >
                {g.genre}
              </span>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-7">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-[color:var(--acc)]">{icon}</span>
        <h2 className="text-[11px] font-extrabold tracking-[0.24em] text-white/45">{title}</h2>
      </div>
      <div className="glass overflow-hidden rounded-[24px]">{children}</div>
    </motion.section>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center py-10">
      <Clock3 className="h-7 w-7 text-white/15" />
      <p className="mt-2.5 text-[13px] text-white/35">Kuch gaane suno, phir yahan dikhega</p>
    </div>
  );
}
