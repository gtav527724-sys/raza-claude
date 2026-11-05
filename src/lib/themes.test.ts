import { describe, expect, it } from "vitest";
import { getTheme, THEMES } from "./themes";

describe("themes", () => {
  it("contains unique, complete themes", () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(8);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    for (const theme of THEMES) {
      expect(theme.acc).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.bg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.preview).toContain("gradient");
    }
  });

  it("falls back safely for unknown ids", () => {
    expect(getTheme("missing").id).toBe(THEMES[0].id);
  });
});
