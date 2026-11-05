import { NextResponse } from "next/server";
import { searchDeezer } from "@/lib/deezer";
import { rateLimit } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "deezer", 30);
  if (limited) return limited;
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ tracks: [] });
  try {
    return NextResponse.json({ tracks: await searchDeezer(q, 35) });
  } catch (err) {
    console.error("Deezer", err);
    return NextResponse.json({ tracks: [] });
  }
}
