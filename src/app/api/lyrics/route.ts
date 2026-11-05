import { NextResponse } from "next/server";
import { rateLimit, sanitizeText } from "@/lib/server/security";

export const dynamic = "force-dynamic";

const cache = new Map<string, { t: number; data: unknown }>();
const TTL = 30 * 60 * 1000;

interface LrcResult {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

function clean(s: string) {
  return s
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s*-\s*(remix|live|radio edit|audius exclusive).*$/i, "")
    .replace(/\s*(feat\.|ft\.).*$/i, "")
    .trim();
}

function parseLrc(raw: string) {
  return raw
    .split("\n")
    .map((line) => {
      const m = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
      if (!m) return null;
      return { time: Number(m[1]) * 60 + Number(m[2]), text: m[3].trim() };
    })
    .filter((x): x is { time: number; text: string } => x !== null)
    .sort((a, b) => a.time - b.time);
}

export async function GET(req: Request) {
  const limited = rateLimit(req, "lyrics", 30);
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const artist = sanitizeText(searchParams.get("artist") ?? "", 120);
  const title = sanitizeText(searchParams.get("title") ?? "", 160);
  if (!artist || !title) return NextResponse.json({ lyrics: null, timed: null });

  const a = clean(artist).split(/[,&]/)[0].trim();
  const t = clean(title);
  const key = `${a}|${t}`.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return NextResponse.json(hit.data);

  try {
    const lrcRes = await fetch(
      `https://lrclib.net/api/search?track_name=${encodeURIComponent(t)}&artist_name=${encodeURIComponent(a)}`,
      { headers: { "User-Agent": "SONARA/1.0" }, signal: AbortSignal.timeout(7000) },
    );
    if (lrcRes.ok) {
      const results = (await lrcRes.json()) as LrcResult[];
      const synced = results.find((r) => r.syncedLyrics)?.syncedLyrics;
      const plain = results.find((r) => r.plainLyrics)?.plainLyrics;
      const timed = synced ? parseLrc(synced) : null;
      const lyrics = (plain ?? synced?.replace(/^\[[^\]]+\]\s*/gm, "") ?? "")
        .replace(/\r/g, "")
        .split("\n")
        .map((l) => l.trim());
      if ((timed?.length ?? 0) > 2 || lyrics.some(Boolean)) {
        const payload = { lyrics, timed };
        cache.set(key, { t: Date.now(), data: payload });
        return NextResponse.json(payload);
      }
    }
  } catch {
    // fall through to plain provider
  }

  try {
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(a)}/${encodeURIComponent(t)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return NextResponse.json({ lyrics: null, timed: null });
    const d = (await res.json()) as { lyrics?: string };
    const lines = (d.lyrics ?? "")
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.trim());
    const payload = { lyrics: lines.some(Boolean) ? lines : null, timed: null };
    cache.set(key, { t: Date.now(), data: payload });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ lyrics: null, timed: null });
  }
}
