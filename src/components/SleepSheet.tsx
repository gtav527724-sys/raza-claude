"use client";

import { AlarmClock, AlarmClockOff, Music2 } from "lucide-react";
import { useEffect, useState } from "react";
import Sheet from "@/components/Sheet";
import { usePlayer } from "@/lib/player";
import { cn, formatTime, vibrate } from "@/lib/utils";

const OPTIONS = [5, 10, 15, 30, 45, 60];

export default function SleepSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sleepAt = usePlayer((s) => s.sleepAt);
  const sleepEndOfTrack = usePlayer((s) => s.sleepEndOfTrack);
  const setSleepTimer = usePlayer((s) => s.setSleepTimer);
  const clearSleep = usePlayer((s) => s.clearSleep);

  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!sleepAt) return;
    const update = () => setNow(Date.now());
    const first = setTimeout(update, 0);
    const i = setInterval(update, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(i);
    };
  }, [sleepAt]);

  const remaining = sleepAt && now ? Math.max(0, (sleepAt - now) / 1000) : null;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-5 pb-8 pt-3">
        <div className="flex items-center justify-between px-1 pb-3">
          <p className="text-[11px] font-bold tracking-[0.28em] text-white/40">SLEEP TIMER</p>
          {(sleepAt || sleepEndOfTrack) && (
            <button
              onClick={() => {
                vibrate(8);
                clearSleep();
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1.5 text-[11.5px] font-bold text-red-400"
            >
              <AlarmClockOff className="h-3.5 w-3.5" /> Turn off
            </button>
          )}
        </div>

        {remaining !== null && (
          <p className="px-1 pb-3 text-[13px] font-semibold text-[color:var(--acc)]">
            Stopping in {formatTime(remaining)}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          {OPTIONS.map((m) => {
            const activeOpt = sleepLabelMatches(sleepAt, m, now);
            return (
              <button
                key={m}
                onClick={() => {
                  vibrate(8);
                  setSleepTimer(m);
                  onClose();
                }}
                className={cn(
                  "glass-soft rounded-2xl py-4 text-center transition active:scale-95",
                  activeOpt && "border-[color:var(--acc)] shadow-[0_0_24px_-6px_var(--acc)]",
                )}
              >
                <span
                  className={cn(
                    "block font-display text-[17px] font-bold",
                    activeOpt ? "text-[color:var(--acc)]" : "text-white",
                  )}
                >
                  {m}
                </span>
                <span className="text-[10.5px] font-medium text-white/40">min</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            vibrate(8);
            setSleepTimer("track");
            onClose();
          }}
          className={cn(
            "glass-soft mt-2.5 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 transition active:scale-[0.98]",
            sleepEndOfTrack && "border-[color:var(--acc)]",
          )}
        >
          <Music2
            className={cn("h-5 w-5", sleepEndOfTrack ? "text-[color:var(--acc)]" : "text-white/50")}
          />
          <span className="flex-1 text-left text-[14px] font-semibold text-white/85">
            End of track
          </span>
          <AlarmClock className="h-4 w-4 text-white/30" />
        </button>
      </div>
    </Sheet>
  );
}

function sleepLabelMatches(sleepAt: number | null, minutes: number, now: number) {
  if (!sleepAt || !now) return false;
  const remainingMin = (sleepAt - now) / 60000;
  return Math.abs(remainingMin - minutes) < 0.5;
}
