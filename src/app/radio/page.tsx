"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Radio as RadioIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TrackRow from "@/components/TrackRow";
import { apiGet } from "@/lib/api";
import { usePlayer } from "@/lib/player";
import type { Track } from "@/lib/types";
import { cn, vibrate } from "@/lib/utils";

const MOODS = [
  { id: "chill", label: "Chill", emoji: "🌿", g: "from-emerald-400/25 to-teal-700/20" },
  { id: "workout", label: "Workout", emoji: "🔥", g: "from-orange-400/25 to-red-700/20" },
  { id: "focus", label: "Focus", emoji: "🎯", g: "from-blue-400/25 to-indigo-700/20" },
  { id: "party", label: "Party", emoji: "🎉", g: "from-fuchsia-400/25 to-purple-700/20" },
  { id: "sad", label: "Feels", emoji: "💧", g: "from-slate-400/25 to-blue-800/20" },
  { id: "romance", label: "Romance", emoji: "💗", g: "from-pink-400/25 to-rose-700/20" },
  { id: "sleep", label: "Sleep", emoji: "🌙", g: "from-indigo-400/25 to-slate-800/20" },
  { id: "drive", label: "Night Drive", emoji: "🌃", g: "from-violet-400/25 to-cyan-800/20" },
];

export default function RadioPage() {
  const router = useRouter();
  const playQueue = usePlayer((s) => s.playQueue);
  const [active, setActive] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [loading, setLoading] = useState(false);

  const start = async (mood: string, autoplay = true) => {
    vibrate(10);
    setActive(mood);
    setLoading(true);
    setTracks(null);
    try {
      const d = await apiGet<{ tracks: Track[] }>(`/api/radio?mood=${mood}`);
      setTracks(d.tracks);
      if (autoplay && d.tracks.length) playQueue(d.tracks, 0);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="font-display text-[22px] font-bold tracking-tight">Mood Radio</h1>
          <p className="text-[11.5px] text-white/40">Endless stations, one tap</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {MOODS.map((m) => (
          <motion.button
            key={m.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => start(m.id)}
            className={cn(
              "relative h-24 overflow-hidden rounded-[22px] bg-gradient-to-br text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
              m.g,
              active === m.id ? "border-2 border-[color:var(--acc)]" : "border border-white/[0.1]",
            )}
          >
            <span className="absolute right-3 top-3 text-[26px]">{m.emoji}</span>
            <span className="absolute bottom-3 left-4 font-display text-[15px] font-bold text-white">
              {m.label}
            </span>
            {active === m.id && loading && (
              <span className="absolute bottom-3 right-3">
                <Loader2 className="h-4 w-4 animate-spin text-white/70" />
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {tracks && tracks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <div className="mb-1 flex items-center gap-2 px-1">
            <RadioIcon className="h-4 w-4 text-[color:var(--acc)]" />
            <h2 className="text-[11px] font-extrabold tracking-[0.24em] text-white/45">
              NOW ON AIR · {tracks.length}
            </h2>
          </div>
          <div className="-mx-2">
            {tracks.map((t, i) => (
              <TrackRow key={`${t.source}-${t.id}-${i}`} track={t} tracks={tracks} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {tracks && tracks.length === 0 && !loading && (
        <p className="mt-10 text-center text-[13.5px] text-white/35">
          Station load nahi hui — dobara try karo
        </p>
      )}
    </div>
  );
}
