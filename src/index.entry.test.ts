import { beforeEach, describe, expect, it, vi } from "vitest";
import { installEntryMock, type EntryMock } from "./__mocks__/iina-entry";

describe("player entry", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function loadPlayer(): Promise<EntryMock> {
    const iina = installEntryMock();
    await import("./index");
    return iina;
  }

  it("does not load webviews before the window is ready", async () => {
    const iina = await loadPlayer();
    expect(iina.overlay.loadFile).not.toHaveBeenCalled();
    expect(iina.sidebar.loadFile).not.toHaveBeenCalled();
  });

  it("loads overlay and sidebar pages on iina.window-loaded without showing the overlay", async () => {
    const iina = await loadPlayer();
    iina.event.emit("iina.window-loaded");

    expect(iina.overlay.loadFile).toHaveBeenCalledWith("dist/ui/overlay/index.html");
    expect(iina.sidebar.loadFile).toHaveBeenCalledWith("dist/ui/sidebar/index.html");
    expect(iina.overlay.show).not.toHaveBeenCalled();
  });

  it("reports mpv volume-max on the status snapshot", async () => {
    const iina = await loadPlayer();
    iina.mpv.getNumber.mockImplementation((prop: string) => {
      if (prop === "volume-max") return 130;
      if (prop === "speed") return 1;
      if (prop === "volume") return 40;
      return undefined;
    });
    iina.event.emit("iina.window-loaded");
    iina.sidebar.emit("request-status");

    expect(iina.overlay.postMessage).toHaveBeenCalledWith(
      "status-update",
      expect.objectContaining({ volume: 40, volumeMax: 130 }),
    );
  });

  it("rereads preferences when the player window becomes main", async () => {
    const iina = await loadPlayer();
    iina.event.emit("iina.window-loaded");
    iina.event.emit("iina.plugin-overlay-loaded");
    iina.preferences.map.set("example_enabled", false);
    iina.overlay.hide.mockClear();
    iina.overlay.postMessage.mockClear();

    iina.event.emit("iina.window-main.changed", true);

    expect(iina.overlay.hide).toHaveBeenCalled();
    expect(iina.overlay.postMessage).toHaveBeenCalledWith(
      "status-update",
      expect.objectContaining({ enabled: false }),
    );
  });

  it("hides the overlay when a refreshed preference disables it", async () => {
    const iina = await loadPlayer();
    iina.event.emit("iina.window-loaded");
    iina.event.emit("iina.plugin-overlay-loaded");
    iina.preferences.map.set("example_enabled", false);
    iina.overlay.hide.mockClear();

    iina.global.emit("refresh-status", {});

    expect(iina.overlay.hide).toHaveBeenCalled();
  });

  it("shows the overlay after iina.plugin-overlay-loaded", async () => {
    const iina = await loadPlayer();
    iina.event.emit("iina.window-loaded");
    iina.overlay.show.mockClear();
    iina.overlay.setOpacity.mockClear();

    iina.event.emit("iina.plugin-overlay-loaded");

    expect(iina.overlay.show).toHaveBeenCalled();
    expect(iina.overlay.setOpacity).toHaveBeenCalledWith(0.9);
  });

  it("seeks absolutely from the sidebar only", async () => {
    const iina = await loadPlayer();
    iina.event.emit("iina.window-loaded");
    iina.core.seek.mockClear();
    iina.core.seekTo.mockClear();

    iina.sidebar.emit("seek", { position: 12.5 });

    expect(iina.core.seekTo).toHaveBeenCalledTimes(1);
    expect(iina.core.seekTo).toHaveBeenCalledWith(12.5);
    expect(iina.core.seek).not.toHaveBeenCalled();

    iina.overlay.emit("seek", { position: 12.5 });
    expect(iina.core.seekTo).toHaveBeenCalledTimes(1);
  });

  it("pushes a status snapshot when the sidebar requests it", async () => {
    const iina = await loadPlayer();
    iina.event.emit("iina.window-loaded");
    iina.sidebar.emit("request-status");

    const status = expect.objectContaining({
      title: "Test Video.mp4",
      customText: "",
    });
    expect(iina.overlay.postMessage).toHaveBeenCalledWith("status-update", status);
    expect(iina.sidebar.postMessage).toHaveBeenCalledWith("status-update", status);
  });

  it("skips the file-loaded OSD when example_enabled is false", async () => {
    const iina = installEntryMock();
    iina.preferences.map.set("example_enabled", false);
    await import("./index");
    iina.event.emit("iina.window-loaded");
    iina.core.osd.mockClear();

    iina.event.emit("iina.file-loaded");

    expect(iina.core.osd).not.toHaveBeenCalled();
  });

  it("shows an OSD on file-loaded when example_enabled is true", async () => {
    const iina = await loadPlayer();
    iina.event.emit("iina.window-loaded");
    iina.core.osd.mockClear();

    iina.event.emit("iina.file-loaded");

    expect(iina.core.osd).toHaveBeenCalled();
  });

  it("copies example_text into the overlay status payload", async () => {
    const iina = installEntryMock();
    iina.preferences.map.set("example_text", "shown in overlay");
    await import("./index");
    iina.event.emit("iina.window-loaded");
    iina.sidebar.emit("request-status");

    expect(iina.overlay.postMessage).toHaveBeenCalledWith(
      "status-update",
      expect.objectContaining({ customText: "shown in overlay" }),
    );
  });

  it("posts a display playlist when the playlist count changes", async () => {
    const iina = installEntryMock();
    iina.playlist.list.mockReturnValue([
      {
        filename: "/vid/clip.mkv",
        title: null,
        isPlaying: false,
        isCurrent: true,
      },
    ]);
    iina.core.status.idle = false;
    await import("./index");
    iina.event.emit("iina.window-loaded");
    iina.event.emit("mpv.playlist-count.changed");

    const calls = [
      ...iina.overlay.postMessage.mock.calls,
      ...iina.sidebar.postMessage.mock.calls,
      ...iina.standaloneWindow.postMessage.mock.calls,
    ].filter((call) => call[0] === "playlist-update");

    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      const items = call[1] as Array<Record<string, unknown>>;
      expect(items).toEqual([expect.objectContaining({ title: "clip.mkv" })]);
      expect(items[0]).not.toHaveProperty("isCurrent");
    }
  });
});
