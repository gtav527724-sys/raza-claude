"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pause, Play, SkipForward } from "lucide-react";
import FadeImg from "@/components/FadeImg";
import Marquee from "@/components/Marquee";
import { usePlayer } from "@/lib/player";
import { cn, vibrate } from "@/lib/utils";

export default function MiniPlayer() {
  const started = usePlayer((s) => s.started);
  const isOpen = usePlayer((s) => s.isOpen);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const buffering = usePlayer((s) => s.buffering);
  const current = usePlayer((s) => s.queue[s.index] ?? null);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const setOpen = usePlayer((s) => s.setOpen);

  const visible = started && current !== null && !isOpen;
  const pct = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.div
          initial={{ y: 96, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 96, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="absolute inset-x-3 bottom-[calc(max(0.85rem,env(safe-area-inset-bottom))+72px)] z-40 will-change-transform"
        >
          <div
            onClick={() => setOpen(true)}
            className="glass sheen relative cursor-pointer overflow-hidden rounded-[22px]"
          >
            <div className="flex items-center gap-3 p-2.5 pl-3">
              <motion.div
                animate={isPlaying ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={isPlaying ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : {}}
                className="relative shrink-0"
              >
                <FadeImg
                  src={current.coverUrl}
                  alt=""
                  className={cn(
                    "h-11 w-11 rounded-[14px] object-cover transition-shadow duration-500",
                    isPlaying &&
                      "shadow-[0_0_18px_rgba(198,255,63,0.35)] ring-1 ring-[var(--acc)]/50",
                  )}
                />
              </motion.div>

              <div className="min-w-0 flex-1">
                <Marquee
                  text={current.title}
                  className="text-[13.5px] font-bold text-white"
                  threshold={22}
                />
                <p className="truncate text-[11.5px] text-white/50">{current.artist}</p>
              </div>

              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate(8);
                  toggle();
                }}
                className="glow-lime flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--acc)] text-black"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {buffering && isPlaying ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-[18px] w-[18px] fill-black" />
                ) : (
                  <Play className="ml-0.5 h-[18px] w-[18px] fill-black" />
                )}
              </motion.button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate(8);
                  next(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition active:scale-90 active:bg-white/10"
                aria-label="Next"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
            </div>

            {/* GPU-composited progress */}
            <div className="absolute inset-x-0 top-0 h-[2.5px] bg-white/[0.08]">
              <div
                className="h-full w-full origin-left bg-[color:var(--acc)] transition-transform duration-300 ease-linear"
                style={{ transform: `scaleX(${pct})` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
