"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
    // Self-heal: most errors here are transient data issues.
    const t = setTimeout(() => reset(), 2500);
    return () => clearTimeout(t);
  }, [error, reset]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center">
      <div className="glass flex h-16 w-16 items-center justify-center rounded-full">
        <RotateCcw className="h-7 w-7 animate-spin text-[color:var(--acc)]" />
      </div>
      <h2 className="mt-5 font-display text-[17px] font-bold">Ek second…</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-white/45">
        Chhoti si rukawat aayi — app khud theek ho rahi hai.
      </p>
      <button
        onClick={reset}
        className="glow-lime mt-6 rounded-full bg-[color:var(--acc)] px-7 py-3 text-[14px] font-bold text-[color:var(--on-acc)]"
      >
        Abhi reload karo
      </button>
    </div>
  );
}
