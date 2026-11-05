import type { Track } from "./types";

/**
 * Server-side YouTube catalog (InnerTube search, no API key / no quota).
 * Playback always happens through the official YouTube IFrame player on the
 * client, so full-length songs play exactly like on YouTube.
 */

export interface YtVideo {
  id: string;
  title: string;
  channel: string;
  durationSec: number;
  thumb: string;
}

const cache = new Map<string, { t: number; data: unknown }>();
const TTL = 30 * 60 * 1000;

function cached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.data as T;
  return null;
}
function remember(key: string, data: unknown) {
  if (cache.size > 400) cache.delete(cache.keys().next().value as string);
  cache.set(key, { t: Date.now(), data });
}

export function hashedId(prefix: number, id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return -(Math.abs(h) % 100_000_000) - prefix * 10 ** 9;
}

function parseDuration(text?: string): number {
  if (!text) return 0;
  const parts = text.split(":").map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

interface Runs {
  runs?: Array<{ text?: string }>;
  simpleText?: string;
}
interface VideoRenderer {
  videoId?: string;
  title?: Runs;
  ownerText?: Runs;
  longBylineText?: Runs;
  lengthText?: Runs;
  thumbnail?: { thumbnails?: Array<{ url?: string }> };
}

function text(r?: Runs) {
  return r?.simpleText ?? r?.runs?.map((x) => x.text ?? "").join("") ?? "";
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function collectVideos(node: unknown, out: VideoRenderer[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) collectVideos(n, out);
    return;
  }
  const obj = node as Record<string, unknown>;
  if (obj.videoRenderer) out.push(obj.videoRenderer as VideoRenderer);
  for (const k of Object.keys(obj)) {
    if (k === "videoRenderer") continue;
    collectVideos(obj[k], out);
  }
}

export async function searchYoutube(query: string, limit = 20): Promise<YtVideo[]> {
  const q = query.trim();
  if (!q) return [];
  const key = `s:${q.toLowerCase()}:${limit}`;
  const hit = cached<YtVideo[]>(key);
  if (hit) return hit;

  const body = {
    context: {
      client: { clientName: "WEB", clientVersion: "2.20250101.00.00", hl: "en", gl: "US" },
    },
    query: q,
    params: "EgIQAQ%3D%3D", // videos only
  };
  const res = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      Cookie: "SOCS=CAI; CONSENT=YES+1",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`youtube search ${res.status}`);
  const json = (await res.json()) as unknown;
  const raw: VideoRenderer[] = [];
  collectVideos(json, raw);

  const seen = new Set<string>();
  const videos: YtVideo[] = [];
  for (const v of raw) {
    if (!v.videoId || seen.has(v.videoId)) continue;
    const dur = parseDuration(v.lengthText ? text(v.lengthText) : "");
    if (dur <= 0) continue; // live streams
    seen.add(v.videoId);
    videos.push({
      id: v.videoId,
      title: text(v.title),
      channel: text(v.ownerText) || text(v.longBylineText),
      durationSec: dur,
      thumb: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
    });
    if (videos.length >= limit) break;
  }
  remember(key, videos);
  return videos;
}

/* ── mapping to Sonara tracks ─────────────────────────────────────── */

function cleanTitle(t: string) {
  return t
    .replace(
      /\s*[\[(](official\s*)?(music\s*)?(video|audio|lyrics?|lyric video|visuali[sz]er|hd|4k|mv|full song)[^\])]*[\])]/gi,
      "",
    )
    .replace(/\s*\|.*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function videoToTrack(v: YtVideo): Track {
  const topic = /\s-\sTopic$/i.test(v.channel);
  let artist =
    v.channel
      .replace(/\s-\sTopic$/i, "")
      .replace(/VEVO$/i, "")
      .trim() || "YouTube";
  let title = cleanTitle(v.title);
  if (!topic) {
    const m = title.match(/^(.{2,60}?)\s[-–—]\s(.{2,})$/);
    if (m) {
      artist = m[1].trim();
      title = m[2].trim();
    }
  }
  return {
    id: hashedId(3, v.id),
    itunesId: null,
    youtubeId: v.id,
    source: "youtube",
    title: title || v.title,
    artist,
    albumTitle: "YouTube",
    albumSlug: "",
    genre: "Music",
    durationSec: v.durationSec,
    audioUrl: `https://www.youtube.com/watch?v=${v.id}`,
    coverUrl: v.thumb,
  };
}

export async function searchYoutubeTracks(query: string, limit = 20): Promise<Track[]> {
  const vids = await searchYoutube(query, limit + 6);
  // keep song-length results (skip 1h mixes, shorts-length clips)
  return vids
    .filter((v) => v.durationSec >= 45 && v.durationSec <= 15 * 60)
    .slice(0, limit)
    .map(videoToTrack);
}

/* ── full-length resolver for 30-second preview tracks ────────────── */

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[\[(][^\])]*[\])]/g, " ")
    .replace(/\b(feat|ft|featuring)\.?\s.*$/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const BAD =
  /\b(live|cover|remix|karaoke|reaction|slowed|sped up|speed up|8d|nightcore|instrumental|tutorial|lesson|mashup|reverb|bass boosted|loop|1 hour|10 hours)\b/i;

export function scoreVideo(v: YtVideo, title: string, artist: string, expected: number) {
  const wantTitle = norm(title);
  const wantArtist = norm(artist.split(/,|&| x | and /i)[0] ?? artist);
  const vt = norm(v.title);
  const vc = norm(v.channel.replace(/\s-\sTopic$/i, ""));
  let s = 0;
  if (wantTitle && vt.includes(wantTitle)) s += 4;
  else {
    const words = wantTitle.split(" ").filter((w) => w.length > 1);
    const hits = words.filter((w) => vt.includes(w)).length;
    s += words.length ? (hits / words.length) * 3 : 0;
  }
  if (wantArtist && (vt.includes(wantArtist) || vc.includes(wantArtist))) s += 3;
  if (/\s-\sTopic$/i.test(v.channel)) s += 2;
  if (/official audio|provided to youtube/i.test(v.title)) s += 1.5;
  if (/vevo$/i.test(v.channel)) s += 1;
  if (/official/i.test(v.title)) s += 0.5;
  if (expected > 40) {
    const diff = Math.abs(v.durationSec - expected);
    if (diff <= 3) s += 4;
    else if (diff <= 8) s += 3;
    else if (diff <= 15) s += 1.5;
    else if (diff / expected > 0.25) s -= 4;
  }
  if (BAD.test(v.title) && !BAD.test(title)) s -= 4;
  if (v.durationSec > 900) s -= 5;
  return s;
}

export interface Resolution {
  youtubeIds: string[];
  fullUrl?: string;
  audiusId?: string;
}

export async function resolveFullTrack(
  title: string,
  artist: string,
  expectedSec: number,
): Promise<Resolution> {
  const key = `r:${norm(title)}|${norm(artist)}|${Math.round(expectedSec / 5)}`;
  const hit = cached<Resolution>(key);
  if (hit) return hit;

  const out: Resolution = { youtubeIds: [] };

  // 1) Audius: plain full-length mp3 stream — only on a strict match.
  try {
    const { searchAudius } = await import("./audius");
    const list = await searchAudius(`${title} ${artist}`, 8);
    const wantT = norm(title);
    const wantA = norm(artist.split(/,|&/)[0] ?? artist);
    const strict = list.find((t) => {
      const tt = norm(t.title);
      const ta = norm(t.artist);
      const durOk = expectedSec <= 40 || Math.abs(t.durationSec - expectedSec) <= 12;
      return (
        tt === wantT && (ta.includes(wantA) || wantA.includes(ta)) && durOk && !BAD.test(t.title)
      );
    });
    if (strict) {
      out.fullUrl = strict.audioUrl;
      out.audiusId = strict.audiusId ?? undefined;
    }
  } catch {
    /* audius optional */
  }

  // 2) YouTube: ranked candidates (client falls through if embedding is blocked).
  try {
    const first = await searchYoutube(`${artist} ${title} audio`, 14);
    let pool = first;
    if (first.length < 4) pool = [...first, ...(await searchYoutube(`${artist} ${title}`, 10))];
    const ranked = pool
      .map((v) => ({ v, s: scoreVideo(v, title, artist, expectedSec) }))
      .filter((r) => r.s >= 2.5)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4);
    out.youtubeIds = ranked.map((r) => r.v.id);
  } catch {
    /* handled by caller */
  }

  if (out.fullUrl || out.youtubeIds.length) remember(key, out);
  return out;
}
