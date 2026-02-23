/**
 * Typed bridge for communication between React webviews and the IINA plugin entry script.
 *
 * In IINA webviews, `window.iina` provides:
 *   - postMessage(name, data) — send a message to the entry script
 *   - onMessage(name, handler) — receive messages from the entry script
 *   - preferences.get(key, callback) / preferences.set(key, value)
 *
 * This module wraps those with type-safe helpers and error guards.
 */

import type { EntryToWebviewMessages, WebviewToEntryMessages } from "../types";
import type { PrefKey, PrefType } from "../preferences";

// ─── Runtime Guard ──────────────────────────────────────────────────────────

function getIina() {
  if (typeof window === "undefined" || !window.iina) {
    throw new Error(
      "window.iina is not available. " +
        "This code must run inside an IINA webview, not a regular browser.",
    );
  }
  return window.iina;
}

// ─── Window Augmentation ────────────────────────────────────────────────────

declare global {
  interface Window {
    iina: {
      postMessage(name: string, data?: unknown): void;
      onMessage(name: string, handler: (data: unknown) => void): void;
      preferences: {
        get(key: string, callback: (value: unknown) => void): void;
        set(key: string, value: unknown): void;
      };
    };
  }
}

// ─── Typed Messaging ────────────────────────────────────────────────────────

/**
 * Send a typed message to the plugin entry script.
 *
 * @example
 * sendToPlugin("request-status");
 * sendToPlugin("seek", { position: 30 });
 */
export function sendToPlugin<K extends keyof WebviewToEntryMessages>(
  name: K,
  ...args: WebviewToEntryMessages[K] extends undefined ? [] : [WebviewToEntryMessages[K]]
): void {
  getIina().postMessage(name as string, args[0]);
}

/**
 * Listen for typed messages from the plugin entry script.
 *
 * @example
 * onPluginMessage("status-update", (status) => {
 *   console.log(status.title); // fully typed!
 * });
 */
export function onPluginMessage<K extends keyof EntryToWebviewMessages>(
  name: K,
  handler: (data: EntryToWebviewMessages[K]) => void,
): void {
  getIina().onMessage(name as string, handler as (data: unknown) => void);
}

// ─── Preferences ────────────────────────────────────────────────────────────

/** Default timeout for preference reads (ms). */
const PREF_TIMEOUT_MS = 3000;

/**
 * Get a plugin preference value asynchronously.
 *
 * Rejects after `timeoutMs` if the callback is never called (safety net).
 */
export function getPreference<K extends PrefKey>(
  key: K,
  timeoutMs: number = PREF_TIMEOUT_MS,
): Promise<PrefType<K>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`getPreference("${key}") timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
    getIina().preferences.get(key, (value) => {
      clearTimeout(timer);
      resolve(value as PrefType<K>);
    });
  });
}

/** Set a plugin preference value. */
export function setPreference<K extends PrefKey>(key: K, value: PrefType<K>): void {
  getIina().preferences.set(key, value);
}
