import { describe, expect, it } from "vitest";
import { playlistSchema, rateLimit, sanitizeText, searchSchema, trustedMutation } from "./security";

describe("input validation", () => {
  it("accepts bounded user input", () => {
    expect(playlistSchema.parse({ name: "Road Trip" }).name).toBe("Road Trip");
    expect(searchSchema.parse({ query: "jazz" }).query).toBe("jazz");
  });

  it("rejects empty and oversized values", () => {
    expect(() => playlistSchema.parse({ name: "" })).toThrow();
    expect(() => searchSchema.parse({ query: "x".repeat(161) })).toThrow();
  });

  it("sanitizes markup and controls", () => {
    expect(sanitizeText(" <script>hello</script> ")).toBe("hello");
  });
});

describe("request protection", () => {
  it("accepts app header and blocks foreign origins", () => {
    const trusted = new Request("https://app.test/api", {
      method: "POST",
      headers: { "x-sonara-client": "app" },
    });
    expect(trustedMutation(trusted)).toBeNull();

    const foreign = new Request("https://app.test/api", {
      method: "POST",
      headers: { origin: "https://evil.test", host: "app.test" },
    });
    expect(trustedMutation(foreign)?.status).toBe(403);
  });

  it("rate limits abusive clients", () => {
    const req = new Request("https://app.test/api", { headers: { "x-real-ip": "test-ip-unique" } });
    // limiter allows baseMax * 5 requests per window (shared proxy IPs)
    for (let i = 0; i < 5; i++) expect(rateLimit(req, "test", 1, 1000)).toBeNull();
    expect(rateLimit(req, "test", 1, 1000)?.status).toBe(429);
  });
});
