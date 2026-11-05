import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/security";
import { searchYoutubeTracks } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "youtube", 120);
  if (limited) return limited;
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ tracks: [] });
  try {
    return NextResponse.json({ tracks: await searchYoutubeTracks(q, 24) });
  } catch (err) {
    console.error("youtube search failed", err);
    return NextResponse.json({ tracks: [], offline: true });
  }
}
