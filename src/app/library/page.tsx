"use client";

import YouTubeLibrary from "@/components/YouTubeLibrary";
import { toast } from "@/lib/toast";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  FolderOpen,
  HardDrive,
  Headphones,
  Heart,
  ListMusic,
  Plus,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sheet from "@/components/Sheet";
import { apiGet, apiPost } from "@/lib/api";
import { useLibrary } from "@/lib/library";
import { usePlayer } from "@/lib/player";
import type { LibraryData, PlaylistSummary, Track } from "@/lib/types";
import { vibrate } from "@/lib/utils";

function Collage({ covers, className }: { covers: string[]; className?: string }) {
  if (covers.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-white/[0.06] ${className ?? ""}`}>
        <ListMusic className="h-5 w-5 text-white/25" />
      </div>
    );
  }
  if (covers.length === 1) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={covers[0]} alt="" className={`object-cover ${className ?? ""}`} />;
  }
  const cells = [covers[0], covers[1], covers[2], covers[3]].filter(Boolean);
  return (
    <div className={`grid grid-cols-2 grid-rows-2 overflow-hidden ${className ?? ""}`}>
      {cells.map((c, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={c} alt="" className="h-full w-full object-cover" />
      ))}
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const version = useLibrary((s) => s.version);
  const bump = useLibrary((s) => s.bump);
  const playQueue = usePlayer((s) => s.playQueue);

  const [data, setData] = useState<LibraryData | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    apiGet<LibraryData>("/api/library")
      .then(setData)
      .catch(() => {});
    apiGet<{ playlists: PlaylistSummary[] }>("/api/playlists")
      .then((d) => setPlaylists(d.playlists))
      .catch(() => {});
  }, [version]);

  const createPlaylist = async () => {
    const n = name.trim();
    if (!n || creating) return;
    setCreating(true);
    try {
      const d = await apiPost<{ playlist: PlaylistSummary }>("/api/playlists", { name: n });
      setCreateOpen(false);
      setName("");
      bump();
      router.push(`/playlist/${d.playlist.id}`);
    } catch {
      toast("Playlist nahi ban saki — dobara try karein");
    } finally {
      setCreating(false);
    }
  };

  const playRecent = (recent: Track[], t: Track) => {
    vibrate(6);
    playQueue(recent, recent.indexOf(t));
  };

  return (
    <div className="px-5 pb-44 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[24px] font-bold tracking-tight">Your Library</h1>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setCreateOpen(true)}
          className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white"
          aria-label="New playlist"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Liked songs tile */}
      <motion.div whileTap={{ scale: 0.98 }} className="mt-5">
        <Link
          href="/liked"
          className="sheen relative flex items-center gap-4 overflow-hidden rounded-[22px] border border-white/[0.12] p-4 shadow-[0_24px_60px_-24px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl"
          style={{
            background: "linear-gradient(120deg, rgba(139,92,246,0.32), rgba(198,255,63,0.16))",
          }}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black/35 backdrop-blur">
            <Heart className="h-6 w-6 fill-[color:var(--acc)] text-[color:var(--acc)]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[16px] font-bold">Liked Songs</span>
            <span className="mt-0.5 block text-[12.5px] text-white/55">
              {data ? `${data.likedCount} song${data.likedCount === 1 ? "" : "s"}` : "…"}
            </span>
          </span>
          {data && data.likedCovers.length > 0 && (
            <Collage covers={data.likedCovers} className="h-14 w-14 shrink-0 rounded-xl" />
          )}
        </Link>
      </motion.div>

      <YouTubeLibrary />

      {/* Library tools */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <Link
          href="/offline"
          className="glass-soft flex flex-col items-center gap-1.5 rounded-[18px] py-3.5 text-center"
        >
          <HardDrive className="h-5 w-5 text-[color:var(--acc)]" />
          <span className="text-[10.5px] font-bold text-white/70">Offline</span>
        </Link>
        <Link
          href="/radio"
          className="glass-soft flex flex-col items-center gap-1.5 rounded-[18px] py-3.5 text-center"
        >
          <Radio className="h-5 w-5 text-[color:var(--acc)]" />
          <span className="text-[10.5px] font-bold text-white/70">Radio</span>
        </Link>
        <Link
          href="/live"
          className="glass-soft flex flex-col items-center gap-1.5 rounded-[18px] py-3.5 text-center"
        >
          <Headphones className="h-5 w-5 text-[color:var(--acc)]" />
          <span className="text-[10.5px] font-bold text-white/70">Live</span>
        </Link>
        <Link
          href="/stats"
          className="glass-soft flex flex-col items-center gap-1.5 rounded-[18px] py-3.5 text-center"
        >
          <BarChart3 className="h-5 w-5 text-[color:var(--acc)]" />
          <span className="text-[10.5px] font-bold text-white/70">Stats</span>
        </Link>
      </div>

      <Link
        href="/local"
        className="glass-soft mt-3 flex items-center gap-3 rounded-[18px] px-4 py-3.5"
      >
        <FolderOpen className="h-5 w-5 text-[color:var(--acc)]" />
        <span className="flex-1 text-[13px] font-bold text-white/75">Browse local audio files</span>
        <span className="text-[10px] font-semibold text-white/30">PHONE / SD</span>
      </Link>

      {/* Playlists */}
      <h2 className="mb-2 mt-8 text-[12px] font-bold tracking-[0.2em] text-white/40">PLAYLISTS</h2>
      <div>
        {playlists === null ? (
          [0, 1].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2.5">
              <div className="h-14 w-14 animate-pulse rounded-2xl bg-white/[0.05]" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ))
        ) : playlists.length === 0 ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-1 flex w-full items-center gap-4 rounded-[22px] border border-dashed border-white/15 p-4 text-left active:bg-white/[0.03]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05]">
              <Plus className="h-5 w-5 text-white/40" />
            </span>
            <span>
              <span className="block text-[14px] font-semibold text-white/80">
                Create your first playlist
              </span>
              <span className="text-[12px] text-white/40">Tap to get started</span>
            </span>
          </button>
        ) : (
          playlists.map((p) => (
            <motion.div key={p.id} whileTap={{ scale: 0.98 }}>
              <Link
                href={`/playlist/${p.id}`}
                className="flex items-center gap-4 rounded-2xl py-2.5 active:bg-white/[0.04]"
              >
                <Collage
                  covers={p.covers}
                  className="h-14 w-14 shrink-0 rounded-2xl border border-white/[0.07]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold text-white/90">
                    {p.name}
                  </span>
                  <span className="text-[12px] text-white/40">
                    Playlist · {p.trackCount} song{p.trackCount === 1 ? "" : "s"}
                  </span>
                </span>
              </Link>
            </motion.div>
          ))
        )}
      </div>

      {/* Recently played */}
      {data && data.recent.length > 0 && (
        <div>
          <h2 className="mb-3 mt-9 text-[12px] font-bold tracking-[0.2em] text-white/40">
            RECENTLY PLAYED
          </h2>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {data.recent.map((t) => (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => playRecent(data.recent, t)}
                className="w-[116px] shrink-0 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.coverUrl}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="aspect-square w-full rounded-xl border border-white/[0.07] object-cover"
                />
                <p className="mt-1.5 truncate text-[12px] font-semibold text-white/85">{t.title}</p>
                <p className="truncate text-[10.5px] text-white/40">{t.artist}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Get the Android app */}
      <motion.a
        href="/download/Sonara.apk"
        whileTap={{ scale: 0.98 }}
        className="glass sheen mt-10 flex items-center gap-4 rounded-[22px] p-4"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--acc)] shadow-[0_8px_24px_-6px_rgba(198,255,63,0.45)]">
          <Download className="h-5 w-5 text-black" strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-bold text-white/90">
            Install the Android app
          </span>
          <span className="text-[12px] text-white/45">
            Download the APK — native, full-screen, offline-ready shell
          </span>
        </span>
        <span className="text-[11px] font-bold tracking-widest text-[color:var(--acc)]">APK</span>
      </motion.a>

      {/* Create playlist sheet */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="px-6 pb-10 pt-4">
          <h3 className="font-display text-[17px] font-bold">New playlist</h3>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
            placeholder="Name it something good…"
            maxLength={48}
            className="glass-soft mt-4 w-full rounded-2xl px-4 py-3.5 text-[15px] font-medium outline-none placeholder:text-white/30 focus:border-[var(--acc)]/50"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={createPlaylist}
            disabled={!name.trim() || creating}
            className="glow-lime mt-4 w-full rounded-full bg-[color:var(--acc)] py-3.5 text-[15px] font-bold text-black transition disabled:opacity-30"
          >
            {creating ? "Creating…" : "Create playlist"}
          </motion.button>
        </div>
      </Sheet>
    </div>
  );
}
