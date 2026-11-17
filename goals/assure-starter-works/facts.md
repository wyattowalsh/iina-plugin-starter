# Facts

- `Info.json` names the global script `globalEntry`, and the manifest has no `global` key.
- `pnpm run validate` exits 0 for the shipped manifest and exits 1 when `author` is missing or an unknown property is present.
- Importing the player entry does not call `overlay.loadFile` or `sidebar.loadFile`.
- `iina.window-loaded` loads the overlay and sidebar pages.
- `iina.plugin-overlay-loaded` calls `overlay.show()` and `overlay.setOpacity(0.9)`.
- The menu dashboard receives `status-update` from the global entry after a player posts `player-status`.
- A dashboard with no snapshot shows Waiting, not Playing.
- `example_text` is copied onto `PlayerStatus.customText` and rendered in the overlay.
- `example_enabled: false` skips the file-loaded OSD and the overlay renders nothing.
- A dashboard preference write goes through `set-preference` to the entry that owns that webview, then `preferences.set` and `preferences.sync`.
- The main entry posts `playlist-update` on `iina.file-loaded` and `mpv.playlist-count.changed`, with a non-null display title.
- Dragging the sidebar seek slider commits one seek when the pointer is released.
- `formatTime` of a negative or non-finite number is `0:00`.
- The agent skill does not tell agents to call `mpv.observe`, `core.togglePause`, or `menu.addItem(title, action)`.
- `pnpm run dev:reload` does not invoke `osascript`.
- `pnpm run init` exits 1 when stdin is not a terminal and does not write files.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run validate`, and `pnpm run build` exit 0.
