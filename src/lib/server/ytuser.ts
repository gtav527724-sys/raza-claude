import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { Track } from "@/lib/types";
import { hashedId } from "@/lib/youtube";

/** Returns a valid Google access token for the user (refreshing if needed). */
export async function googleAccessToken(userId: number): Promise<string | null> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return null;
  const fresh = u.tokenExpiresAt && u.tokenExpiresAt.getTime() > Date.now() + 60_000;
  if (u.accessToken && fresh) return u.accessToken;
  if (!u.refreshToken) return u.accessToken ?? null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: u.refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10000),
  });
  const d = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) return null;
  await db
    .update(users)
    .set({
      accessToken: d.access_token,
      tokenExpiresAt: new Date(Date.now() + (d.expires_in ?? 3300) * 1000),
    })
    .where(eq(users.id, userId));
  return d.access_token;
}

export async function ytApi<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`youtube api ${res.status}`);
  return (await res.json()) as T;
}

function isoDuration(iso?: string) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

interface PlaylistItemsResponse {
  items?: Array<{
    snippet?: {
      title?: string;
      videoOwnerChannelTitle?: string;
      thumbnails?: Record<string, { url?: string }>;
      resourceId?: { videoId?: string };
    };
  }>;
}
interface VideosResponse {
  items?: Array<{ id?: string; contentDetails?: { duration?: string } }>;
}

export async function playlistTracks(token: string, playlistId: string): Promise<Track[]> {
  const list = await ytApi<PlaylistItemsResponse>(
    `playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(playlistId)}`,
    token,
  );
  const items = (list.items ?? []).filter(
    (i) =>
      i.snippet?.resourceId?.videoId &&
      i.snippet.title !== "Private video" &&
      i.snippet.title !== "Deleted video",
  );
  const ids = items.map((i) => i.snippet!.resourceId!.videoId!);
  const durations = new Map<string, number>();
  if (ids.length) {
    const vids = await ytApi<VideosResponse>(
      `videos?part=contentDetails&id=${ids.join(",")}&maxResults=50`,
      token,
    );
    for (const v of vids.items ?? []) {
      if (v.id) durations.set(v.id, isoDuration(v.contentDetails?.duration));
    }
  }
  return items.map((i) => {
    const sn = i.snippet!;
    const id = sn.resourceId!.videoId!;
    const channel = (sn.videoOwnerChannelTitle ?? "YouTube").replace(/\s-\sTopic$/i, "");
    return {
      id: hashedId(3, id),
      itunesId: null,
      youtubeId: id,
      source: "youtube",
      title: sn.title ?? "Untitled",
      artist: channel,
      albumTitle: "YouTube",
      albumSlug: "",
      genre: "Music",
      durationSec: durations.get(id) ?? 0,
      audioUrl: `https://www.youtube.com/watch?v=${id}`,
      coverUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    } satisfies Track;
  });
}
