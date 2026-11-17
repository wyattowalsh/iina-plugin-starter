import { beforeEach, describe, expect, it, vi } from "vitest";
import { installEntryMock, type EntryMock } from "./__mocks__/iina-entry";

const playerStatus = {
  title: "Test Video.mp4",
  position: 1,
  duration: 2,
  paused: false,
  speed: 1,
  volume: 100,
  enabled: true,
  customText: "",
};

describe("global entry", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function loadGlobal(): Promise<EntryMock> {
    const iina = installEntryMock();
    await import("./global");
    return iina;
  }

  function dashboardAction(iina: EntryMock): () => void {
    const index = iina.menu.item.mock.calls.findIndex(
      (args) => args[0] === "Show Plugin Dashboard",
    );
    const action = iina.menu.item.mock.calls[index]?.[1];
    if (typeof action !== "function") {
      throw new Error("Show Plugin Dashboard was not registered");
    }
    return action;
  }

  it("registers the dashboard menu item", async () => {
    const iina = await loadGlobal();
    const index = iina.menu.item.mock.calls.findIndex(
      (args) => args[0] === "Show Plugin Dashboard",
    );
    expect(index).toBeGreaterThanOrEqual(0);
    expect(iina.menu.item.mock.calls[index]?.[1]).toEqual(expect.any(Function));

    const item = iina.menu.item.mock.results[index]?.value;
    expect(item).toBeDefined();
    expect(iina.menu.addItem).toHaveBeenCalledWith(item);
  });

  it("opens the dashboard from the menu action", async () => {
    const iina = await loadGlobal();
    dashboardAction(iina)();

    expect(iina.standaloneWindow.open).toHaveBeenCalled();
    expect(iina.standaloneWindow.loadFile).toHaveBeenCalledWith("dist/ui/standalone/index.html");
    expect(iina.standaloneWindow.setFrame).toHaveBeenCalledWith(800, 500);
  });

  it("forwards player-status and pulls that player's status on request", async () => {
    const iina = await loadGlobal();
    const before = iina.standaloneWindow.onMessage.mock.calls.length;
    dashboardAction(iina)();

    const registered = iina.standaloneWindow.onMessage.mock.calls
      .slice(before)
      .find((args) => args[0] === "request-status");
    expect(registered).toBeDefined();

    iina.global.emit("player-status", playerStatus, "0");
    expect(iina.standaloneWindow.postMessage).toHaveBeenCalledWith("status-update", playerStatus);

    registered?.[1](undefined);
    expect(iina.global.postMessage).toHaveBeenCalledWith("0", "pull-status", {});
  });

  it("keeps the dashboard on the active player until that window is main", async () => {
    const iina = await loadGlobal();
    dashboardAction(iina)();
    const other = { ...playerStatus, title: "Other.mp4" };

    iina.global.emit("player-status", playerStatus, "0");
    iina.global.emit("player-status", other, "1");
    iina.global.emit("player-focus", { focused: false }, "0");

    const titles = iina.standaloneWindow.postMessage.mock.calls
      .filter((call) => call[0] === "status-update")
      .map((call) => (call[1] as { title: string }).title);
    expect(titles).toEqual(["Test Video.mp4"]);

    iina.global.emit("player-focus", { focused: true }, "1");
    expect(iina.standaloneWindow.postMessage).toHaveBeenLastCalledWith("status-update", other);
  });

  it("refreshes every open player after a dashboard preference write", async () => {
    const iina = await loadGlobal();
    dashboardAction(iina)();
    iina.global.emit("player-status", playerStatus, "0");
    iina.global.emit("player-status", { ...playerStatus, title: "Other.mp4" }, "1");

    const setPreference = iina.standaloneWindow.onMessage.mock.calls.find(
      (call) => call[0] === "set-preference",
    );
    expect(setPreference).toBeDefined();
    iina.global.postMessage.mockClear();
    setPreference?.[1]({ key: "example_enabled", value: false });

    expect(iina.global.postMessage).toHaveBeenCalledWith("0", "refresh-status", {});
    expect(iina.global.postMessage).toHaveBeenCalledWith("1", "refresh-status", {});
  });

  it("clears the dashboard when the last player closes", async () => {
    const iina = await loadGlobal();
    dashboardAction(iina)();
    iina.global.emit("player-status", playerStatus, "0");
    iina.global.emit("player-bye", {}, "0");

    expect(iina.standaloneWindow.postMessage).toHaveBeenCalledWith("status-clear", undefined);
  });
});
