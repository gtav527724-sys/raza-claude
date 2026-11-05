import type { Track } from "./types";

/** Pure helpers shared by server and client. */

export type PlayKind = "audio" | "yt" | "resolve";

const PREVIEW_HOSTS = /audio-ssl\.itunes\.apple\.com|\.mzstatic\.com|dzcdn\.net|cdnt-preview/i;

/** True for 30-second catalog previews (Apple / Deezer). */
export function isPreview(t: Track): boolean {
  if (t.fullUrl || t.youtubeId) return false;
  if (t.source === "itunes" || t.source === "deezer") return true;
  return PREVIEW_HOSTS.test(t.audioUrl ?? "");
}

export function playKind(t: Track): PlayKind {
  if (t.fullUrl) return "audio";
  if (t.youtubeId) return "yt";
  if (isPreview(t)) return "resolve";
  return "audio";
}

/** URL for the <audio> element. */
export function audioSrc(t: Track): string {
  return t.fullUrl || t.audioUrl;
}

/** Stable identity of a track across providers / database rows. */
export function trackKey(t: Track): string {
  if (t.extKey) return t.extKey;
  if (t.source === "youtube" && t.youtubeId) return `yt:${t.youtubeId}`;
  if (t.source === "audius" || (t.audiusId && !t.itunesId)) return `audius:${t.audiusId}`;
  if (t.itunesId) return `itunes:${t.itunesId}`;
  if (t.deezerId) return `deezer:${t.deezerId}`;
  if (t.id > 0) return `local:${t.id}`;
  return `tmp:${t.id}`;
}

/** True when the track still has to be saved to the database before liking / playlisting. */
export function needsSync(t: Track): boolean {
  return t.id < 0 || (Boolean(t.itunesId || t.audiusId || t.youtubeId || t.deezerId) && !t.extKey);
}
