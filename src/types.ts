/**
 * Shared types used by both entry scripts and React webview UIs.
 *
 * Import from "../types" in entry scripts and from "../../types" in UI code,
 * or adjust paths based on your file location.
 */

import type { PrefKey, PrefMap } from "./preferences";

/** Player status snapshot sent from entry script to webviews. */
export interface PlayerStatus {
  title: string;
  position: number;
  duration: number;
  paused: boolean;
  speed: number;
  volume: number;
  /** mpv `volume-max`. The sidebar slider stops here. */
  volumeMax: number;
  enabled: boolean;
  customText: string;
}

/** Playlist item as exposed to webviews. */
export interface PlaylistItem {
  filename: string;
  title: string;
  isPlaying: boolean;
}

/** A preference key paired with the value type stored for that key. */
export type PreferenceUpdate = {
  [K in keyof PrefMap]: { key: K; value: PrefMap[K] };
}[keyof PrefMap];

/**
 * Message types for type-safe bridge communication.
 *
 * Entry → Webview messages:
 */
export interface EntryToWebviewMessages {
  "status-update": PlayerStatus;
  "status-clear": undefined;
  "playlist-update": PlaylistItem[];
  "preference-value": PreferenceUpdate;
  "preference-changed": PreferenceUpdate;
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
  "play-playlist-item": { index: number };
  "get-preference": { key: PrefKey };
  "set-preference": PreferenceUpdate;
}
