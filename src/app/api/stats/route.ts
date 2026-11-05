import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { getOwner } from "@/lib/server/session";
import { albums, likedSongs, playlists, recentPlays, tracks } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const owner = await getOwner();
    const [t] = await db.select({ n: sql<number>`count(*)` }).from(tracks);
    const [a] = await db.select({ n: sql<number>`count(*)` }).from(albums);
    const [p] = await db
      .select({ n: sql<number>`count(*)` })
      .from(playlists)
      .where(eq(playlists.owner, owner));
    const [l] = await db
      .select({ n: sql<number>`count(*)` })
      .from(likedSongs)
      .where(eq(likedSongs.owner, owner));
    const [r] = await db
      .select({ n: sql<number>`count(*)` })
      .from(recentPlays)
      .where(eq(recentPlays.owner, owner));
    return NextResponse.json({
      tracks: Number(t.n),
      albums: Number(a.n),
      playlists: Number(p.n),
      liked: Number(l.n),
      plays: Number(r.n),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
