import { NextResponse } from "next/server";
import { searchAudius, trendingAudius } from "@/lib/audius";
import { rateLimit } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "audius", 30);
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  try {
    const tracks = q ? await searchAudius(q, 16) : await trendingAudius(14);
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error("Audius failed", err);
    return NextResponse.json({ tracks: [], offline: true });
  }
}
