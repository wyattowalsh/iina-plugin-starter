import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendToPlugin, onPluginMessage, getPreference, setPreference } from "./ui/bridge";

describe("bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendToPlugin", () => {
    it("calls window.iina.postMessage with name and data", () => {
      sendToPlugin("seek", { position: 30 });
      expect(window.iina.postMessage).toHaveBeenCalledWith("seek", { position: 30 });
    });

    it("calls postMessage with no data for void messages", () => {
      sendToPlugin("request-status");
      expect(window.iina.postMessage).toHaveBeenCalledWith("request-status", undefined);
    });
  });

  describe("onPluginMessage", () => {
    it("registers handler via window.iina.onMessage", () => {
      const handler = vi.fn();
      onPluginMessage("status-update", handler);
      expect(window.iina.onMessage).toHaveBeenCalledWith("status-update", handler);
    });
  });

  describe("getPreference", () => {
    it("resolves with the preference value", async () => {
      const value = await getPreference("example_enabled");
      expect(value).toBe(true);
    });

    it("rejects on timeout", async () => {
      // Override the mock to never call the callback
      window.iina.preferences.get = vi.fn();

      await expect(getPreference("example_enabled", 50)).rejects.toThrow("timed out");
    });
  });

  describe("setPreference", () => {
    it("calls window.iina.preferences.set", () => {
      setPreference("example_text", "hello");
      expect(window.iina.preferences.set).toHaveBeenCalledWith("example_text", "hello");
    });
  });
});
