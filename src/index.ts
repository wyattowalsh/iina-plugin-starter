/**
 * Main entry script — instantiated once per IINA player window.
 *
 * Runs in JavaScriptCore (no DOM). Accesses IINA APIs via the global `iina` object.
 * Communicates with React webviews via postMessage/onMessage.
 */

import type { PlayerStatus } from "./types";
import { isPrefKey, parsePrefEntry } from "./preferences";
import { readPref, writePref } from "./pref-store";
import { toDisplayItems } from "./playlist";

const { core, mpv, event, overlay, sidebar, playlist, console: log } = iina;

// JavaScriptCore ids are strings. `types` is empty, so declare the timers locally.
declare function setTimeout(callback: () => void, delayMs: number): string;
declare function clearTimeout(id: string): void;

const TIME_POS_INTERVAL_MS = 250;

let viewsLoaded = false;
let overlayRevealed = false;
let timePosWindowStarted = false;
let timePosWindowAt = 0;
let timePosTrailing: string | undefined;

type MessageWebview = {
  postMessage(name: string, data: unknown): void;
  onMessage(name: string, callback: (data: unknown) => void): void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(data: unknown, field: string): number | undefined {
  if (!isRecord(data)) {
    return undefined;
  }
  const value = data[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function getStatus(): PlayerStatus {
  return {
    title: core.status.title ?? "No file loaded",
    position: core.status.position ?? 0,
    duration: core.status.duration ?? 0,
    paused: core.status.paused ?? true,
    speed: mpv.getNumber("speed") ?? 1,
    volume: mpv.getNumber("volume") ?? 100,
    enabled: readPref("example_enabled"),
    customText: readPref("example_text"),
  };
}

/** Push current status to the player webviews and the global entry. */
function broadcastStatus(): void {
  const status = getStatus();
  overlay.postMessage("status-update", status);
  sidebar.postMessage("status-update", status);
  iina.global.postMessage("player-status", status);
}

/** Idle playback has no rows. A missing `idle` value is treated as not idle. */
function postPlaylist(): void {
  const status = core.status as { idle?: boolean };
  const items = status.idle === true ? [] : toDisplayItems(playlist.list());
  overlay.postMessage("playlist-update", items);
  sidebar.postMessage("playlist-update", items);
}

function togglePause(): void {
  if (core.status.paused) {
    core.resume();
  } else {
    core.pause();
  }
}

function replyPreference(webview: MessageWebview, data: unknown): void {
  if (!isRecord(data) || !isPrefKey(data.key)) {
    return;
  }
  webview.postMessage("preference-value", {
    key: data.key,
    value: readPref(data.key),
  });
}

function applyPreference(data: unknown): void {
  if (!isRecord(data) || !isPrefKey(data.key)) {
    return;
  }
  const value = parsePrefEntry(data.key, data.value);
  if (value === undefined) {
    return;
  }
  writePref(data.key, value);
  if (overlayRevealed) {
    if (readPref("example_enabled")) {
      overlay.show();
    } else {
      overlay.hide();
    }
  }
  broadcastStatus();
}

function onTimePosChanged(): void {
  const now = Date.now();
  if (!timePosWindowStarted || now - timePosWindowAt >= TIME_POS_INTERVAL_MS) {
    if (timePosTrailing !== undefined) {
      clearTimeout(timePosTrailing);
      timePosTrailing = undefined;
    }
    timePosWindowStarted = true;
    timePosWindowAt = now;
    broadcastStatus();
    return;
  }
  if (timePosTrailing !== undefined) {
    return;
  }
  const remaining = TIME_POS_INTERVAL_MS - (now - timePosWindowAt);
  timePosTrailing = setTimeout(
    () => {
      timePosTrailing = undefined;
      timePosWindowAt = Date.now();
      broadcastStatus();
    },
    Math.max(0, remaining),
  );
}

/** Load overlay and sidebar once, then listen on the sidebar only. */
function loadViews(): void {
  if (viewsLoaded) {
    return;
  }
  viewsLoaded = true;
  overlay.loadFile("dist/ui/overlay/index.html");
  sidebar.loadFile("dist/ui/sidebar/index.html");
  sidebar.onMessage("seek", (data: unknown) => {
    const position = readNumber(data, "position");
    if (position === undefined) {
      return;
    }
    core.seekTo(position);
  });
  sidebar.onMessage("set-volume", (data: unknown) => {
    const volume = readNumber(data, "volume");
    if (volume === undefined) {
      return;
    }
    mpv.set("volume", volume);
  });
  sidebar.onMessage("set-speed", (data: unknown) => {
    const speed = readNumber(data, "speed");
    if (speed === undefined) {
      return;
    }
    mpv.set("speed", speed);
  });
  sidebar.onMessage("request-status", () => {
    broadcastStatus();
  });
  sidebar.onMessage("toggle-pause", () => {
    togglePause();
  });
  sidebar.onMessage("get-preference", (data: unknown) => {
    replyPreference(sidebar, data);
  });
  sidebar.onMessage("set-preference", (data: unknown) => {
    applyPreference(data);
  });
}

/** Show the overlay after IINA has finished loading its webview. */
function revealOverlay(): void {
  if (!viewsLoaded) {
    return;
  }
  overlayRevealed = true;
  overlay.setOpacity(0.9);
  if (readPref("example_enabled")) {
    overlay.show();
  } else {
    overlay.hide();
  }
  overlay.onMessage("request-status", () => {
    broadcastStatus();
  });
  overlay.onMessage("toggle-pause", () => {
    togglePause();
  });
  overlay.onMessage("get-preference", (data: unknown) => {
    replyPreference(overlay, data);
  });
  overlay.onMessage("set-preference", (data: unknown) => {
    applyPreference(data);
  });
  broadcastStatus();
  postPlaylist();
}

event.on("iina.window-loaded", () => {
  loadViews();
});

event.on("iina.plugin-overlay-loaded", () => {
  revealOverlay();
});

event.on("iina.file-loaded", (url: string) => {
  log.log(url);
  broadcastStatus();
  postPlaylist();
  if (readPref("example_enabled")) {
    core.osd("Plugin is active!");
  }
});

event.on("iina.window-will-close", () => {
  iina.global.postMessage("player-bye", {});
});

event.on("mpv.pause.changed", () => {
  broadcastStatus();
});

event.on("mpv.speed.changed", () => {
  broadcastStatus();
});

event.on("mpv.volume.changed", () => {
  broadcastStatus();
});

event.on("mpv.time-pos.changed", () => {
  onTimePosChanged();
});

event.on("mpv.playlist-count.changed", () => {
  postPlaylist();
});

iina.global.onMessage("pull-status", () => {
  broadcastStatus();
});

iina.global.onMessage("refresh-status", () => {
  broadcastStatus();
});

iina.global.postMessage("player-announce", {
  title: core.status.title ?? "",
});

if (core.window.loaded) {
  loadViews();
}
