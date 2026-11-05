"use client";

import { ChevronLeft, Headphones, Loader2, Mic2, Radio, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TrackRow from "@/components/TrackRow";
import { apiGet } from "@/lib/api";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

const countries = [
  ["us", "🇺🇸"],
  ["gb", "🇬🇧"],
  ["in", "🇮🇳"],
  ["pk", "🇵🇰"],
  ["ca", "🇨🇦"],
  ["au", "🇦🇺"],
  ["de", "🇩🇪"],
  ["jp", "🇯🇵"],
] as const;

export default function LivePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"radio" | "podcasts" | "charts">("radio");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("us");
  const [tracks, setTracks] = useState<Track[] | null>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setTracks(null);
        const url =
          tab === "radio"
            ? `/api/stations${query ? `?q=${encodeURIComponent(query)}` : ""}`
            : tab === "podcasts"
              ? `/api/podcasts?q=${encodeURIComponent(query || "top podcasts")}`
              : `/api/country-charts?country=${country}`;
        apiGet<{ tracks: Track[] }>(url)
          .then((d) => setTracks(d.tracks))
          .catch(() => setTracks([]));
      },
      query ? 350 : 0,
    );
    return () => clearTimeout(timer);
  }, [tab, query, country]);

  return (
    <div className="px-5 pb-44 pt-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/85"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-[21px] font-bold">Live & Spoken</h1>
          <p className="text-[11.5px] text-white/40">FM radio · Podcasts · Country charts</p>
        </div>
      </div>

      <div className="glass mt-5 flex rounded-full p-1.5">
        {(
          [
            ["radio", "Radio", Radio],
            ["podcasts", "Podcasts", Mic2],
            ["charts", "Charts", Headphones],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setQuery("");
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[11.5px] font-bold transition",
              tab === id ? "bg-[color:var(--acc)] text-[color:var(--on-acc)]" : "text-white/45",
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab !== "charts" ? (
        <div className="glass-soft mt-4 flex items-center gap-2 rounded-full px-4 py-3">
          <Search className="h-4 w-4 text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "radio" ? "Search stations, genre, country…" : "Search podcasts…"}
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-white/30"
          />
        </div>
      ) : (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {countries.map(([code, flag]) => (
            <button
              key={code}
              onClick={() => setCountry(code)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-[18px] transition",
                country === code ? "bg-[color:var(--acc)]" : "glass-soft",
              )}
            >
              {flag}
            </button>
          ))}
        </div>
      )}

      <div className="-mx-2 mt-5">
        {tracks === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-white/35" />
          </div>
        ) : tracks.length ? (
          tracks.map((t, i) => (
            <TrackRow key={`${t.source}-${t.id}-${i}`} track={t} tracks={tracks} index={i} />
          ))
        ) : (
          <p className="py-16 text-center text-[13px] text-white/35">
            Kuch nahi mila — doosra search try karo
          </p>
        )}
      </div>
    </div>
  );
}
