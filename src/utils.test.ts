import { describe, it, expect } from "vitest";
import { formatTime, debounce } from "./ui/utils";

describe("formatTime", () => {
  it("formats seconds as M:SS", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(599)).toBe("9:59");
  });

  it("formats hours as H:MM:SS", () => {
    expect(formatTime(3600)).toBe("1:00:00");
    expect(formatTime(3661)).toBe("1:01:01");
    expect(formatTime(7265)).toBe("2:01:05");
  });

  it("handles fractional seconds by flooring", () => {
    expect(formatTime(1.9)).toBe("0:01");
    expect(formatTime(60.5)).toBe("1:00");
  });

  it("clamps negative and non-finite values to 0:00", () => {
    expect(formatTime(-1)).toBe("0:00");
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(Infinity)).toBe("0:00");
  });
});

describe("debounce", () => {
  it("delays execution", async () => {
    let count = 0;
    const fn = debounce(() => count++, 50);

    fn();
    fn();
    fn();

    expect(count).toBe(0);
    await new Promise((r) => setTimeout(r, 100));
    expect(count).toBe(1);
  });
});
