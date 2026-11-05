import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { getOwner } from "@/lib/server/session";
import { recentPlays, tracks } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const owner = await getOwner();
    const topTracks = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        artist: tracks.artist,
        coverUrl: tracks.coverUrl,
        albumSlug: tracks.albumSlug,
        plays: sql<number>`count(*)`,
      })
      .from(recentPlays)
      .innerJoin(tracks, eq(recentPlays.trackId, tracks.id))
      .where(eq(recentPlays.owner, owner))
      .groupBy(tracks.id, tracks.title, tracks.artist, tracks.coverUrl, tracks.albumSlug)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const topArtists = await db
      .select({ artist: tracks.artist, plays: sql<number>`count(*)` })
      .from(recentPlays)
      .innerJoin(tracks, eq(recentPlays.trackId, tracks.id))
      .where(eq(recentPlays.owner, owner))
      .groupBy(tracks.artist)
      .orderBy(desc(sql`count(*)`))
      .limit(8);

    const topGenres = await db
      .select({ genre: tracks.genre, plays: sql<number>`count(*)` })
      .from(recentPlays)
      .innerJoin(tracks, eq(recentPlays.trackId, tracks.id))
      .where(eq(recentPlays.owner, owner))
      .groupBy(tracks.genre)
      .orderBy(desc(sql`count(*)`))
      .limit(6);

    const [totals] = await db
      .select({
        plays: sql<number>`count(*)`,
        seconds: sql<number>`coalesce(sum(${tracks.durationSec}),0)`,
      })
      .from(recentPlays)
      .innerJoin(tracks, eq(recentPlays.trackId, tracks.id))
      .where(eq(recentPlays.owner, owner));

    return NextResponse.json({
      topTracks: topTracks.map((t) => ({ ...t, plays: Number(t.plays) })),
      topArtists: topArtists.map((a) => ({ ...a, plays: Number(a.plays) })),
      topGenres: topGenres.map((g) => ({ ...g, plays: Number(g.plays) })),
      totalPlays: Number(totals?.plays ?? 0),
      totalMinutes: Math.round(Number(totals?.seconds ?? 0) / 60),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
