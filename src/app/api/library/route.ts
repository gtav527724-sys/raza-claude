import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { likedSongs, recentPlays, tracks } from "@/db/schema";
import { getOwner } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const owner = await getOwner();
    const [likedRows, recentRows] = await Promise.all([
      db
        .select({ track: tracks })
        .from(likedSongs)
        .innerJoin(tracks, eq(likedSongs.trackId, tracks.id))
        .where(eq(likedSongs.owner, owner))
        .orderBy(desc(likedSongs.createdAt)),
      db
        .select({ track: tracks })
        .from(recentPlays)
        .innerJoin(tracks, eq(recentPlays.trackId, tracks.id))
        .where(eq(recentPlays.owner, owner))
        .orderBy(desc(recentPlays.playedAt))
        .limit(24),
    ]);

    const seen = new Set<number>();
    const recent = recentRows
      .map((r) => r.track)
      .filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
      .slice(0, 10);

    return NextResponse.json({
      likedCount: likedRows.length,
      likedCovers: likedRows.slice(0, 4).map((r) => r.track.coverUrl),
      liked: likedRows.map((r) => r.track),
      recent,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load library" }, { status: 500 });
  }
}
