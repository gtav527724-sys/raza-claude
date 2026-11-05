import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks, tracks } from "@/db/schema";
import { trustedMutation } from "@/lib/server/security";
import { getOwner } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const playlistId = Number(id);
    const owner = await getOwner();
    const [playlist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.owner, owner)))
      .limit(1);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    const rows = await db
      .select({ track: tracks })
      .from(playlistTracks)
      .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
      .where(eq(playlistTracks.playlistId, playlistId))
      .orderBy(asc(playlistTracks.position), asc(playlistTracks.id));
    return NextResponse.json({ playlist, tracks: rows.map((r) => r.track) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load playlist" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const { id } = await params;
    const owner = await getOwner();
    await db.delete(playlists).where(and(eq(playlists.id, Number(id)), eq(playlists.owner, owner)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 });
  }
}
