import type { Track } from "./types";

/** Inline cache so repeated searches/chart loads are instant. */
const cache = new Map<string, { t: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

async function cachedFetchJson<T>(url: string): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < TTL) return hit.data as T;
  const res = await fetch(url, {
    headers: { "User-Agent": "SONARA/1.0 (+https://sonara.app)" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  const data = (await res.json()) as T;
  cache.set(url, { t: Date.now(), data });
  return data;
}

interface ItunesRawTrack {
  wrapperType?: string;
  kind?: string;
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  primaryGenreName?: string;
  trackTimeMillis?: number;
  previewUrl?: string;
  artworkUrl100?: string;
}

interface ItunesSearchResponse {
  results?: ItunesRawTrack[];
}

interface ChartsFeed {
  feed?: { results?: Array<{ id?: string }> };
}

export function mapItunes(t: ItunesRawTrack): Track | null {
  if (!t.previewUrl || !t.trackId || !t.trackName) return null;
  return {
    id: -Math.abs(t.trackId),
    itunesId: t.trackId,
    source: "itunes",
    title: t.trackName,
    artist: t.artistName ?? "Unknown artist",
    albumTitle: t.collectionName ?? "Single",
    albumSlug: "",
    genre: t.primaryGenreName ?? "Music",
    durationSec: Math.round((t.trackTimeMillis ?? 30000) / 1000),
    audioUrl: t.previewUrl,
    coverUrl: (t.artworkUrl100 ?? "").replace("100x100bb", "600x600bb") || "/icons/icon.png",
  };
}

export async function searchItunes(query: string, limit = 50): Promise<Track[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    query,
  )}&media=music&entity=song&limit=${limit}`;
  const data = await cachedFetchJson<ItunesSearchResponse>(url);
  return (data.results ?? []).map(mapItunes).filter((t): t is Track => t !== null);
}

export async function topCharts(limit = 20, country = "us"): Promise<Track[]> {
  const safeCountry = /^[a-z]{2}$/i.test(country) ? country.toLowerCase() : "us";
  const feed = await cachedFetchJson<ChartsFeed>(
    `https://rss.applemarketingtools.com/api/v2/${safeCountry}/music/most-played/${limit}/songs.json`,
  );
  const ids = (feed.feed?.results ?? [])
    .map((r) => r.id)
    .filter(Boolean)
    .join(",");
  if (!ids) return [];
  const lookup = await cachedFetchJson<ItunesSearchResponse>(
    `https://itunes.apple.com/lookup?id=${ids}&entity=song&limit=${limit}`,
  );
  return (lookup.results ?? [])
    .map(mapItunes)
    .filter((t): t is Track => t !== null)
    .slice(0, limit);
}
