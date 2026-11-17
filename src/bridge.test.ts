import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

type MessageFn = (...args: unknown[]) => unknown;

function messageMock(fn: unknown): Mock<MessageFn> {
  return fn as Mock<MessageFn>;
}

async function loadBridge() {
  return import("./ui/bridge");
}

function captureHandlers(): Map<string, Array<(data: unknown) => void>> {
  const handlers = new Map<string, Array<(data: unknown) => void>>();
  messageMock(window.iina.onMessage).mockImplementation((name: unknown, handler: unknown) => {
    if (typeof name !== "string" || typeof handler !== "function") return;
    const list = handlers.get(name) ?? [];
    list.push(handler as (data: unknown) => void);
    handlers.set(name, list);
  });
  return handlers;
}

function readPreferenceKey(data: unknown): string {
  if (typeof data === "string") return data;
  if (data !== null && typeof data === "object" && "key" in data) {
    const key = (data as { key: unknown }).key;
    if (typeof key === "string") return key;
  }
  return "example_enabled";
}

describe("bridge", () => {
  beforeEach(() => {
    vi.resetModules();
    messageMock(window.iina.postMessage).mockReset();
    messageMock(window.iina.onMessage).mockReset();
  });

  describe("sendToPlugin", () => {
    it("calls window.iina.postMessage with name and data", async () => {
      const { sendToPlugin } = await loadBridge();
      sendToPlugin("seek", { position: 30 });
      expect(window.iina.postMessage).toHaveBeenCalledWith("seek", { position: 30 });
    });

    it("calls postMessage with no data for void messages", async () => {
      const { sendToPlugin } = await loadBridge();
      sendToPlugin("request-status");
      expect(window.iina.postMessage).toHaveBeenCalledWith("request-status", undefined);
    });

    it("throws when window.iina is missing", async () => {
      const { sendToPlugin } = await loadBridge();
      const saved = window.iina;
      Reflect.deleteProperty(window, "iina");
      try {
        expect(() => sendToPlugin("request-status")).toThrow(/window\.iina is not available/);
      } finally {
        window.iina = saved;
      }
    });
  });

  it("exposes only postMessage and onMessage", () => {
    expect(Object.keys(window.iina).sort()).toEqual(["onMessage", "postMessage"]);
  });

  describe("onPluginMessage", () => {
    it("registers handler via window.iina.onMessage", async () => {
      const { onPluginMessage } = await loadBridge();
      const handler = vi.fn();
      onPluginMessage("status-update", handler);
      expect(window.iina.onMessage).toHaveBeenCalledWith("status-update", expect.any(Function));

      const native = messageMock(window.iina.onMessage).mock.calls.find(
        (call) => call[0] === "status-update",
      )?.[1];
      expect(typeof native).toBe("function");
      (native as (data: unknown) => void)({ title: "Test Video.mp4" });
      expect(handler).toHaveBeenCalledWith({ title: "Test Video.mp4" });
    });

    it("drops a handler after its unsubscribe runs", async () => {
      const { onPluginMessage } = await loadBridge();
      const handler = vi.fn();
      const stop = onPluginMessage("status-update", handler);
      const native = messageMock(window.iina.onMessage).mock.calls.find(
        (call) => call[0] === "status-update",
      )?.[1];
      stop();
      (native as (data: unknown) => void)({ title: "Gone" });
      expect(handler).not.toHaveBeenCalled();
      expect(window.iina.onMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("getPreference", () => {
    it("resolves with the preference value", async () => {
      const { getPreference } = await loadBridge();
      const handlers = captureHandlers();
      messageMock(window.iina.postMessage).mockImplementation((name: unknown, data: unknown) => {
        if (name !== "get-preference") return;
        const key = readPreferenceKey(data);
        setTimeout(() => {
          for (const handler of handlers.get("preference-value") ?? []) {
            handler({ key, value: true });
          }
        }, 0);
      });

      await expect(getPreference("example_enabled")).resolves.toBe(true);
      expect(window.iina.postMessage).toHaveBeenCalledWith(
        "get-preference",
        expect.objectContaining({ key: "example_enabled" }),
      );
    });

    it("rejects on timeout", async () => {
      const { getPreference } = await loadBridge();
      captureHandlers();
      await expect(getPreference("example_enabled", 30)).rejects.toThrow(/timed out/);
    });
  });

  describe("setPreference", () => {
    it("posts set-preference", async () => {
      const { setPreference } = await loadBridge();
      setPreference("example_text", "hello");
      expect(window.iina.postMessage).toHaveBeenCalledWith("set-preference", {
        key: "example_text",
        value: "hello",
      });
    });
  });
});
