import { NextResponse } from "next/server";
import type { Track } from "@/lib/types";
import { rateLimit } from "@/lib/server/security";

export const dynamic = "force-dynamic";

interface PodcastEpisode {
  trackId?: number;
  trackName?: string;
  collectionName?: string;
  episodeUrl?: string;
  previewUrl?: string;
  artworkUrl600?: string;
  artworkUrl160?: string;
  trackTimeMillis?: number;
  genres?: { name?: string }[];
}

export async function GET(req: Request) {
  const limited = rateLimit(req, "podcasts", 30);
  if (limited) return limited;
  const q = new URL(req.url).searchParams.get("q")?.trim() || "top podcasts";
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=podcast&entity=podcastEpisode&limit=40`,
      { signal: AbortSignal.timeout(10000) },
    );
    const d = (await res.json()) as { results?: PodcastEpisode[] };
    const tracks: Track[] = (d.results ?? [])
      .filter((x) => x.episodeUrl || x.previewUrl)
      .map((x, i) => ({
        id: -8_000_000_000 - (x.trackId ?? i),
        source: "podcast" as const,
        title: x.trackName ?? "Podcast episode",
        artist: x.collectionName ?? "Podcast",
        albumTitle: x.collectionName ?? "Podcast",
        albumSlug: "",
        genre: x.genres?.[0]?.name ?? "Podcast",
        durationSec: Math.round((x.trackTimeMillis ?? 0) / 1000),
        audioUrl: x.episodeUrl ?? x.previewUrl!,
        coverUrl: x.artworkUrl600 ?? x.artworkUrl160 ?? "/icons/icon.png",
      }));
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ tracks: [] });
  }
}
