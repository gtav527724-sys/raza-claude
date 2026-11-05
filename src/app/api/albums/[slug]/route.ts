import { asc, eq, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { albums, tracks } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const [album] = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1);

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const albumTracks = await db
      .select()
      .from(tracks)
      .where(eq(tracks.albumId, album.id))
      .orderBy(asc(tracks.id));

    const more = await db
      .select()
      .from(albums)
      .where(ne(albums.slug, slug))
      .orderBy(sql`random()`)
      .limit(6);

    return NextResponse.json({ album, tracks: albumTracks, more });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load album" }, { status: 500 });
  }
}
