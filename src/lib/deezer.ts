import type { Track } from "./types";

interface DeezerRaw {
  id: number;
  title: string;
  duration: number;
  preview?: string;
  artist?: { name?: string };
  album?: { title?: string; cover_xl?: string; cover_big?: string; cover_medium?: string };
  type?: string;
}

interface DeezerResponse {
  data?: DeezerRaw[];
}

export async function searchDeezer(query: string, limit = 30): Promise<Track[]> {
  const res = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { signal: AbortSignal.timeout(9000) },
  );
  if (!res.ok) return [];
  const d = (await res.json()) as DeezerResponse;
  return (d.data ?? [])
    .filter((x) => x.preview && x.title)
    .map((x) => ({
      id: -3_000_000_000 - x.id,
      deezerId: x.id,
      source: "deezer" as const,
      previewOnly: true,
      title: x.title,
      artist: x.artist?.name ?? "Unknown artist",
      albumTitle: x.album?.title ?? "Single",
      albumSlug: "",
      genre: "Music",
      durationSec: 30,
      audioUrl: x.preview!,
      coverUrl:
        x.album?.cover_xl ?? x.album?.cover_big ?? x.album?.cover_medium ?? "/icons/icon.png",
    }));
}
