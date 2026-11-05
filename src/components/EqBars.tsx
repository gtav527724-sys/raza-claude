"use client";

import { cn } from "@/lib/utils";

export default function EqBars({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <span
      className={cn("flex h-3.5 items-end gap-[2.5px]", !playing && "eq-paused", className)}
      aria-hidden
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-full bg-[color:var(--acc)]"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}
