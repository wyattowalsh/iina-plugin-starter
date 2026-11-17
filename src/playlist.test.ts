import { describe, expect, it } from "vitest";
import { displayTitle, toDisplayItems } from "./playlist";

const clip = {
  filename: "/vid/clip.mkv",
  title: null as string | null,
  isPlaying: false,
  isCurrent: true,
};

const remote = {
  filename: "https://example.com/vid/clip.mkv",
  title: null as string | null,
  isPlaying: false,
  isCurrent: false,
};

const emptyTitle = {
  filename: "/shows/episode.mkv",
  title: "" as string | null,
  isPlaying: true,
  isCurrent: false,
};

const emptyFile = {
  filename: "",
  title: null as string | null,
  isPlaying: false,
  isCurrent: false,
};

const named = {
  filename: "https://example.com/vid/clip.mkv",
  title: "Kept Title" as string | null,
  isPlaying: false,
  isCurrent: false,
};

describe("displayTitle", () => {
  it("uses the file basename when the title is null", () => {
    expect(displayTitle(clip.filename, clip.title)).toBe("clip.mkv");
  });

  it("keeps an https URL whole", () => {
    expect(displayTitle(remote.filename, remote.title)).toBe("https://example.com/vid/clip.mkv");
  });

  it("uses the basename when the title is empty", () => {
    expect(displayTitle(emptyTitle.filename, emptyTitle.title)).toBe("episode.mkv");
  });

  it("returns Untitled when the filename is empty", () => {
    expect(displayTitle(emptyFile.filename, emptyFile.title)).toBe("Untitled");
  });

  it("keeps a non-empty title", () => {
    expect(displayTitle(named.filename, named.title)).toBe("Kept Title");
  });
});

describe("toDisplayItems", () => {
  it("applies the same title rules", () => {
    expect(
      toDisplayItems([clip, remote, emptyTitle, emptyFile, named]).map((item) => item.title),
    ).toEqual([
      "clip.mkv",
      "https://example.com/vid/clip.mkv",
      "episode.mkv",
      "Untitled",
      "Kept Title",
    ]);
  });
});
