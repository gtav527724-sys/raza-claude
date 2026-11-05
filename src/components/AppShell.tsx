"use client";

import { BatteryFull, Smartphone, Signal, Wifi } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import BottomNav from "@/components/BottomNav";
import MiniPlayer from "@/components/MiniPlayer";
import NowPlaying from "@/components/NowPlaying";
import PlayerRuntime from "@/components/PlayerRuntime";
import Toasts from "@/components/Toasts";
import { useLibrary } from "@/lib/library";
import { useOffline } from "@/lib/offline";
import { useSettings } from "@/lib/settings";

function StatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    update();
    const i = setInterval(update, 15000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="relative z-30 hidden shrink-0 items-center justify-between px-6 pb-1 pt-3 md:flex">
      <span className="w-14 text-[12px] font-bold tabular-nums tracking-wide text-white/75">
        {time}
      </span>
      <span className="hidden h-5 w-20 rounded-full bg-black/60 md:block" aria-hidden />
      <span className="flex items-center gap-1.5 text-white/60">
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-4 w-4" />
      </span>
    </div>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
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

export default function AppShell({ children }: { children: ReactNode }) {
  const reloadLiked = useLibrary((s) => s.reload);
  const hydrate = useSettings((s) => s.hydrate);
  const hydrateOffline = useOffline((s) => s.hydrate);
  const pathname = usePathname();

  useEffect(() => {
    hydrate();
    hydrateOffline();
    import("@/lib/player").then((m) => {
      m.ensureAudio();
      m.restoreSession();
      m.applyAudioPrefs();
    });
  }, [hydrate, hydrateOffline]);

  useEffect(() => {
    void reloadLiked();
  }, [reloadLiked]);

  // Service worker: instant launch + never a dead screen.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Native-app behavior: new screens always start at the top.
  useEffect(() => {
    const el = document.getElementById("app-scroll");
    el?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#050508]">
      {/* Desktop ambient scene */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden select-none md:block">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[17vw] font-bold leading-none tracking-tight text-white/[0.025]">
          SONARA
        </span>
        <div className="blob-a absolute -left-40 top-[-12%] h-[36rem] w-[36rem] rounded-full bg-[color:var(--acc)]/[0.045] blur-3xl" />
        <div className="blob-b absolute bottom-[-18%] right-[-10rem] h-[40rem] w-[40rem] rounded-full bg-violet-500/[0.06] blur-3xl" />
      </div>

      <div className="absolute left-8 top-8 hidden items-center gap-3 md:flex">
        <LogoMark className="h-7 w-7" />
        <span className="font-display text-[13px] font-bold tracking-[0.35em] text-white/60">
          SONARA
        </span>
      </div>
      <div className="absolute bottom-8 right-8 hidden items-center gap-2 text-[11px] font-medium tracking-wide text-white/35 md:flex">
        <Smartphone className="h-4 w-4" />
        On Android: open in Chrome → menu → “Add to Home screen”
      </div>

      {/* Device frame */}
      <div
        id="phone-frame"
        className="relative z-10 flex h-dvh w-full flex-col overflow-hidden md:h-[min(900px,94dvh)] md:w-[410px] md:rounded-[48px] md:border md:border-white/[0.08] md:shadow-[0_50px_140px_-30px_rgba(0,0,0,0.95),0_0_90px_-40px_rgba(198,255,63,0.22)]"
      >
        {/* In-app ambient backdrop: drifting light + grain */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="blob-a absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--acc)]/[0.05] blur-3xl" />
          <div
            className="blob-b absolute -right-28 top-1/3 h-80 w-80 rounded-full blur-3xl"
            style={{ background: "var(--blob2)" }}
          />
          <div
            className="blob-a absolute -left-16 bottom-0 h-64 w-64 rounded-full blur-3xl"
            style={{ background: "var(--blob3)" }}
          />
          <div className="grain absolute inset-0 opacity-[0.035]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>

        <StatusBar />
        <main
          id="app-scroll"
          className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </main>
        <MiniPlayer />
        <BottomNav />
        <NowPlaying />
        <div
          id="sheet-root"
          className="pointer-events-none absolute inset-0 z-[70] overflow-hidden md:rounded-[48px]"
        />
        <Toasts />
        <PlayerRuntime />
      </div>
    </div>
  );
}
