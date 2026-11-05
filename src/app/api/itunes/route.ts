import { NextResponse } from "next/server";
import { searchItunes } from "@/lib/itunes";
import { rateLimit } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "itunes", 30);
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ tracks: [] });
  try {
    const tracks = await searchItunes(q, 40);
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error("iTunes search failed", err);
    return NextResponse.json({ tracks: [], offline: true });
  }
}
