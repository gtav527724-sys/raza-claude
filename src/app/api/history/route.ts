import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { recentPlays, tracks } from "@/db/schema";
import { trackIdSchema, trustedMutation } from "@/lib/server/security";
import { getOwner } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const owner = await getOwner();
    const rows = await db
      .select({ track: tracks })
      .from(recentPlays)
      .innerJoin(tracks, eq(recentPlays.trackId, tracks.id))
      .where(eq(recentPlays.owner, owner))
      .orderBy(desc(recentPlays.playedAt))
      .limit(30);
    const seen = new Set<number>();
    const deduped = rows
      .map((r) => r.track)
      .filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
      .slice(0, 12);
    return NextResponse.json({ tracks: deduped });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const owner = await getOwner();
    if (new URL(req.url).searchParams.get("all")) {
      await db.delete(recentPlays).where(eq(recentPlays.owner, owner));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const parsed = trackIdSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "trackId required" }, { status: 400 });
    }
    const owner = await getOwner();
    await db.insert(recentPlays).values({ owner, trackId: parsed.data.trackId });
    await db.execute(
      sql`DELETE FROM recent_plays WHERE owner = ${owner} AND id NOT IN (
        SELECT id FROM recent_plays WHERE owner = ${owner} ORDER BY played_at DESC LIMIT 60
      )`,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to record play" }, { status: 500 });
  }
}
