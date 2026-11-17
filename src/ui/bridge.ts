/**
 * Typed bridge for communication between React webviews and the IINA plugin entry script.
 *
 * In IINA webviews, `window.iina` provides:
 *   - postMessage(name, data) — send a message to the entry script
 *   - onMessage(name, handler) — receive messages from the entry script
 *
 * Preference reads and writes are messages (`get-preference` / `set-preference`).
 * Each message name gets one native `onMessage` subscription; handlers fan out from there.
 */

import type { EntryToWebviewMessages, PreferenceUpdate, WebviewToEntryMessages } from "../types";
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
    };
  }
}

// ─── Typed Messaging ────────────────────────────────────────────────────────

type MessageHandler = (data: unknown) => void;

const handlersByName = new Map<string, Set<MessageHandler>>();

function dispatchMessage(name: string, data: unknown): void {
  const handlers = handlersByName.get(name);
  if (!handlers) return;
  const snapshot: MessageHandler[] = [];
  handlers.forEach((handler) => {
    snapshot.push(handler);
  });
  for (const handler of snapshot) {
    handler(data);
  }
}

/** Install at most one native listener per message name. */
function ensureNativeListener(name: string): Set<MessageHandler> {
  const existing = handlersByName.get(name);
  if (existing) return existing;

  const handlers = new Set<MessageHandler>();
  handlersByName.set(name, handlers);
  try {
    getIina().onMessage(name, (data) => {
      dispatchMessage(name, data);
    });
  } catch (error) {
    handlersByName.delete(name);
    throw error;
  }
  return handlers;
}

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
 * Each call adds `handler` to that message's fan-out set. Passing the same
 * function again does not stack a duplicate. IINA does not provide an
 * unsubscribe API; the native listener stays for the webview lifetime.
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
  ensureNativeListener(name as string).add(handler as MessageHandler);
}

// ─── Preferences ────────────────────────────────────────────────────────────

/** Default timeout for preference reads (ms). */
const PREF_TIMEOUT_MS = 3000;

interface PendingPreference {
  promise: Promise<unknown>;
  resolve: (value: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pendingPreferences = new Map<string, PendingPreference>();

function handlePreferenceValue(message: EntryToWebviewMessages["preference-value"]): void {
  const pending = pendingPreferences.get(message.key);
  if (!pending) return;
  clearTimeout(pending.timer);
  pendingPreferences.delete(message.key);
  pending.resolve(message.value);
}

let preferenceListenerInstalled = false;

function ensurePreferenceListener(): void {
  if (preferenceListenerInstalled) return;
  onPluginMessage("preference-value", handlePreferenceValue);
  preferenceListenerInstalled = true;
}

/**
 * Read a plugin preference by asking the entry script.
 *
 * Resolves when `preference-value` arrives for `key`. Concurrent calls for the
 * same key share one in-flight promise. Rejects if that reply never arrives.
 */
export function getPreference<K extends PrefKey>(
  key: K,
  timeoutMs: number = PREF_TIMEOUT_MS,
): Promise<PrefType<K>> {
  const existing = pendingPreferences.get(key);
  if (existing) return existing.promise as Promise<PrefType<K>>;

  ensurePreferenceListener();

  let resolvePromise!: (value: unknown) => void;
  let rejectPromise!: (error: Error) => void;
  const promise = new Promise<unknown>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const timer = setTimeout(() => {
    if (pendingPreferences.get(key)?.promise !== promise) return;
    pendingPreferences.delete(key);
    rejectPromise(new Error(`getPreference("${key}") timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  pendingPreferences.set(key, { promise, resolve: resolvePromise, timer });
  sendToPlugin("get-preference", { key });
  return promise as Promise<PrefType<K>>;
}

/** Ask the entry script to store a plugin preference. */
export function setPreference<K extends PrefKey>(key: K, value: PrefType<K>): void {
  // PrefType<K> matches PreferenceUpdate, but the two parameters don't narrow together.
  sendToPlugin("set-preference", { key, value } as PreferenceUpdate);
}
