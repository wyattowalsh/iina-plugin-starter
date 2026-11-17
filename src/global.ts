/**
 * Global entry script — runs once at IINA launch (not per-player).
 *
 * Use for: menu items, standalone windows, cross-player coordination.
 */

import type { PlayerStatus } from "./types";
import { isPrefKey, parsePrefEntry } from "./preferences";
import { readPref, writePref } from "./pref-store";

const { menu, standaloneWindow, console: log } = iina;

const knownPlayerIds = new Set<string>();
const statusByPlayer = new Map<string, PlayerStatus>();
let activePlayerId: string | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlayerStatus(value: unknown): value is PlayerStatus {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.title === "string" &&
    typeof value.position === "number" &&
    typeof value.duration === "number" &&
    typeof value.paused === "boolean" &&
    typeof value.speed === "number" &&
    typeof value.volume === "number" &&
    typeof value.enabled === "boolean" &&
    typeof value.customText === "string"
  );
}

function rememberPlayer(playerId: string): void {
  knownPlayerIds.add(playerId);
  if (activePlayerId === undefined) {
    activePlayerId = playerId;
  }
}

function forgetPlayer(playerId: string): void {
  knownPlayerIds.delete(playerId);
  statusByPlayer.delete(playerId);
  if (activePlayerId === playerId) {
    activePlayerId = undefined;
  }
}

function activeId(): string | undefined {
  if (activePlayerId === undefined || !knownPlayerIds.has(activePlayerId)) {
    return undefined;
  }
  return activePlayerId;
}

/** `loadFile` clears webview listeners, so bind these after every open. */
function bindDashboard(): void {
  standaloneWindow.onMessage("request-status", () => {
    const playerId = activeId();
    if (playerId === undefined) {
      return;
    }
    const status = statusByPlayer.get(playerId);
    if (status !== undefined) {
      standaloneWindow.postMessage("status-update", status);
    }
    iina.global.postMessage(playerId, "pull-status", {});
  });

  standaloneWindow.onMessage("set-preference", (data: unknown) => {
    if (!isRecord(data) || !isPrefKey(data.key)) {
      return;
    }
    const value = parsePrefEntry(data.key, data.value);
    if (value === undefined) {
      return;
    }
    writePref(data.key, value);
    standaloneWindow.postMessage("preference-changed", { key: data.key, value });
    const playerId = activeId();
    if (playerId !== undefined) {
      iina.global.postMessage(playerId, "refresh-status", {});
    }
  });

  standaloneWindow.onMessage("get-preference", (data: unknown) => {
    if (!isRecord(data) || !isPrefKey(data.key)) {
      return;
    }
    standaloneWindow.postMessage("preference-value", {
      key: data.key,
      value: readPref(data.key),
    });
  });
}

const dashboardItem = menu.item("Show Plugin Dashboard", () => {
  standaloneWindow.open();
  standaloneWindow.loadFile("dist/ui/standalone/index.html");
  standaloneWindow.setFrame(800, 500);
  bindDashboard();
  log.log("Plugin dashboard opened");
});

menu.addItem(dashboardItem);

iina.global.onMessage("player-status", (data: unknown, player?: string) => {
  if (player === undefined || !isPlayerStatus(data)) {
    return;
  }
  knownPlayerIds.add(player);
  statusByPlayer.set(player, data);
  activePlayerId = player;
  standaloneWindow.postMessage("status-update", data);
});

iina.global.onMessage("player-announce", (_data: unknown, player?: string) => {
  if (player === undefined) {
    return;
  }
  rememberPlayer(player);
});

iina.global.onMessage("player-bye", (_data: unknown, player?: string) => {
  if (player === undefined) {
    return;
  }
  forgetPlayer(player);
});
