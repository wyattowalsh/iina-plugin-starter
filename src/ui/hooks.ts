/**
 * Reusable React hooks for IINA plugin webviews.
 *
 * These eliminate the boilerplate of subscribing to plugin messages
 * and requesting initial state in every App component.
 */

import { useEffect, useState } from "react";
import { onPluginMessage, sendToPlugin } from "./bridge";
import type { EntryToWebviewMessages } from "../types";
import type { PlayerStatus } from "../types";

/**
 * Subscribe to player status updates from the entry script.
 *
 * Automatically requests an initial snapshot on mount.
 *
 * @example
 * const status = usePluginStatus();
 * if (!status) return <Loading />;
 * return <div>{status.title}</div>;
 */
export function usePluginStatus(): PlayerStatus | null {
  const [status, setStatus] = useState<PlayerStatus | null>(null);

  useEffect(() => {
    // Note: iina.onMessage does not provide an unsubscribe mechanism.
    // Listener is registered once and persists for the webview's lifetime.
    onPluginMessage("status-update", setStatus);
    sendToPlugin("request-status");
  }, []);

  return status;
}

/**
 * Subscribe to any typed plugin message.
 *
 * @example
 * const playlist = usePluginMessage("playlist-update", []);
 */
export function usePluginMessage<K extends keyof EntryToWebviewMessages>(
  name: K,
  initialValue: EntryToWebviewMessages[K],
): EntryToWebviewMessages[K] {
  const [value, setValue] = useState<EntryToWebviewMessages[K]>(initialValue);

  useEffect(() => {
    onPluginMessage(name, setValue);
  }, [name]);

  return value;
}
