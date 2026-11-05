/**
 * Convert CORS-unsafe catalog URLs to the same-origin relay.
 * Audius already provides CORS, so direct streaming remains fastest.
 */
import { isDownloadedUrl, offlineProxyUrl } from "./offline";

export function playbackUrl(raw: string) {
  if (typeof window === "undefined" || !raw) return raw;
  try {
    if (isDownloadedUrl(raw)) return offlineProxyUrl(raw);
    const u = new URL(raw, window.location.origin);
    if (u.origin === window.location.origin) return u.href;
    if (
      u.hostname.includes("soundhelix.com") ||
      u.hostname.includes("itunes.apple.com") ||
      u.hostname.includes("dzcdn.net")
    ) {
      return `/api/stream?url=${encodeURIComponent(u.href)}`;
    }
    return u.href;
  } catch {
    return raw;
  }
}
