import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { albums, tracks } from "@/db/schema";
import type { Track } from "@/lib/types";

const WEB_ALBUM_SLUG = "web-streams";

export type TrackRow = typeof tracks.$inferSelect;

/** Provider identity of an internet track, or null for seeded local catalog rows. */
export function externalKey(t: Track): string | null {
  if (t.extKey) return t.extKey;
  if (t.source === "youtube" && t.youtubeId) return `yt:${t.youtubeId}`;
  if (t.source === "audius" || (t.audiusId && !t.itunesId)) {
    return t.audiusId ? `audius:${t.audiusId}` : null;
  }
  if (t.itunesId) return `itunes:${t.itunesId}`;
  if (t.deezerId) return `deezer:${t.deezerId}`;
  if (t.youtubeId) return `yt:${t.youtubeId}`;
  return null;
}

/** Validate / clamp an untrusted track payload coming from the browser. */
export function parseTrackInput(raw: unknown): Track | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<Track>;
  if (typeof t.title !== "string" || !t.title.trim()) return null;
  if (typeof t.audioUrl !== "string" || !t.audioUrl) return null;
  return {
    id: typeof t.id === "number" ? t.id : 0,
    title: t.title.slice(0, 300),
    artist: String(t.artist ?? "Unknown artist").slice(0, 300),
    albumTitle: String(t.albumTitle ?? "Single").slice(0, 300),
    albumSlug: String(t.albumSlug ?? ""),
    genre: String(t.genre ?? "Music").slice(0, 120),
    durationSec: Math.max(0, Math.min(86_400, Number(t.durationSec) || 0)),
    audioUrl: t.audioUrl.slice(0, 2000),
    coverUrl: String(t.coverUrl || "/icons/icon.png").slice(0, 2000),
    itunesId: typeof t.itunesId === "number" ? t.itunesId : null,
    audiusId: typeof t.audiusId === "string" ? t.audiusId.slice(0, 80) : null,
    youtubeId:
      typeof t.youtubeId === "string" && /^[\w-]{6,20}$/.test(t.youtubeId) ? t.youtubeId : null,
    deezerId: typeof t.deezerId === "number" ? t.deezerId : null,
    fullUrl:
      typeof t.fullUrl === "string" && t.fullUrl !== t.audioUrl ? t.fullUrl.slice(0, 2000) : null,
    extKey: typeof t.extKey === "string" ? t.extKey.slice(0, 120) : null,
    source: typeof t.source === "string" ? t.source.slice(0, 20) : null,
  };
}

async function webAlbumId(): Promise<number> {
  const [found] = await db.select().from(albums).where(eq(albums.slug, WEB_ALBUM_SLUG)).limit(1);
  if (found) return found.id;
  const [created] = await db
    .insert(albums)
    .values({
      slug: WEB_ALBUM_SLUG,
      title: "Web Streams",
      artist: "Various Artists",
      genre: "Online",
      coverUrl: "/icons/icon.png",
      year: new Date().getFullYear(),
      hue: 84,
    })
    .onConflictDoNothing({ target: albums.slug })
    .returning();
  if (created) return created.id;
  const [again] = await db.select().from(albums).where(eq(albums.slug, WEB_ALBUM_SLUG)).limit(1);
  return again.id;
}

/**
 * Idempotently stores any track (local, Apple, Audius, YouTube…) and returns
 * its real database row — the single entry point for likes, playlists, history.
 */
export async function upsertTrack(input: Track): Promise<TrackRow | null> {
  const key = externalKey(input);

  if (!key) {
    if (input.id > 0) {
      const [row] = await db.select().from(tracks).where(eq(tracks.id, input.id)).limit(1);
      return row ?? null;
    }
    return null;
  }

  const lookup = input.itunesId
    ? or(eq(tracks.extKey, key), eq(tracks.itunesId, input.itunesId))
    : eq(tracks.extKey, key);
  const [existing] = await db.select().from(tracks).where(lookup).limit(1);

  if (existing) {
    const patch: Partial<typeof tracks.$inferInsert> = {};
    if (!existing.extKey) patch.extKey = key;
    if (input.youtubeId && existing.youtubeId !== input.youtubeId)
      patch.youtubeId = input.youtubeId;
    if (input.fullUrl && existing.fullUrl !== input.fullUrl) patch.fullUrl = input.fullUrl;
    if (input.audiusId && !existing.audiusId) patch.audiusId = input.audiusId;
    if (!existing.source && input.source) patch.source = input.source;
    if (Object.keys(patch).length) {
      const [updated] = await db
        .update(tracks)
        .set(patch)
        .where(eq(tracks.id, existing.id))
        .returning();
      return updated ?? existing;
    }
    return existing;
  }

  const albumId = await webAlbumId();
  const inserted = await db
    .insert(tracks)
    .values({
      title: input.title,
      artist: input.artist || "Unknown artist",
      albumTitle: input.albumTitle || "Single",
      albumSlug: WEB_ALBUM_SLUG,
      genre: input.genre || "Music",
      durationSec: input.durationSec || 30,
      audioUrl: input.audioUrl,
      coverUrl: input.coverUrl || "/icons/icon.png",
      albumId,
      itunesId: key.startsWith("itunes:") ? (input.itunesId ?? null) : null,
      extKey: key,
      source: input.source ?? key.split(":")[0],
      audiusId: input.audiusId ?? null,
      youtubeId: input.youtubeId ?? null,
      deezerId: input.deezerId ?? null,
      fullUrl: input.fullUrl ?? null,
    })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return inserted[0];
  const [row] = await db.select().from(tracks).where(eq(tracks.extKey, key)).limit(1);
  return row ?? null;
}

/** Key used by the client to know which tracks are liked. */
export function rowKey(r: { extKey: string | null; itunesId: number | null; id: number }) {
  return r.extKey ?? (r.itunesId ? `itunes:${r.itunesId}` : `local:${r.id}`);
}
