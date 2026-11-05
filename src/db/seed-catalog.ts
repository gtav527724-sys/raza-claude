import { eq } from "drizzle-orm";
import { db } from "./index";
import { albums, tracks } from "./schema";

const S = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-";

const catalog: Array<{
  slug: string;
  title: string;
  artist: string;
  genre: string;
  coverUrl: string;
  year: number;
  hue: number;
  songs: Array<{ title: string; n: number; durationSec: number }>;
}> = [
  {
    slug: "neon-horizons",
    title: "Neon Horizons",
    artist: "Vega Stereo",
    genre: "Synthwave",
    coverUrl: "/covers/neon-horizons.jpg",
    year: 2025,
    hue: 300,
    songs: [
      { title: "Midnight Drive", n: 1, durationSec: 372 },
      { title: "Chrome Sunset", n: 2, durationSec: 425 },
      { title: "Laser Rain", n: 3, durationSec: 344 },
    ],
  },
  {
    slug: "solar-bloom",
    title: "Solar Bloom",
    artist: "Hazel Moon",
    genre: "Indie",
    coverUrl: "/covers/solar-bloom.jpg",
    year: 2024,
    hue: 34,
    songs: [
      { title: "Golden Hour", n: 4, durationSec: 383 },
      { title: "Wildflower", n: 5, durationSec: 352 },
    ],
  },
  {
    slug: "deep-currents",
    title: "Deep Currents",
    artist: "Meridian",
    genre: "Ambient",
    coverUrl: "/covers/deep-currents.jpg",
    year: 2025,
    hue: 205,
    songs: [
      { title: "Tide", n: 6, durationSec: 387 },
      { title: "Blue Abyss", n: 7, durationSec: 401 },
      { title: "Drift", n: 8, durationSec: 355 },
    ],
  },
  {
    slug: "concrete-poetry",
    title: "Concrete Poetry",
    artist: "Kasey J",
    genre: "Lo-Fi",
    coverUrl: "/covers/concrete-poetry.jpg",
    year: 2023,
    hue: 180,
    songs: [
      { title: "Sidewalks", n: 9, durationSec: 398 },
      { title: "Night Bus", n: 10, durationSec: 344 },
    ],
  },
  {
    slug: "solaris",
    title: "Solaris",
    artist: "NOVA KIN",
    genre: "Electronic",
    coverUrl: "/covers/solaris.jpg",
    year: 2026,
    hue: 40,
    songs: [
      { title: "Orbit", n: 11, durationSec: 376 },
      { title: "Flare", n: 12, durationSec: 358 },
      { title: "Zenith", n: 13, durationSec: 380 },
    ],
  },
  {
    slug: "wildfire",
    title: "Wildfire",
    artist: "Ember State",
    genre: "Rock",
    coverUrl: "/covers/wildfire.jpg",
    year: 2024,
    hue: 16,
    songs: [
      { title: "Embers", n: 14, durationSec: 355 },
      { title: "Gasoline", n: 15, durationSec: 367 },
    ],
  },
  {
    slug: "paper-moon",
    title: "Paper Moon",
    artist: "Velvet Quartet",
    genre: "Jazz",
    coverUrl: "/covers/paper-moon.jpg",
    year: 2023,
    hue: 225,
    songs: [{ title: "Blue Note Alley", n: 16, durationSec: 341 }],
  },
];

export async function seedCatalog() {
  console.log("Seeding catalog…");
  for (const album of catalog) {
    const [inserted] = await db
      .insert(albums)
      .values({
        slug: album.slug,
        title: album.title,
        artist: album.artist,
        genre: album.genre,
        coverUrl: album.coverUrl,
        year: album.year,
        hue: album.hue,
      })
      .onConflictDoNothing({ target: albums.slug })
      .returning();

    const existing = await db
      .select({ id: albums.id })
      .from(albums)
      .where(eq(albums.slug, album.slug))
      .limit(1);

    const albumId = inserted?.id ?? existing[0]!.id;

    for (const song of album.songs) {
      await db
        .insert(tracks)
        .values({
          title: song.title,
          artist: album.artist,
          albumTitle: album.title,
          albumSlug: album.slug,
          genre: album.genre,
          durationSec: song.durationSec,
          audioUrl: `${S}${song.n}.mp3`,
          coverUrl: album.coverUrl,
          albumId,
        })
        .onConflictDoNothing();
    }
  }
}
