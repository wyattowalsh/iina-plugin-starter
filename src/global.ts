/**
 * Global entry script — runs once at IINA launch (not per-player).
 *
 * Use for: menu items, standalone windows, cross-player coordination.
 */

const { menu, standaloneWindow, console: log } = iina;

// ─── Plugin Menu ────────────────────────────────────────────────────────────
// menu.item(title, action) creates a MenuItem; menu.addItem(item) registers it.

const dashboardItem = menu.item("Show Plugin Dashboard", () => {
  standaloneWindow.open();
  standaloneWindow.loadFile("dist/ui/standalone/index.html");
  standaloneWindow.setFrame(800, 500);
  log.log("Plugin dashboard opened");
});

menu.addItem(dashboardItem);

// ─── Cross-Player Messaging ────────────────────────────────────────────────
// global.onMessage receives messages from any player's main entry.
// The `player` parameter is optional (undefined when not from a player).

iina.global.onMessage("global-action", (data: unknown, player?: string) => {
  log.log(`Received from player ${player ?? "unknown"}: ${JSON.stringify(data)}`);
  if (player) {
    iina.global.postMessage(player, "global-response", { ok: true });
  }
});
