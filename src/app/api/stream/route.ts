import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Same-origin audio relay for sources that do not send CORS headers.
 * Range headers are preserved so seeking remains instant.
 * Strict allowlist prevents this endpoint becoming an open proxy.
 */
const ALLOWED = new Set([
  "www.soundhelix.com",
  "soundhelix.com",
  "audio-ssl.itunes.apple.com",
  "audius.co",
  "api.audius.co",
]);

function allowedHost(host: string) {
  return (
    ALLOWED.has(host) ||
    host.endsWith(".audius.co") ||
    host.endsWith(".audiusindex.org") ||
    host.endsWith(".monophonic.digital") ||
    host.endsWith(".figment.io") ||
    host.endsWith(".staked.cloud") ||
    host.endsWith(".itunes.apple.com") ||
    host.endsWith(".dzcdn.net") ||
    host.endsWith(".deezer.com")
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("url");
    if (!raw) return NextResponse.json({ error: "url required" }, { status: 400 });
    const target = new URL(raw);
    if (target.protocol !== "https:" || !allowedHost(target.hostname)) {
      return NextResponse.json({ error: "source not allowed" }, { status: 403 });
    }

    const range = req.headers.get("range");
    const upstream = await fetch(target, {
      headers: {
        ...(range ? { Range: range } : {}),
        "User-Agent": "SONARA/1.0",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: `upstream ${upstream.status}` }, { status: 502 });
    }

    const headers = new Headers();
    for (const key of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
    ]) {
      const v = upstream.headers.get(key);
      if (v) headers.set(key, v);
    }
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    headers.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    console.error("stream proxy", err);
    return NextResponse.json({ error: "stream failed" }, { status: 502 });
  }
}
