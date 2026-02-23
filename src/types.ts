/**
 * Shared types used by both entry scripts and React webview UIs.
 *
 * Import from "../types" in entry scripts and from "../../types" in UI code,
 * or adjust paths based on your file location.
 */

/** Player status snapshot sent from entry script to webviews. */
export interface PlayerStatus {
  title: string;
  position: number;
  duration: number;
  paused: boolean;
  speed: number;
  volume: number;
}

/** Playlist item as exposed by IINA. */
export interface PlaylistItem {
  filename: string;
  title: string;
  isPlaying: boolean;
}

/**
 * Message types for type-safe bridge communication.
 *
 * Entry → Webview messages:
 */
export interface EntryToWebviewMessages {
  "status-update": PlayerStatus;
  "playlist-update": PlaylistItem[];
  "preference-changed": { key: string; value: unknown };
}

/**
 * Webview → Entry messages:
 */
export interface WebviewToEntryMessages {
  "request-status": undefined;
  "toggle-pause": undefined;
  seek: { position: number };
  "set-volume": { volume: number };
  "set-speed": { speed: number };
}
