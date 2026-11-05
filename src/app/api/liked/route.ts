import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { likedSongs, tracks } from "@/db/schema";
import { trustedMutation } from "@/lib/server/security";
import { getOwner } from "@/lib/server/session";
import { parseTrackInput, rowKey, upsertTrack } from "@/lib/server/tracks";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const owner = await getOwner();
    const { searchParams } = new URL(req.url);
    if (searchParams.get("ids")) {
      const rows = await db
        .select({ id: tracks.id, extKey: tracks.extKey, itunesId: tracks.itunesId })
        .from(likedSongs)
        .innerJoin(tracks, eq(likedSongs.trackId, tracks.id))
        .where(eq(likedSongs.owner, owner));
      return NextResponse.json({
        ids: rows.map((r) => r.id),
        keys: rows.map(rowKey),
      });
    }
    const rows = await db
      .select({ track: tracks })
      .from(likedSongs)
      .innerJoin(tracks, eq(likedSongs.trackId, tracks.id))
      .where(eq(likedSongs.owner, owner))
      .orderBy(desc(likedSongs.createdAt));
    return NextResponse.json({ tracks: rows.map((r) => r.track) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load liked songs" }, { status: 500 });
  }
}

/** Body: { track } for internet tracks or { trackId } for catalog rows. `like:false` removes it. */
export async function POST(req: Request) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const owner = await getOwner();
    const body = (await req.json()) as { track?: unknown; trackId?: number; like?: boolean };
    const like = body.like !== false;

    let trackId = typeof body.trackId === "number" && body.trackId > 0 ? body.trackId : 0;
    let row = null;
    if (body.track) {
      const parsed = parseTrackInput(body.track);
      if (!parsed) return NextResponse.json({ error: "Invalid track" }, { status: 400 });
      row = await upsertTrack(parsed);
      trackId = row?.id ?? 0;
    }
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });

    if (like) {
      await db.insert(likedSongs).values({ owner, trackId }).onConflictDoNothing();
    } else {
      await db
        .delete(likedSongs)
        .where(and(eq(likedSongs.owner, owner), eq(likedSongs.trackId, trackId)));
    }
    return NextResponse.json({ ok: true, liked: like, track: row, trackId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const owner = await getOwner();
    const trackId = Number(new URL(req.url).searchParams.get("trackId"));
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });
    await db
      .delete(likedSongs)
      .where(and(eq(likedSongs.owner, owner), eq(likedSongs.trackId, trackId)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to unlike track" }, { status: 500 });
  }
}
