import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/server/session";
import { googleAccessToken, playlistTracks, ytApi } from "@/lib/server/ytuser";

export const dynamic = "force-dynamic";

interface MyPlaylists {
  items?: Array<{
    id?: string;
    snippet?: { title?: string; thumbnails?: Record<string, { url?: string }> };
    contentDetails?: { itemCount?: number };
  }>;
}

/**
 * Signed-in users: their own YouTube playlists (no `list`) or the tracks of one
 * (`list=<id>` — use `LL` for liked videos).
 */
export async function GET(req: Request) {
  try {
    const uid = await getSessionUserId();
    if (!uid) return NextResponse.json({ error: "login required" }, { status: 401 });
    const token = await googleAccessToken(uid);
    if (!token) return NextResponse.json({ error: "token expired — login again" }, { status: 401 });

    const list = new URL(req.url).searchParams.get("list");
    if (list) {
      if (!/^[\w-]{2,64}$/.test(list)) return NextResponse.json({ items: [] }, { status: 400 });
      return NextResponse.json({ items: await playlistTracks(token, list) });
    }

    const mine = await ytApi<MyPlaylists>(
      "playlists?part=snippet,contentDetails&mine=true&maxResults=25",
      token,
    );
    const playlists = (mine.items ?? []).map((p) => ({
      id: p.id ?? "",
      title: p.snippet?.title ?? "Playlist",
      count: p.contentDetails?.itemCount ?? 0,
      thumb: p.snippet?.thumbnails?.medium?.url ?? p.snippet?.thumbnails?.default?.url ?? "",
    }));
    return NextResponse.json({
      playlists: [{ id: "LL", title: "Liked videos", count: 0, thumb: "" }, ...playlists],
    });
  } catch (err) {
    console.error("youtube library", err);
    return NextResponse.json({ error: "YouTube library unavailable" }, { status: 502 });
  }
}
