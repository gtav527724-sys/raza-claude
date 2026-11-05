import { NextResponse } from "next/server";
import { parseTrackInput, upsertTrack } from "@/lib/server/tracks";
import { trustedMutation } from "@/lib/server/security";

export const dynamic = "force-dynamic";

/**
 * Persists an internet track into the catalog (idempotent) and returns the
 * real database row. Also stores any resolved full-length source.
 */
export async function POST(req: Request) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const body = (await req.json()) as { track?: unknown };
    const t = parseTrackInput(body.track);
    if (!t) return NextResponse.json({ error: "Invalid track" }, { status: 400 });
    const row = await upsertTrack(t);
    if (!row) return NextResponse.json({ error: "Not an internet track" }, { status: 400 });
    return NextResponse.json({ track: row });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
