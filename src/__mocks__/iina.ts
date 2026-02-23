/**
 * Mock for the global `iina` object used in IINA plugin entry scripts.
 *
 * Usage in Vitest:
 *   import "./__mocks__/iina";
 *   // Now `globalThis.iina` is available with all stubs.
 *
 * For webview tests, see the `window.iina` mock at the bottom.
 */
import { vi } from "vitest";

// ─── Entry Script Mock (JavaScriptCore environment) ─────────────────────────

const preferences = new Map<string, unknown>([
  ["example_enabled", true],
  ["example_text", ""],
]);

const createWebviewMock = () => ({
  loadFile: vi.fn(),
  setOpacity: vi.fn(),
  postMessage: vi.fn(),
  onMessage: vi.fn(),
});

const iinaEntryMock = {
  core: {
    status: {
      title: "Test Video.mp4",
      position: 42.5,
      duration: 120.0,
      paused: false,
      url: "file:///test.mp4",
    },
    osd: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    seek: vi.fn(),
    seekTo: vi.fn(),
  },
  mpv: {
    getNumber: vi.fn((prop: string) => {
      if (prop === "speed") return 1;
      if (prop === "volume") return 100;
      return 0;
    }),
    getString: vi.fn(() => ""),
    getFlag: vi.fn(() => false),
    set: vi.fn(),
  },
  event: {
    on: vi.fn(),
    off: vi.fn(),
  },
  preferences: {
    get: vi.fn((key: string) => preferences.get(key)),
    set: vi.fn((key: string, value: unknown) => preferences.set(key, value)),
  },
  menu: {
    item: vi.fn((_title: string, _action: () => void) => ({ title: _title })),
    addItem: vi.fn(),
  },
  overlay: createWebviewMock(),
  sidebar: createWebviewMock(),
  standaloneWindow: {
    ...createWebviewMock(),
    open: vi.fn(),
    setFrame: vi.fn(),
  },
  global: {
    postMessage: vi.fn(),
    onMessage: vi.fn(),
  },
  console: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
};

// Install on globalThis for entry scripts
(globalThis as Record<string, unknown>).iina = iinaEntryMock;

// ─── Webview Mock (window.iina in WKWebView) ───────────────────────────────

const iinaWebviewMock = {
  postMessage: vi.fn(),
  onMessage: vi.fn(),
  preferences: {
    get: vi.fn((key: string, cb: (value: unknown) => void) => {
      cb(preferences.get(key));
    }),
    set: vi.fn((key: string, value: unknown) => {
      preferences.set(key, value);
    }),
  },
};

if (typeof window !== "undefined") {
  (window as Record<string, unknown>).iina = iinaWebviewMock;
}

export { iinaEntryMock, iinaWebviewMock };
