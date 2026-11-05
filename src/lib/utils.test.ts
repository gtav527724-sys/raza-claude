import { describe, expect, it } from "vitest";
import { cn, formatTime } from "./utils";

describe("formatTime", () => {
  it("formats minutes and seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(3605)).toBe("60:05");
  });

  it("guards invalid values", () => {
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(-5)).toBe("0:00");
  });
});

describe("cn", () => {
  it("joins conditional classes", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});
