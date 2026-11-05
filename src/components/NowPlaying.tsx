"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlarmClock,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ListX,
  Mic2,
  Redo2,
  SlidersVertical,
  Undo2,
  Heart,
  ListMusic,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";
import AudioVisualizer from "@/components/AudioVisualizer";
import EqBars from "@/components/EqBars";
import FadeImg from "@/components/FadeImg";
import Marquee from "@/components/Marquee";
import Sheet from "@/components/Sheet";
import SleepSheet from "@/components/SleepSheet";
import EqualizerSheet from "@/components/EqualizerSheet";
import LyricsSheet from "@/components/LyricsSheet";
import Link from "next/link";
import { useLibrary } from "@/lib/library";
import { trackKey } from "@/lib/playable";
import { usePlayer } from "@/lib/player";
import { cn, formatTime, vibrate } from "@/lib/utils";

function Slider({
  value,
  max,
  onScrub,
  onCommit,
  slim = false,
  label,
}: {
  value: number;
  max: number;
  onScrub: (v: number) => void;
  onCommit?: (v: number) => void;
  slim?: boolean;
  label?: string;
}) {
  const pct = max > 0.0001 ? (value / max) * 100 : 0;
  return (
    <input
      type="range"
      min={0}
      max={Math.max(max, 0.1)}
      step={0.1}
      value={Math.min(value, max)}
      aria-label={label}
      onChange={(e) => onScrub(Number(e.target.value))}
      onPointerUp={() => onCommit?.(value)}
      onKeyUp={() => onCommit?.(value)}
      className={cn("slider w-full", slim && "slider-slim")}
      style={{ "--pct": `${pct}%` } as React.CSSProperties}
    />
  );
}

export default function NowPlaying() {
  const isOpen = usePlayer((s) => s.isOpen);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const buffering = usePlayer((s) => s.buffering);
  const current = usePlayer((s) => s.queue[s.index] ?? null);
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const setOpen = usePlayer((s) => s.setOpen);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const setVolume = usePlayer((s) => s.setVolume);
  const muted = usePlayer((s) => s.muted);
  const muteToggle = usePlayer((s) => s.muteToggle);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const jumpTo = usePlayer((s) => s.jumpTo);
  const nudge = usePlayer((s) => s.nudge);
  const removeAt = usePlayer((s) => s.removeAt);
  const clearQueue = usePlayer((s) => s.clearQueue);
  const moveInQueue = usePlayer((s) => s.moveInQueue);

  const toggleLikeSmart = useLibrary((s) => s.toggleLikeSmart);
  const likedKeys = useLibrary((s) => s.likedKeys);

  const [queueOpen, setQueueOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [eqOpen, setEqOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);
  const sleepAt = usePlayer((s) => s.sleepAt);
  const sleepEndOfTrack = usePlayer((s) => s.sleepEndOfTrack);
  const sleepActive = sleepAt !== null || sleepEndOfTrack;

  const liked = current ? likedKeys.includes(trackKey(current)) : false;
  const dur = duration || current?.durationSec || 0;
  const shown = scrub ?? currentTime;

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          className="absolute inset-0 z-[60] overflow-hidden bg-[#0b0b10]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 32, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 110 || info.velocity.y > 550) setOpen(false);
          }}
        >
          {/* Ambient background from artwork */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <AnimatePresence mode="popLayout">
              <motion.img
                key={current.id}
                src={current.coverUrl}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.42 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0 h-full w-full scale-[1.7] object-cover blur-3xl saturate-150"
                draggable={false}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b10]/70 via-[#0b0b10]/55 to-[#0b0b10]" />
            {/* Rotating luxe aura behind artwork */}
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
              <div className="aura h-[26rem] w-[26rem] rounded-full opacity-50" />
            </div>
            <div className="grain absolute inset-0 opacity-[0.05]" />
          </div>

          <div className="relative flex h-full flex-col px-6 pb-[max(1.4rem,env(safe-area-inset-bottom))] pt-4">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setOpen(false)}
                className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/85"
                aria-label="Close player"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.button>
              <div className="text-center">
                <p className="text-[10px] font-bold tracking-[0.32em] text-white/40">NOW PLAYING</p>
                <p className="mt-0.5 max-w-[180px] truncate text-[12px] font-semibold text-white/70">
                  {current.albumTitle}
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setSleepOpen(true)}
                  className={cn(
                    "glass-soft relative flex h-10 w-10 items-center justify-center rounded-full",
                    sleepActive ? "text-[color:var(--acc)]" : "text-white/85",
                  )}
                  aria-label="Sleep timer"
                >
                  <AlarmClock className="h-[18px] w-[18px]" />
                  {sleepActive && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[color:var(--acc)]" />
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setLyricsOpen(true)}
                  className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/85"
                  aria-label="Lyrics"
                >
                  <Mic2 className="h-[18px] w-[18px]" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setEqOpen(true)}
                  className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/85"
                  aria-label="Equalizer"
                >
                  <SlidersVertical className="h-[18px] w-[18px]" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setQueueOpen(true)}
                  className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/85"
                  aria-label="Queue"
                >
                  <ListMusic className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* Artwork + reflection */}
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-4">
              <motion.div
                key={current.id}
                initial={{ scale: 0.9, opacity: 0, y: 14 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 22, stiffness: 260 }}
                className="relative aspect-square w-full max-w-[315px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.coverUrl}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="absolute inset-0 h-full w-full scale-105 rounded-[32px] object-cover opacity-60 blur-2xl"
                />
                <FadeImg
                  src={current.coverUrl}
                  alt={current.albumTitle}
                  className="relative h-full w-full rounded-[28px] border border-white/10 object-cover shadow-[0_30px_80px_-10px_rgba(0,0,0,0.8)]"
                />
                {/* glass sheen on artwork */}
                <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/[0.12] via-transparent to-transparent" />
              </motion.div>

              {/* Cover Flow-style reflection */}
              <div
                aria-hidden
                className="mt-2 h-14 w-full max-w-[315px] overflow-hidden rounded-[28px] opacity-40 [mask-image:linear-gradient(to_top,rgba(0,0,0,0.5),transparent_72%)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={`ref-${current.id}`}
                  src={current.coverUrl}
                  alt=""
                  draggable={false}
                  className="h-auto w-full -scale-y-100 rounded-[28px] object-cover blur-[1.5px] saturate-125"
                />
              </div>
            </div>

            {/* Glass control deck */}
            <div className="glass sheen rounded-[30px] px-5 pb-5 pt-4">
              {/* Meta + like */}
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <Marquee
                    text={current.title}
                    threshold={26}
                    className="font-display text-[19px] font-bold text-white"
                  />
                  <p className="mt-1 truncate text-[14px] text-white/55">
                    <Link
                      href={`/artist/${encodeURIComponent(current.artist)}`}
                      onClick={() => setOpen(false)}
                      className="underline-offset-2 active:text-[color:var(--acc)] active:underline"
                    >
                      {current.artist}
                    </Link>
                    <span className="text-white/25"> · {current.genre}</span>
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.75 }}
                  onClick={() => {
                    toggleLikeSmart(current);
                  }}
                  className={cn(
                    "glass-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-shadow duration-300",
                    liked && "shadow-[0_0_20px_rgba(198,255,63,0.3)]",
                  )}
                  aria-label="Like"
                >
                  <motion.span
                    key={String(liked)}
                    initial={{ scale: liked ? 0.4 : 1 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 9, stiffness: 500 }}
                  >
                    <Heart
                      className={cn(
                        "h-6 w-6 transition-colors",
                        liked ? "fill-[color:var(--acc)] text-[color:var(--acc)]" : "text-white/55",
                      )}
                    />
                  </motion.span>
                </motion.button>
              </div>

              <AudioVisualizer className="mt-2" />

              {/* Seek */}
              <div className="mt-1">
                <Slider
                  value={shown}
                  max={dur}
                  onScrub={(v) => setScrub(v)}
                  onCommit={(v) => {
                    seek(v);
                    setScrub(null);
                  }}
                  label="Seek"
                />
                <div className="mt-1 flex justify-between text-[11px] font-medium tabular-nums text-white/40">
                  <span>{formatTime(shown)}</span>
                  <span>-{formatTime(Math.max(0, dur - shown))}</span>
                </div>
              </div>

              {/* Quick seek */}
              <div className="mt-1 flex items-center justify-center gap-6">
                <button
                  onClick={() => {
                    vibrate(6);
                    nudge(-10);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-white/45 transition active:scale-90 active:text-white"
                  aria-label="Back 10 seconds"
                >
                  <Undo2 className="h-4 w-4" /> 10s
                </button>
                <button
                  onClick={() => {
                    vibrate(6);
                    nudge(10);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-white/45 transition active:scale-90 active:text-white"
                  aria-label="Forward 10 seconds"
                >
                  10s <Redo2 className="h-4 w-4" />
                </button>
              </div>

              {/* Main controls */}
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    vibrate(8);
                    toggleShuffle();
                  }}
                  className={cn(
                    "glass-soft relative flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90",
                    shuffle ? "text-[color:var(--acc)]" : "text-white/45",
                  )}
                  aria-label="Shuffle"
                >
                  <Shuffle className="h-[19px] w-[19px]" />
                  {shuffle && (
                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[color:var(--acc)]" />
                  )}
                </button>

                <button
                  onClick={() => {
                    vibrate(8);
                    prev();
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white transition active:scale-90"
                  aria-label="Previous"
                >
                  <SkipBack className="h-7 w-7 fill-current" />
                </button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    vibrate(10);
                    toggle();
                  }}
                  className="glow-lime flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[color:var(--acc)] text-black"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {buffering && isPlaying ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-7 w-7 fill-black" />
                  ) : (
                    <Play className="ml-1 h-7 w-7 fill-black" />
                  )}
                </motion.button>

                <button
                  onClick={() => {
                    vibrate(8);
                    next(false);
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white transition active:scale-90"
                  aria-label="Next"
                >
                  <SkipForward className="h-7 w-7 fill-current" />
                </button>

                <button
                  onClick={() => {
                    vibrate(8);
                    cycleRepeat();
                  }}
                  className={cn(
                    "glass-soft relative flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90",
                    repeat !== "off" ? "text-[color:var(--acc)]" : "text-white/45",
                  )}
                  aria-label="Repeat"
                >
                  {repeat === "one" ? (
                    <Repeat1 className="h-[19px] w-[19px]" />
                  ) : (
                    <Repeat className="h-[19px] w-[19px]" />
                  )}
                  {repeat !== "off" && (
                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[color:var(--acc)]" />
                  )}
                </button>
              </div>

              {/* Volume */}
              <div className="mt-4 flex items-center gap-3">
                <Volume2 className="h-4 w-4 shrink-0 text-white/50" />
                <Slider
                  value={volume}
                  max={1}
                  slim
                  onScrub={(v) => setVolume(v)}
                  onCommit={(v) => setVolume(v)}
                  label="Volume"
                />
                <span className="w-8 shrink-0 text-right text-[11px] font-semibold tabular-nums text-white/40">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>

          <LyricsSheet open={lyricsOpen} onClose={() => setLyricsOpen(false)} track={current} />

          <EqualizerSheet open={eqOpen} onClose={() => setEqOpen(false)} />

          {/* Sleep timer sheet */}
          <SleepSheet open={sleepOpen} onClose={() => setSleepOpen(false)} />

          {/* Queue sheet */}
          <Sheet open={queueOpen} onClose={() => setQueueOpen(false)}>
            <div className="flex max-h-[62vh] flex-col px-5 pb-8 pt-3">
              <div className="flex items-center justify-between px-1 pb-2">
                <p className="text-[11px] font-bold tracking-[0.28em] text-white/40">
                  UP NEXT · {queue.length}
                </p>
                <button
                  onClick={() => {
                    vibrate(8);
                    clearQueue();
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-bold text-white/60"
                >
                  <ListX className="h-3.5 w-3.5" /> Clear
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {queue.map((t, i) => (
                  <button
                    key={`${t.id}-${i}`}
                    onClick={() => {
                      vibrate(6);
                      jumpTo(i);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-white/[0.05]",
                      i < index && "opacity-40",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.coverUrl}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                      draggable={false}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[14px] font-semibold",
                          i === index ? "text-[color:var(--acc)]" : "text-white/85",
                        )}
                      >
                        {t.title}
                      </span>
                      <span className="block truncate text-[11.5px] text-white/40">{t.artist}</span>
                    </span>
                    {i === index ? (
                      <EqBars playing={isPlaying} />
                    ) : (
                      <span className="flex shrink-0 items-center gap-0.5">
                        <span
                          role="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrate(5);
                            moveInQueue(i, Math.max(0, i - 1));
                          }}
                          className="rounded-full p-1 text-white/25 active:bg-white/10 active:text-white"
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </span>
                        <span
                          role="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrate(5);
                            moveInQueue(i, Math.min(queue.length - 1, i + 1));
                          }}
                          className="rounded-full p-1 text-white/25 active:bg-white/10 active:text-white"
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </span>
                        <span
                          role="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrate(6);
                            removeAt(i);
                          }}
                          className="rounded-full p-1 text-white/25 active:bg-white/10 active:text-white"
                          aria-label="Remove from queue"
                        >
                          <ListX className="h-4 w-4" />
                        </span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Sheet>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
