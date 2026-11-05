import { describe, expect, it } from "vitest";
import { isPreview, playKind, trackKey } from "./playable";
import type { Track } from "./types";

const base: Track = {
  id: -1,
  title: "Song",
  artist: "Artist",
  albumTitle: "Album",
  albumSlug: "",
  genre: "Pop",
  durationSec: 200,
  audioUrl: "https://audio-ssl.itunes.apple.com/a.m4a",
  coverUrl: "/x.png",
};

describe("playable", () => {
  it("never plays an Apple preview directly", () => {
    const t = { ...base, source: "itunes", itunesId: 5 };
    expect(isPreview(t)).toBe(true);
    expect(playKind(t)).toBe("resolve");
  });
  it("prefers a resolved full stream, then YouTube", () => {
    expect(playKind({ ...base, source: "itunes", itunesId: 5, fullUrl: "https://x/y.mp3" })).toBe(
      "audio",
    );
    expect(playKind({ ...base, source: "itunes", itunesId: 5, youtubeId: "abcdefghijk" })).toBe(
      "yt",
    );
  });
  it("builds stable keys across providers", () => {
    expect(trackKey({ ...base, source: "itunes", itunesId: 5, youtubeId: "abc" })).toBe("itunes:5");
    expect(trackKey({ ...base, source: "youtube", youtubeId: "abc" })).toBe("yt:abc");
    expect(trackKey({ ...base, id: 9, audioUrl: "https://soundhelix.com/a.mp3" })).toBe("local:9");
  });
});
