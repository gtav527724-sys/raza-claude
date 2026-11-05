"use client";

import { cn } from "@/lib/utils";

export default function Marquee({
  text,
  className,
  threshold = 24,
}: {
  text: string;
  className?: string;
  threshold?: number;
}) {
  if (text.length <= threshold) {
    return <span className={cn("block truncate", className)}>{text}</span>;
  }
  return (
    <span
      className={cn("block overflow-hidden whitespace-nowrap", className)}
      style={{
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <span className="marquee-inner inline-flex w-max">
        <span className="pr-10">{text}</span>
        <span className="pr-10" aria-hidden>
          {text}
        </span>
      </span>
    </span>
  );
}
