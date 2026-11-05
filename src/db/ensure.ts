import { getPool } from "./index";

/**
 * Idempotent schema bootstrap. Runs once per server start (see
 * instrumentation.ts) so a fresh Neon / Vercel / Railway database works
 * immediately — no manual `drizzle-kit push` needed after deploying.
 * Mirrors src/db/schema.ts exactly.
 */
const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  google_sub text NOT NULL UNIQUE,
  email text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  picture text NOT NULL DEFAULT '',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS albums (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  artist text NOT NULL,
  genre text NOT NULL,
  cover_url text NOT NULL,
  year integer NOT NULL,
  hue integer NOT NULL DEFAULT 84
);

CREATE TABLE IF NOT EXISTS tracks (
  id serial PRIMARY KEY,
  title text NOT NULL,
  artist text NOT NULL,
  album_title text NOT NULL,
  album_slug text NOT NULL,
  genre text NOT NULL,
  duration_sec integer NOT NULL DEFAULT 360,
  audio_url text NOT NULL,
  cover_url text NOT NULL,
  album_id integer NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  itunes_id bigint UNIQUE
);
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS ext_key text;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS audius_id text;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS youtube_id text;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS deezer_id bigint;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS full_url text;
CREATE UNIQUE INDEX IF NOT EXISTS tracks_ext_key_unique ON tracks(ext_key);
CREATE INDEX IF NOT EXISTS tracks_album_idx ON tracks(album_id);

CREATE TABLE IF NOT EXISTS liked_songs (
  id serial PRIMARY KEY,
  owner text NOT NULL DEFAULT 'public',
  track_id integer NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE liked_songs ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT 'public';
DROP INDEX IF EXISTS liked_songs_track_unique;
CREATE UNIQUE INDEX IF NOT EXISTS liked_songs_owner_track_unique ON liked_songs(owner, track_id);

CREATE TABLE IF NOT EXISTS playlists (
  id serial PRIMARY KEY,
  owner text NOT NULL DEFAULT 'public',
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT 'public';
CREATE INDEX IF NOT EXISTS playlists_owner_idx ON playlists(owner);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  id serial PRIMARY KEY,
  playlist_id integer NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id integer NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS playlist_track_unique ON playlist_tracks(playlist_id, track_id);
CREATE INDEX IF NOT EXISTS playlist_tracks_playlist_idx ON playlist_tracks(playlist_id);

CREATE TABLE IF NOT EXISTS recent_plays (
  id serial PRIMARY KEY,
  owner text NOT NULL DEFAULT 'public',
  track_id integer NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  played_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE recent_plays ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT 'public';
CREATE INDEX IF NOT EXISTS recent_plays_time_idx ON recent_plays(played_at);
CREATE INDEX IF NOT EXISTS recent_plays_owner_idx ON recent_plays(owner);

CREATE TABLE IF NOT EXISTS recent_searches (
  id serial PRIMARY KEY,
  owner text NOT NULL DEFAULT 'public',
  query text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE recent_searches ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT 'public';
DROP INDEX IF EXISTS recent_searches_query_unique;
CREATE UNIQUE INDEX IF NOT EXISTS recent_searches_owner_query_unique ON recent_searches(owner, query);
`;

const g = globalThis as typeof globalThis & { __sonaraEnsure?: Promise<void> };

export function ensureSchema(): Promise<void> {
  if (!g.__sonaraEnsure) {
    g.__sonaraEnsure = run().catch((err) => {
      g.__sonaraEnsure = undefined; // retry on next call
      console.error("[sonara] schema bootstrap failed:", err instanceof Error ? err.message : err);
    });
  }
  return g.__sonaraEnsure;
}

async function run() {
  if (!process.env.DATABASE_URL) return;
  const client = await getPool().connect();
  try {
    // Serialise concurrent serverless cold starts.
    await client.query("SELECT pg_advisory_lock(727201)");
    try {
      await client.query(DDL);
    } finally {
      await client.query("SELECT pg_advisory_unlock(727201)");
    }
  } finally {
    client.release();
  }
  // Demo catalog (only when the database is empty).
  const { rows } = await getPool().query("SELECT count(*)::int AS n FROM albums");
  if ((rows[0]?.n ?? 0) === 0) {
    const { seedCatalog } = await import("./seed-catalog");
    await seedCatalog();
  }
}
