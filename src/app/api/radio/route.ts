import { NextResponse } from "next/server";
import { searchAudius } from "@/lib/audius";
import { searchItunes } from "@/lib/itunes";
import type { Track } from "@/lib/types";
import { rateLimit } from "@/lib/server/security";

export const dynamic = "force-dynamic";

/** Mood/genre radio — blends full songs + chart hits, shuffled. */
const MOOD_QUERIES: Record<string, string[]> = {
  chill: ["chill", "lofi", "ambient chill", "downtempo"],
  workout: ["workout", "edm hype", "trap bangers", "power"],
  focus: ["focus instrumental", "study beats", "ambient piano"],
  party: ["party", "dance hits", "house party", "club"],
  sad: ["sad", "melancholy", "emotional piano"],
  romance: ["love songs", "romantic", "rnb slow"],
  sleep: ["sleep", "calm ambient", "rain piano"],
  drive: ["synthwave drive", "road trip", "night drive"],
};

export async function GET(req: Request) {
  const limited = rateLimit(req, "radio", 30);
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const mood = (searchParams.get("mood") ?? "chill").toLowerCase();
  const queries = MOOD_QUERIES[mood] ?? [mood];

  try {
    const results = await Promise.all([
      ...queries.slice(0, 2).map((q) => searchAudius(q, 10).catch(() => [] as Track[])),
      searchItunes(queries[0], 10).catch(() => [] as Track[]),
    ]);
    const seen = new Set<string>();
    const merged = results
      .flat()
      .filter((t) => {
        const k = `${t.title}|${t.artist}`.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      // shuffle for a fresh station each time
      .map((t) => ({ t, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(({ t }) => t)
      .slice(0, 30);

    return NextResponse.json({ mood, tracks: merged });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ mood, tracks: [] });
  }
}
