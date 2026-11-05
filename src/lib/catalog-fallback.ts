import type { Album, HomeData, Track } from "./types";

/** Client fallback: Home never stays on skeletons if DB/server is cold. */
const S = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-";

const defs = [
  [
    "neon-horizons",
    "Neon Horizons",
    "Vega Stereo",
    "Synthwave",
    "/covers/neon-horizons.jpg",
    2025,
    300,
    ["Midnight Drive", "Chrome Sunset", "Laser Rain"],
  ],
  [
    "solar-bloom",
    "Solar Bloom",
    "Hazel Moon",
    "Indie",
    "/covers/solar-bloom.jpg",
    2024,
    34,
    ["Golden Hour", "Wildflower"],
  ],
  [
    "deep-currents",
    "Deep Currents",
    "Meridian",
    "Ambient",
    "/covers/deep-currents.jpg",
    2025,
    205,
    ["Tide", "Blue Abyss", "Drift"],
  ],
  [
    "concrete-poetry",
    "Concrete Poetry",
    "Kasey J",
    "Lo-Fi",
    "/covers/concrete-poetry.jpg",
    2023,
    180,
    ["Sidewalks", "Night Bus"],
  ],
  [
    "solaris",
    "Solaris",
    "NOVA KIN",
    "Electronic",
    "/covers/solaris.jpg",
    2026,
    40,
    ["Orbit", "Flare", "Zenith"],
  ],
  [
    "wildfire",
    "Wildfire",
    "Ember State",
    "Rock",
    "/covers/wildfire.jpg",
    2024,
    16,
    ["Embers", "Gasoline"],
  ],
  [
    "paper-moon",
    "Paper Moon",
    "Velvet Quartet",
    "Jazz",
    "/covers/paper-moon.jpg",
    2023,
    225,
    ["Blue Note Alley"],
  ],
] as const;

let songNo = 1;
let trackId = 1;
export const fallbackAlbums: Album[] = [];
export const fallbackTracks: Track[] = [];

for (let i = 0; i < defs.length; i++) {
  const [slug, title, artist, genre, coverUrl, year, hue, songs] = defs[i];
  fallbackAlbums.push({
    id: i + 1,
    slug,
    title,
    artist,
    genre,
    coverUrl,
    year,
    hue,
    trackCount: songs.length,
  });
  for (const song of songs) {
    fallbackTracks.push({
      id: trackId++,
      title: song,
      artist,
      albumTitle: title,
      albumSlug: slug,
      genre,
      durationSec: 360,
      audioUrl: `${S}${songNo++}.mp3`,
      coverUrl,
      source: "local",
    });
  }
}

export function fallbackHome(): HomeData {
  return {
    featured: fallbackAlbums[0],
    albums: fallbackAlbums,
    quickPicks: fallbackTracks.slice(0, 8),
    recent: [],
  };
}
