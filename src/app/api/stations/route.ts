import { NextResponse } from "next/server";
import type { Track } from "@/lib/types";
import { rateLimit } from "@/lib/server/security";

export const dynamic = "force-dynamic";

interface Station {
  stationuuid: string;
  name: string;
  url_resolved: string;
  favicon?: string;
  tags?: string;
  country?: string;
  votes?: number;
  codec?: string;
}

function hash(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return -7_000_000_000 - Math.abs(h);
}

export async function GET(req: Request) {
  const limited = rateLimit(req, "stations", 30);
  if (limited) return limited;
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const country = sp.get("country")?.trim();
  const path = q
    ? `/json/stations/search?name=${encodeURIComponent(q)}&limit=50&hidebroken=true&order=votes&reverse=true`
    : country
      ? `/json/stations/bycountrycodeexact/${encodeURIComponent(country.toUpperCase())}?limit=50&hidebroken=true&order=votes&reverse=true`
      : `/json/stations/topvote/50?hidebroken=true`;
  try {
    const res = await fetch(`https://de1.api.radio-browser.info${path}`, {
      headers: { "User-Agent": "SONARA/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return NextResponse.json({ tracks: [] });
    const raw = (await res.json()) as Station[];
    const tracks: Track[] = raw
      .filter((s) => s.url_resolved?.startsWith("https://"))
      .map((s) => ({
        id: hash(s.stationuuid),
        source: "radio" as const,
        title: s.name,
        artist: `${s.country || "Internet Radio"} · LIVE`,
        albumTitle: "Live Radio",
        albumSlug: "",
        genre: s.tags?.split(",")[0] || "Radio",
        durationSec: 0,
        audioUrl: s.url_resolved,
        coverUrl: s.favicon || "/icons/icon.png",
      }));
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ tracks: [] });
  }
}
