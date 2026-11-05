"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ListMusic, Play, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import TrackRow from "@/components/TrackRow";
import { apiDelete, apiGet } from "@/lib/api";
import { useLibrary } from "@/lib/library";
import { usePlayer } from "@/lib/player";
import { toast } from "@/lib/toast";
import type { Track } from "@/lib/types";
import { cn, vibrate } from "@/lib/utils";

interface PlaylistData {
  playlist: { id: number; name: string };
  tracks: Track[];
}

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const bump = useLibrary((s) => s.bump);
  const playQueue = usePlayer((s) => s.playQueue);

  const [data, setData] = useState<PlaylistData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [armDelete, setArmDelete] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    apiGet<PlaylistData>(`/api/playlists/${id}`)
      .then(setData)
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    load();
    return () => {
      if (armTimer.current) clearTimeout(armTimer.current);
    };
  }, [load]);

  const removeTrack = async (t: Track) => {
    if (!data) return;
    setData({ ...data, tracks: data.tracks.filter((x) => x.id !== t.id) });
    try {
      await apiDelete(`/api/playlists/${id}/tracks?trackId=${t.id}`);
      toast("Removed from playlist");
      bump();
    } catch {
      load();
    }
  };

  const deletePlaylist = async () => {
    if (!armDelete) {
      setArmDelete(true);
      toast("Tap again to delete playlist");
      armTimer.current = setTimeout(() => setArmDelete(false), 2600);
      return;
    }
    try {
      await apiDelete(`/api/playlists/${id}`);
      bump();
      router.replace("/library");
    } catch {
      toast("Couldn't delete playlist");
    }
  };

  const covers = data?.tracks.slice(0, 4).map((t) => t.coverUrl) ?? [];

  return (
    <div className="px-5 pb-44 pt-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/85"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        {data && (
          <button
            onClick={deletePlaylist}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition",
              armDelete
                ? "border border-red-400/40 bg-red-500/20 text-red-400 backdrop-blur-xl"
                : "glass-soft text-white/70",
            )}
            aria-label="Delete playlist"
          >
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {notFound && <p className="py-24 text-center text-white/50">Playlist not found.</p>}

      {data && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 240 }}
        >
          {covers.length > 0 ? (
            <div className="mx-auto mt-6 grid h-44 w-44 grid-cols-2 grid-rows-2 overflow-hidden rounded-[24px] border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              {covers.map((c, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={c} alt="" className="h-full w-full object-cover" />
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-6 flex h-44 w-44 items-center justify-center rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
              <ListMusic className="h-14 w-14 text-white/20" />
            </div>
          )}

          <h1 className="mt-6 break-words text-center font-display text-[22px] font-bold leading-tight tracking-tight">
            {data.playlist.name}
          </h1>
          <p className="mt-1 text-center text-[13px] text-white/45">
            {data.tracks.length} song{data.tracks.length === 1 ? "" : "s"}
          </p>

          {data.tracks.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                vibrate(10);
                playQueue(data.tracks, 0);
              }}
              className="mx-auto mt-5 flex items-center gap-2 rounded-full bg-[color:var(--acc)] px-7 py-3 text-[14.5px] font-bold text-black shadow-[0_10px_35px_rgba(198,255,63,0.3)]"
            >
              <Play className="h-4 w-4 fill-black" /> Play
            </motion.button>
          )}
        </motion.div>
      )}

      <div className="-mx-2 mt-7">
        {data === null && !notFound ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2.5">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-white/[0.05]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ))
        ) : data && data.tracks.length === 0 ? (
          <div className="px-2 py-12 text-center">
            <ListMusic className="mx-auto h-9 w-9 text-white/15" />
            <p className="mt-3 text-[14px] font-medium text-white/40">
              Empty playlist. Open any song’s menu and choose “Add to playlist”.
            </p>
          </div>
        ) : (
          data?.tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} tracks={data.tracks} index={i} onRemove={removeTrack} />
          ))
        )}
      </div>
    </div>
  );
}
