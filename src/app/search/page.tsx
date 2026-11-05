"use client";

import { motion } from "framer-motion";
import {
  Clock,
  ExternalLink,
  Globe2,
  Loader2,
  Mic,
  Music2,
  Search as SearchIcon,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AlbumCard from "@/components/AlbumCard";
import TrackRow from "@/components/TrackRow";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { Album, Track } from "@/lib/types";

const GENRES = [
  { name: "Synthwave", query: "synthwave", from: "from-fuchsia-500/30", to: "to-purple-700/20" },
  { name: "Pop", query: "pop hits", from: "from-pink-400/30", to: "to-rose-700/20" },
  { name: "Hip-Hop", query: "hip hop", from: "from-amber-400/30", to: "to-orange-800/20" },
  { name: "Electronic", query: "electronic dance", from: "from-cyan-400/30", to: "to-blue-700/20" },
  { name: "Rock", query: "rock", from: "from-red-400/30", to: "to-red-800/20" },
  { name: "Jazz", query: "jazz", from: "from-indigo-400/30", to: "to-blue-800/20" },
  { name: "Lo-Fi", query: "lofi beats", from: "from-teal-400/30", to: "to-emerald-700/20" },
  { name: "Classical", query: "classical", from: "from-yellow-200/25", to: "to-amber-700/20" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [local, setLocal] = useState<{ tracks: Track[]; albums: Album[] } | null>(null);
  const [online, setOnline] = useState<Track[] | null>(null);
  const [onlineOff, setOnlineOff] = useState(false);
  const [catalog, setCatalog] = useState<
    Array<{ id: string; title: string; artist: string; album: string; durationSec: number }>
  >([]);
  const [listening, setListening] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 320);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    apiGet<{ searches: string[] }>("/api/searches")
      .then((d) => setRecents(d.searches))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!debounced) {
      queueMicrotask(() => {
        setLocal(null);
        setOnline(null);
        setOnlineOff(false);
        setCatalog([]);
      });
      return;
    }
    queueMicrotask(() => setLoading(true));
    let cancelled = false;

    // Local catalog + the internet, in parallel
    apiGet<{ tracks: Track[]; albums: Album[] }>(`/api/tracks?q=${encodeURIComponent(debounced)}`)
      .then((d) => !cancelled && setLocal(d))
      .catch(() => !cancelled && setLocal({ tracks: [], albums: [] }))
      .finally(() => !cancelled && setLoading(false));

    // 3 playable catalogs + MusicBrainz global metadata in parallel
    Promise.all([
      apiGet<{ tracks: Track[]; offline?: boolean }>(
        `/api/youtube?q=${encodeURIComponent(debounced)}`,
      ).catch(() => ({ tracks: [] as Track[], offline: true })),
      apiGet<{ tracks: Track[] }>(`/api/itunes?q=${encodeURIComponent(debounced)}`).catch(() => ({
        tracks: [] as Track[],
      })),
      apiGet<{ tracks: Track[]; offline?: boolean }>(
        `/api/audius?q=${encodeURIComponent(debounced)}`,
      ).catch(() => ({ tracks: [] as Track[], offline: true })),
      apiGet<{ tracks: Track[] }>(`/api/deezer?q=${encodeURIComponent(debounced)}`).catch(() => ({
        tracks: [] as Track[],
      })),
      apiGet<{
        recordings: Array<{
          id: string;
          title: string;
          artist: string;
          album: string;
          durationSec: number;
        }>;
      }>(`/api/catalog-search?q=${encodeURIComponent(debounced)}`).catch(() => ({
        recordings: [],
      })),
    ])
      .then(([ytr, itu, aud, deezer, mb]) => {
        if (cancelled) return;
        // interleave: full songs first, then previews, dedupe by title+artist
        const seen = new Set<string>();
        const merged = [
          ...ytr.tracks.slice(0, 14),
          ...aud.tracks,
          ...itu.tracks,
          ...deezer.tracks,
          ...ytr.tracks.slice(14),
        ].filter((t) => {
          const k = `${t.title.toLowerCase()}|${t.artist.toLowerCase()}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        setOnline(merged.slice(0, 60));
        setCatalog(mb.recordings);
        setOnlineOff(
          merged.length === 0 && Boolean(aud.offline || ytr.offline) && itu.tracks.length === 0,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setOnline([]);
        setOnlineOff(true);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const saveSearch = (q: string) => {
    const v = q.trim();
    if (!v) return;
    apiPost("/api/searches", { query: v }).catch(() => {});
    setRecents((r) => [v, ...r.filter((x) => x !== v)].slice(0, 8));
  };

  const removeRecent = (q: string) => {
    apiDelete(`/api/searches?query=${encodeURIComponent(q)}`).catch(() => {});
    setRecents((r) => r.filter((x) => x !== q));
  };

  const startVoice = () => {
    type SpeechCtor = new () => {
      lang: string;
      interimResults: boolean;
      onresult: (e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
      onend: () => void;
      onerror: () => void;
      start: () => void;
    };
    const w = window as unknown as {
      SpeechRecognition?: SpeechCtor;
      webkitSpeechRecognition?: SpeechCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) setQuery(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    setListening(true);
    r.start();
  };

  const noResults =
    !loading &&
    debounced.length > 0 &&
    local !== null &&
    online !== null &&
    local.tracks.length === 0 &&
    local.albums.length === 0 &&
    online.length === 0;

  return (
    <div className="px-5 pb-44 pt-5">
      <h1 className="font-display text-[24px] font-bold tracking-tight">Search</h1>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveSearch(query);
          inputRef.current?.blur();
        }}
      >
        <div className="glass flex items-center gap-3 rounded-full px-4 py-3 transition duration-300 focus-within:border-[var(--acc)]/50 focus-within:shadow-[0_0_30px_-6px_rgba(198,255,63,0.25)]">
          <SearchIcon className="h-[18px] w-[18px] shrink-0 text-white/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your library & the internet…"
            className="w-full bg-transparent text-[14.5px] font-medium text-white outline-none placeholder:text-white/30"
            enterKeyHint="search"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {!query && (
            <button
              type="button"
              onClick={startVoice}
              className={`shrink-0 rounded-full p-1.5 ${listening ? "bg-[color:var(--acc)] text-black" : "text-white/45"}`}
              aria-label="Voice search"
            >
              <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} />
            </button>
          )}
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/40" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 rounded-full bg-white/10 p-1 text-white/60"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      {!debounced && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {recents.length > 0 && (
            <div className="mt-7">
              <div className="mb-1.5 flex items-center justify-between">
                <h2 className="text-[12px] font-bold tracking-[0.2em] text-white/40">RECENT</h2>
                <button
                  onClick={() => {
                    apiDelete("/api/searches?all=1").catch(() => {});
                    setRecents([]);
                  }}
                  className="text-[11.5px] font-semibold text-white/40 active:text-white"
                >
                  Clear all
                </button>
              </div>
              {recents.map((r) => (
                <div key={r} className="flex items-center gap-3 py-1">
                  <button
                    onClick={() => setQuery(r)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1.5 text-left"
                  >
                    <Clock className="h-4 w-4 shrink-0 text-white/30" />
                    <span className="truncate text-[14px] font-medium text-white/75">{r}</span>
                  </button>
                  <button
                    onClick={() => removeRecent(r)}
                    className="rounded-full p-1.5 text-white/30 active:text-white"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <h2 className="mb-3 mt-8 text-[12px] font-bold tracking-[0.2em] text-white/40">
            BROWSE THE WORLD
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {GENRES.map((g) => (
              <motion.button
                key={g.name}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setQuery(g.query);
                  saveSearch(g.query);
                }}
                className={`relative h-20 overflow-hidden rounded-2xl bg-gradient-to-br ${g.from} ${g.to} border border-white/[0.1] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_40px_-20px_rgba(0,0,0,0.7)] backdrop-blur-sm`}
              >
                <Music2 className="absolute -bottom-2 -right-2 h-14 w-14 text-white/10" />
                <span className="absolute left-4 top-4 font-display text-[14px] font-bold text-white/90">
                  {g.name}
                </span>
                <Globe2 className="absolute bottom-3 left-4 h-3.5 w-3.5 text-white/30" />
              </motion.button>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-white/25">
            Search taps straight into the internet — millions of songs, streamed as previews.
          </p>
        </motion.div>
      )}

      {debounced && (
        <div className="mt-6">
          {/* Local matches */}
          {local && local.albums.length > 0 && (
            <div>
              <h2 className="mb-3 text-[12px] font-bold tracking-[0.2em] text-white/40">
                FROM YOUR CATALOG
              </h2>
              <div className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
                {local.albums.map((a) => (
                  <AlbumCard key={a.id} album={a} width={140} />
                ))}
              </div>
            </div>
          )}

          {local && local.tracks.length > 0 && (
            <div className="mt-4">
              {local.albums.length === 0 && (
                <h2 className="mb-1 text-[12px] font-bold tracking-[0.2em] text-white/40">
                  FROM YOUR CATALOG
                </h2>
              )}
              <div className="-mx-2">
                {local.tracks.map((t, i) => (
                  <TrackRow key={t.id} track={t} tracks={local.tracks} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Internet matches */}
          <div className="mt-6">
            <div className="mb-1 flex items-center gap-2">
              <Globe2 className="h-3.5 w-3.5 text-[color:var(--acc)]" />
              <h2 className="text-[12px] font-bold tracking-[0.2em] text-white/40">
                FROM THE INTERNET
              </h2>
            </div>
            <div className="-mx-2">
              {online === null ? (
                [0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                    <div className="h-12 w-12 animate-pulse rounded-xl bg-white/[0.05]" />
                    <div className="flex-1">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
                      <div className="mt-1.5 h-2.5 w-1/3 animate-pulse rounded bg-white/[0.04]" />
                    </div>
                  </div>
                ))
              ) : online.length > 0 ? (
                <>
                  {online.map((t, i) => (
                    <TrackRow
                      key={`${t.source}-${t.youtubeId ?? t.itunesId ?? t.audiusId ?? t.id}`}
                      track={t}
                      tracks={online}
                      index={i}
                    />
                  ))}
                  <p className="px-2 pt-2 text-[10.5px] tracking-wide text-white/25">
                    YouTube + Audius full-length songs · Apple/Deezer catalog (full version
                    auto-matched) · MusicBrainz
                  </p>
                </>
              ) : onlineOff ? (
                <p className="px-2 py-5 text-[12.5px] text-white/35">
                  Online results are unreachable right now — check your connection.
                </p>
              ) : null}
            </div>
          </div>

          {catalog.length > 0 && (
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-[12px] font-bold tracking-[0.2em] text-white/40">
                  GLOBAL CATALOG
                </h2>
                <span className="text-[10px] text-white/25">MusicBrainz</span>
              </div>
              <div className="glass overflow-hidden rounded-[22px]">
                {catalog.slice(0, 8).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3 last:border-0"
                  >
                    <Music2 className="h-4 w-4 shrink-0 text-white/25" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-white/80">{r.title}</p>
                      <p className="truncate text-[11px] text-white/35">
                        {r.artist}
                        {r.album ? ` · ${r.album}` : ""}
                      </p>
                    </div>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${r.title} ${r.artist}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-white/[0.07] p-2 text-white/50"
                      aria-label="Find official source"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  [
                    "YouTube",
                    `https://www.youtube.com/results?search_query=${encodeURIComponent(debounced)}`,
                  ],
                  ["Spotify", `https://open.spotify.com/search/${encodeURIComponent(debounced)}`],
                  ["Deezer", `https://www.deezer.com/search/${encodeURIComponent(debounced)}`],
                ].map(([name, href]) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-soft rounded-full py-2.5 text-center text-[11.5px] font-bold text-white/65"
                  >
                    {name}
                  </a>
                ))}
              </div>
            </div>
          )}
          {noResults && (
            <div className="px-2 py-12 text-center">
              <Music2 className="mx-auto h-8 w-8 text-white/15" />
              <p className="mt-3 text-[14px] font-medium text-white/40">
                No results for “{debounced}”
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
