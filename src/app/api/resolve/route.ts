import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/security";
import { resolveFullTrack } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Finds the FULL-LENGTH version of a 30-second preview track. */
export async function GET(req: Request) {
  const limited = rateLimit(req, "resolve", 240);
  if (limited) return limited;
  const sp = new URL(req.url).searchParams;
  const title = sp.get("title")?.slice(0, 200) ?? "";
  const artist = sp.get("artist")?.slice(0, 200) ?? "";
  const dur = Number(sp.get("dur") ?? 0) || 0;
  if (!title) return NextResponse.json({ youtubeIds: [] }, { status: 400 });
  try {
    const r = await resolveFullTrack(title, artist, dur);
    return NextResponse.json(r, {
      headers: { "Cache-Control": "private, max-age=600" },
    });
  } catch (err) {
    console.error("resolve failed", err);
    return NextResponse.json({ youtubeIds: [] });
  }
}
