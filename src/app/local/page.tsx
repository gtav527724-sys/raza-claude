"use client";

import { ChevronLeft, FolderOpen, Music2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import TrackRow from "@/components/TrackRow";
import { usePlayer } from "@/lib/player";
import type { Track } from "@/lib/types";

export default function LocalFilesPage() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const playQueue = usePlayer((s) => s.playQueue);

  useEffect(() => {
    return () => {
      for (const t of tracks) {
        if (t.audioUrl.startsWith("blob:")) URL.revokeObjectURL(t.audioUrl);
      }
    };
  }, [tracks]);

  const loadFiles = (files: FileList | null) => {
    if (!files) return;
    for (const t of tracks) if (t.audioUrl.startsWith("blob:")) URL.revokeObjectURL(t.audioUrl);
    const audio = Array.from(files).filter(
      (f) => f.type.startsWith("audio/") || /\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(f.name),
    );
    setTracks(
      audio.map((f, i) => {
        const clean = f.name.replace(/\.[^.]+$/, "");
        const [artist, ...titleParts] = clean.includes(" - ")
          ? clean.split(" - ")
          : ["Local file", clean];
        return {
          id: -9_000_000_000 - i,
          source: "local",
          title: titleParts.join(" - ") || clean,
          artist,
          albumTitle: "On this device",
          albumSlug: "",
          genre: "Local",
          durationSec: 0,
          audioUrl: URL.createObjectURL(f),
          coverUrl: "/icons/icon.png",
        } satisfies Track;
      }),
    );
  };

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
          <h1 className="font-display text-[21px] font-bold">Local Files</h1>
          <p className="text-[11.5px] text-white/40">Phone aur SD card se music</p>
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac"
        multiple
        onChange={(e) => loadFiles(e.target.files)}
        className="hidden"
      />
      <button
        onClick={() => input.current?.click()}
        className="glass sheen mt-6 flex w-full items-center gap-4 rounded-[24px] p-5 text-left"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--acc)] text-[color:var(--on-acc)]">
          <FolderOpen className="h-6 w-6" />
        </span>
        <span>
          <span className="block text-[15px] font-bold text-white/90">Choose audio files</span>
          <span className="mt-0.5 block text-[12px] text-white/40">
            MP3, M4A, AAC, WAV, OGG, FLAC
          </span>
        </span>
      </button>

      {tracks.length > 0 ? (
        <>
          <button
            onClick={() => playQueue(tracks, 0)}
            className="glow-lime mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--acc)] py-3 text-[14px] font-bold text-[color:var(--on-acc)]"
          >
            <Play className="h-4 w-4 fill-current" /> Play {tracks.length} files
          </button>
          <div className="-mx-2 mt-4">
            {tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} tracks={tracks} index={i} />
            ))}
          </div>
        </>
      ) : (
        <div className="py-20 text-center">
          <Music2 className="mx-auto h-9 w-9 text-white/15" />
          <p className="mt-3 text-[13px] text-white/35">
            Files select karne ke baad yahan dikhengi
          </p>
        </div>
      )}
    </div>
  );
}
