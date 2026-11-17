# Contributing

## Prerequisites

- **Node.js** 22+
- **IINA** 1.4.0+ (for testing plugins)
- **`iina-plugin` on `PATH`** before `pnpm run link`, `unlink`, or `pack`. It is not an npm dependency. The binary is `/Applications/IINA.app/Contents/MacOS/iina-plugin`. See [Creating Plugins](https://docs.iina.io/pages/creating-plugins.html).

```bash
ln -s /Applications/IINA.app/Contents/MacOS/iina-plugin /usr/local/bin/iina-plugin
```

## Setup

```bash
git clone https://github.com/yourusername/iina-plugin-starter.git
cd iina-plugin-starter
pnpm install
pnpm run init     # Interactive only. A non-TTY exits 1 and writes nothing.
pnpm run build
```

`pnpm run init` prompts for the plugin name, identifier, author, and description, then rewrites `Info.json`, `package.json`, and the docs it touches. Without a TTY it exits 1 and writes nothing.

## Development Workflow

1. **Start Parcel watch** — rebuilds on file changes:
   ```bash
   pnpm run dev
   ```
2. **Link plugin to IINA** (first time only). `iina-plugin` must already be on `PATH`:
   ```bash
   pnpm run link
   ```
3. **Restart IINA and open a video** so `iina.window-loaded` fires. The overlay stays hidden until `show()`.
4. **Edit code** → Parcel rebuilds → reload webviews to see UI changes
5. **Check Log Viewer** (IINA → Window → Log Viewer) for plugin logs

### Hot Reload vs. Full Restart

| What changed                                        | Reload strategy                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Webview UI** (React in `src/ui/`)                 | `pnpm run dev:reload` prints the context-menu Reload steps. Right-click the webview and choose Reload. |
| **Entry scripts** (`src/index.ts`, `src/global.ts`) | Full IINA restart required                                                                             |
| **Info.json** (manifest)                            | Full IINA restart required                                                                             |

> **Tip**: `pnpm run dev` rebuilds bundles and rewrites webview HTML into relative classic scripts. Reload the webview from its context menu. `pnpm run dev:reload` only prints those steps. Entry scripts still need an IINA restart.

## Architecture

### Entry Scripts (No DOM)

`src/index.ts` and `src/global.ts` run in JavaScriptCore — a JS runtime without `window`, `document`, or `fetch`. They access IINA's API via the global `iina` object.

- `index.ts` — Instantiated per-player. Use for playback control, event handling, webview management. `overlay.loadFile` and `sidebar.loadFile` run from `iina.window-loaded` (and immediately when `core.window.loaded` is already true). `overlay.setOpacity` and `overlay.show` run from `iina.plugin-overlay-loaded`. The overlay stays hidden until `show()`.
- `global.ts` — Runs once at IINA launch. Use for menu items and the standalone window. The dashboard page loads when the menu opens it, not from `window-loaded`.

Property changes are `event.on("mpv.<prop>.changed", fn)`. `event.on` returns an id string; pass that id to `event.off(event, id)`.

Pause with `core.pause()` and `core.resume()`. `core.seek(seconds, exact)` is relative. Absolute seeks are `core.seekTo`. The starter sidebar uses `seekTo`.

Menus are `menu.item(title, action)` and then `menu.addItem(item)`.

### React Webviews (Full DOM)

`src/ui/overlay/`, `src/ui/sidebar/`, `src/ui/standalone/` are React apps loaded into IINA's WKWebView. They communicate with entry scripts via the typed bridge in `src/ui/bridge.ts`.

### Key Modules

| File                 | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `src/ui/bridge.ts`   | Typed messaging + preference helpers with error guards     |
| `src/ui/hooks.ts`    | `usePluginStatus()` and `usePluginMessage()` React hooks   |
| `src/preferences.ts` | Typed preference keys (single source of truth)             |
| `src/types.ts`       | Shared message type maps for entry ↔ webview communication |

### Adding a New Webview Target

1. Create `src/ui/myview/index.html`, `index.tsx`, `App.tsx`
2. Add a new Parcel target in `package.json`:
   ```json
   "myview": {
     "distDir": "./dist/ui/myview/",
     "source": "src/ui/myview/index.html"
   }
   ```
3. Load it from the player entry inside `iina.window-loaded`: `overlay.loadFile("dist/ui/myview/index.html")` or `sidebar.loadFile(...)`. For an overlay, call `setOpacity` and `show` from `iina.plugin-overlay-loaded`. A standalone page is loaded from `src/global.ts` when the menu opens the window.

### Removing a Webview Target

To remove a target you don't need (e.g., `overlay`):

1. **Delete the source directory**: `rm -rf src/ui/overlay/`
2. **Remove the Parcel target** from `package.json` → `"targets"` → delete the `"overlay"` key
3. **Remove from `src/index.ts`**: delete that target's `loadFile` call (it lives in the `iina.window-loaded` handler), its `handleWebview(...)` registrations, and its `broadcastStatus` posts. Remove it from the `allWebviews` array.
4. **Overlay display**: also delete `overlay.setOpacity` and `overlay.show` from the `iina.plugin-overlay-loaded` handler.
5. **Standalone dashboard**: delete the dashboard menu item in `src/global.ts`.
6. **Remove unused permissions** from `Info.json` when nothing still needs them.

## Testing

```bash
pnpm run test           # Run once
pnpm run test:watch     # Watch mode
```

Tests use [Vitest](https://vitest.dev) with a jsdom environment. The iina mock (`src/__mocks__/iina.ts`) auto-stubs the global `iina` object so you can test entry-script logic and bridge functions without running inside IINA.

## Publishing

1. Bump `version` in `Info.json` and `ghVersion` if using GitHub auto-update
2. Run `pnpm run build`
3. Tag and push: `git tag v0.2.0 && git push --tags`
4. The release workflow zips `Info.json`, `dist/`, and `pref.html` into `plugin.iinaplgz`. It does not run `iina-plugin pack`.

## Code Quality

- **Lint**: `pnpm run lint`
- **Format**: `pnpm run format` (check with `pnpm run format:check`)
- **Type check**: `pnpm run typecheck`
- **Test**: `pnpm run test`
- **Validate manifest**: `pnpm run validate` checks `Info.json` against `info.schema.json` and exits non-zero on failure
- Pre-commit hooks run `lint-staged` automatically via Husky

CI runs `typecheck`, `lint`, `format:check`, `test`, `validate`, and `build`.
