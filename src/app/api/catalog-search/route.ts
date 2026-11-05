import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/security";

export const dynamic = "force-dynamic";

interface MBRecording {
  id: string;
  title: string;
  length?: number;
  "artist-credit"?: Array<{ name?: string }>;
  releases?: Array<{ title?: string }>;
}

export async function GET(req: Request) {
  const limited = rateLimit(req, "musicbrainz", 30);
  if (limited) return limited;
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ recordings: [] });
  try {
    const res = await fetch(
      `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(q)}&fmt=json&limit=15`,
      {
        headers: { "User-Agent": "SONARA/1.0 (music-player)" },
        signal: AbortSignal.timeout(9000),
      },
    );
    if (!res.ok) return NextResponse.json({ recordings: [] });
    const d = (await res.json()) as { recordings?: MBRecording[] };
    const recordings = (d.recordings ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      artist:
        r["artist-credit"]
          ?.map((a) => a.name)
          .filter(Boolean)
          .join(", ") || "Unknown",
      album: r.releases?.[0]?.title ?? "",
      durationSec: Math.round((r.length ?? 0) / 1000),
    }));
    return NextResponse.json({ recordings });
  } catch {
    return NextResponse.json({ recordings: [] });
  }
}
