/**
 * Main entry script — instantiated once per IINA player window.
 *
 * Runs in JavaScriptCore (no DOM). Accesses IINA APIs via the global `iina` object.
 * Communicates with React webviews via postMessage/onMessage.
 */

import type { PlayerStatus, WebviewToEntryMessages } from "./types";

const { core, mpv, event, overlay, sidebar, standaloneWindow, preferences, console: log } = iina;

// ─── Overlay ────────────────────────────────────────────────────────────────

overlay.loadFile("dist/ui/overlay/index.html");
overlay.setOpacity(0.9);

// ─── Sidebar ────────────────────────────────────────────────────────────────

sidebar.loadFile("dist/ui/sidebar/index.html");

// ─── Status Broadcasting ────────────────────────────────────────────────────

function getStatus(): PlayerStatus {
  return {
    title: core.status.title ?? "No file loaded",
    position: core.status.position ?? 0,
    duration: core.status.duration ?? 0,
    paused: core.status.paused ?? true,
    speed: mpv.getNumber("speed") ?? 1,
    volume: mpv.getNumber("volume") ?? 100,
  };
}

/** Push current status to all webviews (overlay, sidebar, standalone). */
function broadcastStatus(): void {
  const status = getStatus();
  overlay.postMessage("status-update", status);
  sidebar.postMessage("status-update", status);
  standaloneWindow.postMessage("status-update", status);
}

// ─── Webview → Entry Messages ───────────────────────────────────────────────

type MsgHandler<K extends keyof WebviewToEntryMessages> =
  WebviewToEntryMessages[K] extends undefined
    ? () => void
    : (data: WebviewToEntryMessages[K]) => void;

/** All webviews that can send messages to the entry script. */
const allWebviews = [overlay, sidebar, standaloneWindow];

/**
 * Register a typed message handler on ALL webviews simultaneously.
 * Eliminates the need for 3 separate registrations per message.
 */
function handleAllWebviews<K extends keyof WebviewToEntryMessages>(name: K, fn: MsgHandler<K>) {
  for (const wv of allWebviews) {
    wv.onMessage(name as string, fn as (data: unknown) => void);
  }
}

/**
 * Register a typed message handler on a single webview.
 * Use when a message should only be handled from one specific source.
 */
function handleWebview<K extends keyof WebviewToEntryMessages>(
  wv: (typeof allWebviews)[number],
  name: K,
  fn: MsgHandler<K>,
) {
  wv.onMessage(name as string, fn as (data: unknown) => void);
}

// ─── Event-Driven Updates ───────────────────────────────────────────────────
// Use event.on("mpv.<property>.changed") for property observation.

// Throttle time-pos updates to avoid flooding webviews (~4 updates/sec max).
let lastBroadcast = 0;
event.on("mpv.time-pos.changed", () => {
  const now = Date.now();
  if (now - lastBroadcast >= 250) {
    lastBroadcast = now;
    broadcastStatus();
  }
});

// These fire infrequently — no throttle needed.
event.on("mpv.pause.changed", () => broadcastStatus());
event.on("mpv.speed.changed", () => broadcastStatus());
event.on("mpv.volume.changed", () => broadcastStatus());

event.on("iina.file-loaded", () => {
  log.log(`Loaded: ${core.status.url}`);
  broadcastStatus();

  // Example: greet user if preference is enabled
  const enabled = preferences.get("example_enabled");
  if (enabled) {
    core.osd("Plugin is active!");
  }
});

// ─── Message Handlers ───────────────────────────────────────────────────────

// Request status (all webviews)
handleAllWebviews("request-status", () => broadcastStatus());

// Toggle pause (all webviews)
handleAllWebviews("toggle-pause", () => {
  if (core.status.paused) core.resume();
  else core.pause();
});

// Seek — sidebar only (uses seekTo for absolute positioning)
handleWebview(sidebar, "seek", (data) => {
  core.seekTo(data.position);
});

// Volume — sidebar only
handleWebview(sidebar, "set-volume", (data) => {
  mpv.set("volume", data.volume);
});

// Speed — sidebar only
handleWebview(sidebar, "set-speed", (data) => {
  mpv.set("speed", data.speed);
});
