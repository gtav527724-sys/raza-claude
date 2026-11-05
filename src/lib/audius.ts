import type { Track } from "./types";

/** Audius = open music protocol with full-length free streams. */
const HOSTS = [
  "https://api.audius.co",
  "https://audius-api-1.theblueprint.xyz",
  "https://audius-api-2.cultur3stake.com",
  "https://audius-discovery-2.theblueprint.xyz",
];

const APP = "SONARA";
const TTL = 8 * 60 * 1000;
const cache = new Map<string, { t: number; data: unknown }>();

/** Hash track id to a stable negative id (namespaced per provider). */
function hashedId(prefix: number, id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return -(Math.abs(h) % 100_000_000) - prefix * 10 ** 9;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  for (const host of HOSTS) {
    const url = `${host}${path}${path.includes("?") ? "&" : "?"}app_name=${APP}`;
    const hit = cache.get(url);
    if (hit && Date.now() - hit.t < TTL) return hit.data as T;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (!res.ok) continue;
      const data = (await res.json()) as T;
      cache.set(url, { t: Date.now(), data });
      return data;
    } catch {
      continue;
    }
  }
  return null;
}

interface AudiusRaw {
  id?: string;
  title?: string;
  genre?: string;
  duration?: number;
  artwork?: Record<string, string | undefined>;
  user?: { name?: string };
}

function mapAudius(t: AudiusRaw): Track | null {
  if (!t.id || !t.title) return null;
  const art =
    t.artwork?.["480x480"] ??
    t.artwork?.["150x150"] ??
    t.artwork?.["1000x1000"] ??
    "/icons/icon.png";
  return {
    id: hashedId(2, t.id),
    itunesId: null,
    audiusId: t.id,
    source: "audius",
    title: t.title,
    artist: t.user?.name ?? "Unknown artist",
    albumTitle: "Audius Originals",
    albumSlug: "",
    genre: t.genre ?? "Electronic",
    durationSec: Math.round(t.duration ?? 180),
    audioUrl: `${HOSTS[0]}/v1/tracks/${t.id}/stream?app_name=${APP}`,
    coverUrl: art,
  };
}

export async function searchAudius(query: string, limit = 30): Promise<Track[]> {
  const data = await fetchJson<{ data?: AudiusRaw[] }>(
    `/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`,
  );
  return (data?.data ?? []).map(mapAudius).filter((t): t is Track => t !== null);
}

export async function trendingAudius(limit = 14): Promise<Track[]> {
  const data = await fetchJson<{ data?: AudiusRaw[] }>(`/v1/tracks/trending?limit=${limit}`);
  return (data?.data ?? []).map(mapAudius).filter((t): t is Track => t !== null);
}
