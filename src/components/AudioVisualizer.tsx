"use client";

import { useEffect, useRef } from "react";
import { getSpectrum } from "@/lib/eq";
import { getActiveAudio, usePlayer } from "@/lib/player";
import { useSettings } from "@/lib/settings";

export default function AudioVisualizer({ className = "" }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const playing = usePlayer((s) => s.isPlaying);
  const enabled = useSettings((s) => !s.reduceMotion && !s.perfMode);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !enabled) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let phase = 0;

    let frame = 0;
    let acc = "#c6ff3f";
    const draw = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== w * dpr || c.height !== h * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const real = getSpectrum(getActiveAudio());
      const bars = 24;
      const gap = 2;
      const bw = (w - gap * (bars - 1)) / bars;
      // getComputedStyle every frame forces style recalculation (jank) — refresh ~1/sec only.
      if (frame++ % 60 === 0) {
        acc =
          getComputedStyle(document.documentElement).getPropertyValue("--acc").trim() || "#c6ff3f";
      }
      ctx.fillStyle = acc;
      ctx.globalAlpha = playing ? 0.75 : 0.25;
      for (let i = 0; i < bars; i++) {
        const realVal = real ? real[Math.min(real.length - 1, i * 2)] / 255 : 0;
        // Fallback responds to time without random layout churn.
        const fake = playing ? 0.18 + 0.35 * (0.5 + 0.5 * Math.sin(phase + i * 0.7)) : 0.08;
        const val = real ? Math.max(0.06, realVal) : fake;
        const bh = Math.max(2, val * h);
        ctx.beginPath();
        ctx.roundRect(i * (bw + gap), h - bh, bw, bh, Math.min(2, bw / 2));
        ctx.fill();
      }
      phase += 0.06;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [enabled, playing]);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvas}
      className={`pointer-events-none block h-8 w-full ${className}`}
      aria-hidden
    />
  );
}
