"use client";

import { motion } from "framer-motion";
import { SlidersVertical } from "lucide-react";
import Sheet from "@/components/Sheet";
import { EQ_BANDS, EQ_PRESETS, type EqPresetName } from "@/lib/eq";
import { useSettings } from "@/lib/settings";
import { cn, vibrate } from "@/lib/utils";

const labels = ["60", "250", "1k", "4k", "12k"];

export default function EqualizerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSettings();

  const setBand = (i: number, v: number) => {
    const gains = [...s.eqGains];
    gains[i] = v;
    s.patch({ eqGains: gains, eqPreset: "Custom", eqEnabled: true });
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-5 pb-8 pt-3">
        <div className="flex items-center justify-between px-1 pb-4">
          <div className="flex items-center gap-2">
            <SlidersVertical className="h-4 w-4 text-[color:var(--acc)]" />
            <p className="text-[11px] font-bold tracking-[0.28em] text-white/45">EQUALIZER</p>
          </div>
          <button
            onClick={() => {
              vibrate(8);
              s.patch({ eqEnabled: !s.eqEnabled });
            }}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition",
              s.eqEnabled ? "bg-[color:var(--acc)] text-black" : "bg-white/10 text-white/60",
            )}
          >
            {s.eqEnabled ? "ON" : "OFF"}
          </button>
        </div>

        {/* sliders */}
        <div
          className={cn(
            "flex items-end justify-between gap-1 px-1 transition-opacity",
            !s.eqEnabled && "opacity-40",
          )}
        >
          {EQ_BANDS.map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-bold tabular-nums text-white/45">
                {s.eqGains[i] > 0 ? `+${s.eqGains[i]}` : s.eqGains[i]}
              </span>
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={s.eqGains[i]}
                aria-label={`Band ${labels[i]}`}
                onChange={(e) => setBand(i, Number(e.target.value))}
                className="eq-vert"
              />
              <span className="text-[10px] font-semibold text-white/35">{labels[i]}</span>
            </div>
          ))}
        </div>

        {/* presets */}
        <div className="mt-5 flex flex-wrap gap-2">
          {(Object.keys(EQ_PRESETS) as EqPresetName[]).map((name) => (
            <motion.button
              key={name}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                vibrate(8);
                s.patch({ eqPreset: name, eqGains: [...EQ_PRESETS[name]], eqEnabled: true });
              }}
              className={cn(
                "rounded-full px-3.5 py-2 text-[12px] font-bold transition",
                s.eqPreset === name
                  ? "bg-[color:var(--acc)] text-black"
                  : "glass-soft text-white/70",
              )}
            >
              {name}
            </motion.button>
          ))}
        </div>
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-white/30">
          Real-time 5-band audio processing. Bass Boost bass ko 9dB tak barhata hai.
        </p>
      </div>
    </Sheet>
  );
}
