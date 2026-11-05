import { asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { getOwner } from "@/lib/server/session";
import { recentPlays, tracks } from "@/db/schema";
import { searchAudius } from "@/lib/audius";
import type { Track } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Daily Mix — seeded-by-day shuffle mixing your taste with fresh discovery. */
export async function GET() {
  try {
    const owner = await getOwner();
    const topArtists = await db
      .select({ artist: tracks.artist, n: sql<number>`count(*)` })
      .from(recentPlays)
      .innerJoin(tracks, eq(recentPlays.trackId, tracks.id))
      .where(eq(recentPlays.owner, owner))
      .groupBy(tracks.artist)
      .orderBy(sql`count(*) desc`)
      .limit(4);

    const seeds = topArtists.map((a) => a.artist);
    let picks: Track[] = [];
    for (const a of seeds.slice(0, 3)) {
      const list = await searchAudius(a, 6).catch(() => [] as Track[]);
      picks = picks.concat(list);
    }

    // day-seeded deterministic remix of local catalog as well
    const local = await db.select().from(tracks).orderBy(asc(tracks.id)).limit(40);
    const day = Math.floor(Date.now() / 86400000);
    const localShuffled = local
      .map((t, i) => ({ t, k: (day * 31 + i * 7) % 100 }))
      .sort((a, b) => a.k - b.k)
      .map(({ t }) => t as Track)
      .slice(0, 10);

    const seen = new Set<string>();
    const mix = [...picks, ...localShuffled]
      .filter((t) => {
        const k = `${t.title}|${t.artist}`.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 25);

    return NextResponse.json({ title: "Daily Mix", tracks: mix });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ title: "Daily Mix", tracks: [] });
  }
}
