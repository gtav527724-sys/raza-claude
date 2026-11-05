import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks } from "@/db/schema";
import { trustedMutation } from "@/lib/server/security";
import { getOwner } from "@/lib/server/session";
import { parseTrackInput, upsertTrack } from "@/lib/server/tracks";

export const dynamic = "force-dynamic";

async function ownsPlaylist(playlistId: number, owner: string) {
  const [p] = await db
    .select({ id: playlists.id })
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.owner, owner)))
    .limit(1);
  return Boolean(p);
}

/** Body: { track } (any provider) or { trackId } (catalog row). Saves + adds in ONE request. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const { id } = await params;
    const playlistId = Number(id);
    const owner = await getOwner();
    if (!(await ownsPlaylist(playlistId, owner))) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    const body = (await req.json()) as { track?: unknown; trackId?: number };
    let trackId = typeof body.trackId === "number" && body.trackId > 0 ? body.trackId : 0;
    let row = null;
    if (body.track) {
      const parsed = parseTrackInput(body.track);
      if (!parsed) return NextResponse.json({ error: "Invalid track" }, { status: 400 });
      row = await upsertTrack(parsed);
      trackId = row?.id ?? 0;
    }
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });

    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(position), 0)` })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId));
    await db
      .insert(playlistTracks)
      .values({ playlistId, trackId, position: Number(max) + 1 })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true, track: row, trackId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add track" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const { id } = await params;
    const playlistId = Number(id);
    const owner = await getOwner();
    if (!(await ownsPlaylist(playlistId, owner))) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    const trackId = Number(new URL(req.url).searchParams.get("trackId"));
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });
    await db
      .delete(playlistTracks)
      .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to remove track" }, { status: 500 });
  }
}
