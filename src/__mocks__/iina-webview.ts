/**
 * Webview mock. window.iina exposes postMessage and onMessage only.
 */
import { vi } from "vitest";

const iina = {
  postMessage: vi.fn(),
  onMessage: vi.fn(),
};

(window as unknown as { iina: typeof iina }).iina = iina;

export { iina };
