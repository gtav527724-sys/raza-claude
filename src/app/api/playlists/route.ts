import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks, tracks } from "@/db/schema";
import { playlistSchema, trustedMutation } from "@/lib/server/security";
import { getOwner } from "@/lib/server/session";

export const dynamic = "force-dynamic";

async function withStats(owner: string) {
  const all = await db
    .select()
    .from(playlists)
    .where(eq(playlists.owner, owner))
    .orderBy(desc(playlists.createdAt));
  return Promise.all(
    all.map(async (p) => {
      const [rows, [{ count }]] = await Promise.all([
        db
          .select({ coverUrl: tracks.coverUrl })
          .from(playlistTracks)
          .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
          .where(eq(playlistTracks.playlistId, p.id))
          .orderBy(playlistTracks.position)
          .limit(4),
        db
          .select({ count: sql<number>`count(*)` })
          .from(playlistTracks)
          .where(eq(playlistTracks.playlistId, p.id)),
      ]);
      return { ...p, trackCount: Number(count), covers: rows.map((r) => r.coverUrl) };
    }),
  );
}

export async function GET() {
  try {
    return NextResponse.json({ playlists: await withStats(await getOwner()) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load playlists" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const parsed = playlistSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const owner = await getOwner();
    const [created] = await db
      .insert(playlists)
      .values({ owner, name: parsed.data.name })
      .returning();
    return NextResponse.json({ playlist: { ...created, trackCount: 0, covers: [] } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }
}
