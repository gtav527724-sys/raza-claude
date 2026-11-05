"use client";

import { Loader2, Mic2, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Sheet from "@/components/Sheet";
import { usePlayer } from "@/lib/player";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TimedLine {
  time: number;
  text: string;
}

export default function LyricsSheet({
  open,
  onClose,
  track,
}: {
  open: boolean;
  onClose: () => void;
  track: Track | null;
}) {
  const [lines, setLines] = useState<string[] | null>(null);
  const [timed, setTimed] = useState<TimedLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const activeRef = useRef<HTMLParagraphElement | null>(null);
  const key = track ? `${track.artist}|${track.title}` : "";

  useEffect(() => {
    if (!open || !track) return;
    const controller = new AbortController();
    let alive = true;
    queueMicrotask(() => alive && setLoading(true));
    fetch(
      `/api/lyrics?artist=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.title)}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((d: { lyrics: string[] | null; timed: TimedLine[] | null }) => {
        if (!alive) return;
        setLines(d.lyrics);
        setTimed(d.timed);
      })
      .catch(() => {
        if (!alive) return;
        setLines(null);
        setTimed(null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
      controller.abort();
    };
  }, [open, key, track]);

  const display = useMemo(() => {
    if (timed?.length) return timed;
    return (lines ?? []).map((text, i, arr) => ({
      text,
      time: duration > 0 ? (i / Math.max(1, arr.length)) * duration : i * 4,
    }));
  }, [timed, lines, duration]);

  const active = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < display.length; i++) {
      if (display[i].time <= currentTime + 0.25) idx = i;
      else break;
    }
    return idx;
  }, [display, currentTime]);

  useEffect(() => {
    if (!open) return;
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active, open]);

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex max-h-[72vh] flex-col px-5 pb-8 pt-3">
        <div className="flex items-center gap-2 px-1 pb-3">
          <Mic2 className="h-4 w-4 text-[color:var(--acc)]" />
          <p className="text-[11px] font-bold tracking-[0.28em] text-white/45">
            {timed?.length ? "SYNCED LYRICS" : "LYRICS"}
          </p>
          {display.length > 0 && track && (
            <button
              onClick={async () => {
                const text = `${track.title} — ${track.artist}\n\n${display
                  .slice(0, 12)
                  .map((l) => l.text)
                  .join("\n")}`;
                try {
                  if (navigator.share)
                    await navigator.share({ title: `Lyrics: ${track.title}`, text });
                  else await navigator.clipboard.writeText(text);
                } catch {
                  // share cancelled
                }
              }}
              className="ml-auto rounded-full bg-white/[0.07] p-2 text-white/50"
              aria-label="Share lyrics"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {track && (
          <p className="truncate px-1 pb-3 text-[13px] font-semibold text-white/70">
            {track.title} · <span className="text-white/40">{track.artist}</span>
          </p>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-1 py-4">
          {loading ? (
            <div className="space-y-3 py-4">
              {[75, 90, 62, 84, 70].map((w, i) => (
                <div
                  key={i}
                  className="h-5 animate-pulse rounded bg-white/[0.06]"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ) : display.length ? (
            <div className="space-y-3 pb-16 pt-[30vh]">
              {display.map((l, i) => (
                <p
                  key={`${l.time}-${i}`}
                  ref={i === active ? activeRef : undefined}
                  className={cn(
                    "origin-left text-[18px] font-bold leading-relaxed transition-all duration-300",
                    l.text === "" && "h-3",
                    i === active
                      ? "scale-[1.03] text-[color:var(--acc)] drop-shadow-[0_0_14px_color-mix(in_srgb,var(--acc)_45%,transparent)]"
                      : i < active
                        ? "text-white/25"
                        : "text-white/70",
                  )}
                >
                  {l.text}
                </p>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Mic2 className="mx-auto h-8 w-8 text-white/15" />
              <p className="mt-3 text-[13.5px] text-white/40">Is gaane ke lyrics nahi mile</p>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
