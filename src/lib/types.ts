export interface Track {
  id: number;
  title: string;
  artist: string;
  albumTitle: string;
  albumSlug: string;
  genre: string;
  durationSec: number;
  audioUrl: string;
  coverUrl: string;
  /** Set when the track came from the Apple Music preview catalog. */
  itunesId?: number | null;
  /** Audius track id (full-length open streams). */
  audiusId?: string | null;
  deezerId?: number | null;
  /** YouTube video id — played through the official IFrame player (full length). */
  youtubeId?: string | null;
  /** Resolved full-length direct stream (used instead of a 30s preview). */
  fullUrl?: string | null;
  /** Stable provider identity such as "itunes:123" or "yt:VIDEOID". */
  extKey?: string | null;
  source?:
    "local" | "itunes" | "audius" | "deezer" | "youtube" | "podcast" | "radio" | string | null;
  /** True when the result is a legal preview rather than a full open stream. */
  previewOnly?: boolean;
}

export interface Album {
  id: number;
  slug: string;
  title: string;
  artist: string;
  genre: string;
  coverUrl: string;
  year: number;
  hue: number;
  trackCount?: number;
}

export interface PlaylistSummary {
  id: number;
  name: string;
  createdAt: string;
  trackCount: number;
  covers: string[];
}

export interface HomeData {
  featured: Album;
  albums: Album[];
  quickPicks: Track[];
  recent: Track[];
}

export interface LibraryData {
  likedCount: number;
  likedCovers: string[];
  playlists: PlaylistSummary[];
  recent: Track[];
}
