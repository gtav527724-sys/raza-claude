"use client";

import { motion } from "framer-motion";
import {
  Download,
  LoaderCircle,
  Share2,
  Sparkles,
  Check,
  ChevronLeft,
  Disc3,
  Heart,
  ListMusic,
  ListPlus,
  ListX,
  Loader2,
  MoreVertical,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import EqBars from "@/components/EqBars";
import FadeImg from "@/components/FadeImg";
import Sheet from "@/components/Sheet";
import { apiGet, apiPost } from "@/lib/api";
import { useLibrary } from "@/lib/library";
import { useOffline } from "@/lib/offline";
import { trackKey } from "@/lib/playable";
import { usePlayer } from "@/lib/player";
import { toast } from "@/lib/toast";
import type { PlaylistSummary, Track } from "@/lib/types";
import { cn, formatTime, vibrate } from "@/lib/utils";

interface TrackRowProps {
  track: Track;
  tracks?: Track[];
  index?: number;
  showCover?: boolean;
  numbered?: boolean;
  onRemove?: (track: Track) => void;
}

function TrackRowBase({
  track,
  tracks,
  index = 0,
  showCover = true,
  numbered = false,
  onRemove,
}: TrackRowProps) {
  const router = useRouter();
  const current = usePlayer((s) => s.queue[s.index] ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playQueue = usePlayer((s) => s.playQueue);
  const playTrack = usePlayer((s) => s.playTrack);
  const insertNext = usePlayer((s) => s.insertNext);
  const toggleLikeSmart = useLibrary((s) => s.toggleLikeSmart);
  const offline = useOffline((s) => s.items.some((x) => trackKey(x) === trackKey(track)));
  const downloading = useOffline((s) => s.downloading.includes(track.id));
  const downloadOffline = useOffline((s) => s.download);
  const removeOffline = useOffline((s) => s.remove);
  const liked = useLibrary((s) => s.likedKeys.includes(trackKey(track)));

  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);

  const isCurrent =
    current != null && (current.id === track.id || trackKey(current) === trackKey(track));

  useEffect(() => {
    if (menuOpen && pickerMode && playlists === null) {
      apiGet<{ playlists: PlaylistSummary[] }>("/api/playlists")
        .then((d) => setPlaylists(d.playlists))
        .catch(() => setPlaylists([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen, pickerMode]);

  const handlePlay = () => {
    vibrate(6);
    if (tracks && tracks.length) playQueue(tracks, index);
    else playTrack(track);
  };

  const addToPlaylist = async (p: PlaylistSummary) => {
    try {
      // One request: the server saves the track (any provider) and adds it.
      const plain =
        track.id > 0 && !track.extKey && !track.itunesId && !track.audiusId && !track.youtubeId;
      await apiPost(`/api/playlists/${p.id}/tracks`, plain ? { trackId: track.id } : { track });
      toast(`Added to ${p.name}`);
      useLibrary.getState().bump();
      setMenuOpen(false);
      setPickerMode(false);
    } catch {
      toast("Couldn't add track");
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.985 }}
        onClick={handlePlay}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border border-transparent px-2 py-2 text-left transition-all duration-300 active:bg-white/[0.05]",
          isCurrent &&
            "border-white/[0.09] bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-sm",
        )}
      >
        {numbered ? (
          <span className="w-5 shrink-0 text-center text-[13px] font-medium tabular-nums text-white/35">
            {isCurrent ? (
              <EqBars playing={isPlaying} className="mx-auto h-3 justify-center" />
            ) : (
              index + 1
            )}
          </span>
        ) : null}

        {showCover && (
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/[0.07]">
            <FadeImg
              src={track.coverUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {isCurrent && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55">
                <EqBars playing={isPlaying} />
              </span>
            )}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[14.5px] font-semibold leading-tight",
              isCurrent ? "text-[color:var(--acc)]" : "text-white/90",
            )}
          >
            {track.title}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-white/45">
            {track.artist} · {track.albumTitle}
          </span>
        </span>

        <span className="shrink-0 text-[11px] tabular-nums text-white/35">
          {formatTime(track.durationSec)}
        </span>

        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            setPickerMode(false);
            setMenuOpen(true);
          }}
          className="-mr-1 shrink-0 rounded-full p-1.5 text-white/40 transition-colors active:bg-white/10 active:text-white"
          aria-label="Track options"
        >
          <MoreVertical className="h-[18px] w-[18px]" />
        </span>
      </motion.button>

      <Sheet
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
          setTimeout(() => setPickerMode(false), 300);
        }}
      >
        {!pickerMode ? (
          <div className="px-4 pb-8 pt-2">
            <div className="mb-2 flex items-center gap-3 px-2 pb-3 pt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={track.coverUrl} alt="" className="h-11 w-11 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-white">{track.title}</p>
                <p className="truncate text-[12px] text-white/50">{track.artist}</p>
              </div>
            </div>

            <MenuItem
              icon={
                downloading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )
              }
              label={
                offline
                  ? "Remove offline download"
                  : downloading
                    ? "Downloading…"
                    : "Download offline"
              }
              onClick={async () => {
                if (downloading) return;
                try {
                  if (offline) {
                    await removeOffline(track);
                    toast("Offline download removed");
                  } else {
                    toast("Downloading song…");
                    await downloadOffline(track);
                    toast("Available offline");
                  }
                } catch {
                  toast("Download failed — try another source");
                }
                setMenuOpen(false);
              }}
            />
            <MenuItem
              icon={<ListPlus className="h-5 w-5" />}
              label="Play next"
              onClick={() => {
                insertNext(track);
                toast("Queued next");
                setMenuOpen(false);
              }}
            />
            <MenuItem
              icon={
                <Heart
                  className={cn(
                    "h-5 w-5",
                    liked && "fill-[color:var(--acc)] text-[color:var(--acc)]",
                  )}
                />
              }
              label={liked ? "Remove from Liked" : "Add to Liked"}
              onClick={() => {
                toggleLikeSmart(track);
                toast(liked ? "Removed from Liked" : "Added to Liked");
                setMenuOpen(false);
              }}
            />
            <MenuItem
              icon={<ListMusic className="h-5 w-5" />}
              label="Add to playlist"
              onClick={() => {
                setPlaylists(null);
                setPickerMode(true);
              }}
            />
            <MenuItem
              icon={<Share2 className="h-5 w-5" />}
              label="Share song"
              onClick={async () => {
                setMenuOpen(false);
                const text = `${track.title} — ${track.artist}`;
                const url = `${window.location.origin}/search?q=${encodeURIComponent(text)}`;
                try {
                  if (navigator.share)
                    await navigator.share({ title: text, text: `Listen on SONARA: ${text}`, url });
                  else {
                    await navigator.clipboard.writeText(`${text} ${url}`);
                    toast("Song link copied");
                  }
                } catch {
                  /* share cancelled */
                }
              }}
            />
            <MenuItem
              icon={<Sparkles className="h-5 w-5" />}
              label="Play similar songs"
              onClick={async () => {
                setMenuOpen(false);
                const d = await apiGet<{ tracks: Track[] }>(
                  `/api/similar?artist=${encodeURIComponent(track.artist)}&genre=${encodeURIComponent(track.genre)}&title=${encodeURIComponent(track.title)}`,
                );
                if (d.tracks.length) {
                  playQueue(d.tracks, 0);
                  toast("Mixing similar tracks");
                } else toast("No similar songs found");
              }}
            />
            <MenuItem
              icon={<UserRound className="h-5 w-5" />}
              label="View artist"
              onClick={() => {
                setMenuOpen(false);
                router.push(`/artist/${encodeURIComponent(track.artist)}`);
              }}
            />
            {track.albumSlug && (
              <MenuItem
                icon={<Disc3 className="h-5 w-5" />}
                label="Go to album"
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/album/${track.albumSlug}`);
                }}
              />
            )}
            {onRemove && (
              <MenuItem
                icon={<ListX className="h-5 w-5" />}
                label="Remove from this playlist"
                danger
                onClick={() => {
                  onRemove(track);
                  setMenuOpen(false);
                }}
              />
            )}
          </div>
        ) : (
          <div className="flex max-h-[60vh] flex-col px-4 pb-8 pt-2">
            <button
              onClick={() => setPickerMode(false)}
              className="mb-1 flex items-center gap-1 px-2 py-1 text-[13px] font-semibold text-white/60 active:text-white"
            >
              <ChevronLeft className="h-4 w-4" /> Add to playlist
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {playlists === null ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                </div>
              ) : playlists.length === 0 ? (
                <p className="px-2 py-6 text-center text-[13px] text-white/40">
                  No playlists yet — create one from the Library tab.
                </p>
              ) : (
                playlists.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToPlaylist(p)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left active:bg-white/[0.05]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14.5px] font-semibold text-white/90">
                        {p.name}
                      </span>
                      <span className="text-[12px] text-white/40">{p.trackCount} songs</span>
                    </span>
                    <Check className="h-4 w-4 text-white/20" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl px-2 py-3.5 text-left text-[15px] font-medium active:bg-white/[0.05]",
        danger ? "text-red-400" : "text-white/85",
      )}
    >
      <span className={danger ? "text-red-400" : "text-white/60"}>{icon}</span>
      {label}
    </button>
  );
}

/** Memoized: long lists stay at 60fps while the player ticks every 250ms. */
const TrackRow = memo(
  TrackRowBase,
  (a, b) =>
    a.track.id === b.track.id &&
    a.index === b.index &&
    a.showCover === b.showCover &&
    a.numbered === b.numbered &&
    a.tracks === b.tracks &&
    a.onRemove === b.onRemove,
);

export default TrackRow;
