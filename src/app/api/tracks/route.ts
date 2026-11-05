import { asc, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { albums, tracks } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q) {
      const all = await db.select().from(tracks).orderBy(asc(tracks.id)).limit(30);
      return NextResponse.json({ tracks: all, albums: [] });
    }

    const pattern = `%${q}%`;
    const matchedTracks = await db
      .select()
      .from(tracks)
      .where(
        or(
          ilike(tracks.title, pattern),
          ilike(tracks.artist, pattern),
          ilike(tracks.albumTitle, pattern),
          ilike(tracks.genre, pattern),
        ),
      )
      .orderBy(asc(tracks.id))
      .limit(40);

    const matchedAlbums = await db
      .select()
      .from(albums)
      .where(
        or(
          ilike(albums.title, pattern),
          ilike(albums.artist, pattern),
          ilike(albums.genre, pattern),
        ),
      )
      .orderBy(asc(albums.id))
      .limit(12);

    return NextResponse.json({ tracks: matchedTracks, albums: matchedAlbums });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
