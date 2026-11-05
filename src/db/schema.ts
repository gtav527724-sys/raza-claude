import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Google account holders. Anonymous visitors never get a row here. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleSub: text("google_sub").notNull().unique(),
  email: text("email").notNull().default(""),
  name: text("name").notNull().default(""),
  picture: text("picture").notNull().default(""),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  genre: text("genre").notNull(),
  coverUrl: text("cover_url").notNull(),
  year: integer("year").notNull(),
  hue: integer("hue").notNull().default(84),
});

export const tracks = pgTable(
  "tracks",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    albumTitle: text("album_title").notNull(),
    albumSlug: text("album_slug").notNull(),
    genre: text("genre").notNull(),
    durationSec: integer("duration_sec").notNull().default(360),
    audioUrl: text("audio_url").notNull(),
    coverUrl: text("cover_url").notNull(),
    albumId: integer("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    itunesId: bigint("itunes_id", { mode: "number" }).unique(),
    /** Provider identity, e.g. "itunes:123", "yt:VIDEOID", "audius:abc". */
    extKey: text("ext_key").unique(),
    source: text("source"),
    audiusId: text("audius_id"),
    youtubeId: text("youtube_id"),
    deezerId: bigint("deezer_id", { mode: "number" }),
    /** Resolved full-length direct stream (replaces 30s previews). */
    fullUrl: text("full_url"),
  },
  (t) => [index("tracks_album_idx").on(t.albumId)],
);

export const likedSongs = pgTable(
  "liked_songs",
  {
    id: serial("id").primaryKey(),
    owner: text("owner").notNull().default("public"),
    trackId: integer("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("liked_songs_owner_track_unique").on(t.owner, t.trackId)],
);

export const playlists = pgTable(
  "playlists",
  {
    id: serial("id").primaryKey(),
    owner: text("owner").notNull().default("public"),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("playlists_owner_idx").on(t.owner)],
);

export const playlistTracks = pgTable(
  "playlist_tracks",
  {
    id: serial("id").primaryKey(),
    playlistId: integer("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    trackId: integer("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("playlist_track_unique").on(t.playlistId, t.trackId),
    index("playlist_tracks_playlist_idx").on(t.playlistId),
  ],
);

export const recentPlays = pgTable(
  "recent_plays",
  {
    id: serial("id").primaryKey(),
    owner: text("owner").notNull().default("public"),
    trackId: integer("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    playedAt: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("recent_plays_time_idx").on(t.playedAt),
    index("recent_plays_owner_idx").on(t.owner),
  ],
);

export const recentSearches = pgTable(
  "recent_searches",
  {
    id: serial("id").primaryKey(),
    owner: text("owner").notNull().default("public"),
    query: text("query").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("recent_searches_owner_query_unique").on(t.owner, t.query)],
);
