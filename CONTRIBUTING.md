# Contributing

## Prerequisites

- **Node.js** 22+
- **IINA** 1.4.0+ (for testing plugins)

## Setup

```bash
git clone https://github.com/yourusername/iina-plugin-starter.git
cd iina-plugin-starter
pnpm install
pnpm run init     # Personalize plugin name, author, identifier
pnpm run build
```

## Development Workflow

1. **Start Parcel watch** — rebuilds on file changes:
   ```bash
   pnpm run dev
   ```
2. **Link plugin to IINA** (first time only):
   ```bash
   pnpm run link
   ```
3. **Restart IINA** to load the plugin
4. **Edit code** → Parcel rebuilds → reload to see changes
5. **Check Log Viewer** (IINA → Window → Log Viewer) for plugin logs

### Hot Reload vs. Full Restart

| What changed                                        | Reload strategy                                   |
| --------------------------------------------------- | ------------------------------------------------- |
| **Webview UI** (React in `src/ui/`)                 | Run `pnpm run dev:reload` or manually ⌘⇧R in IINA |
| **Entry scripts** (`src/index.ts`, `src/global.ts`) | Full IINA restart required                        |
| **Info.json** (manifest)                            | Full IINA restart required                        |

> **Tip**: During UI development you can iterate without restarting IINA — Parcel rebuilds the HTML/JS and `dev:reload` triggers a webview refresh via AppleScript.

## Architecture

### Entry Scripts (No DOM)

`src/index.ts` and `src/global.ts` run in JavaScriptCore — a JS runtime without `window`, `document`, or `fetch`. They access IINA's API via the global `iina` object.

- `index.ts` — Instantiated per-player. Use for playback control, event handling, webview management.
- `global.ts` — Runs once at IINA launch. Use for menu items, standalone windows, cross-player coordination.

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
3. Load it from entry script: `overlay.loadFile("dist/ui/myview/index.html")`

### Removing a Webview Target

To remove a target you don't need (e.g., `overlay`):

1. **Delete the source directory**: `rm -rf src/ui/overlay/`
2. **Remove the Parcel target** from `package.json` → `"targets"` → delete the `"overlay"` key
3. **Remove from `src/index.ts`**: delete the `overlay.loadFile(...)` line and any `handleWebview(overlay, ...)` calls. Remove `overlay` from the `allWebviews` array.

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
4. The release workflow creates a `.iinaplgz` artifact

## Code Quality

- **Lint**: `pnpm run lint`
- **Format**: `pnpm run format`
- **Type check**: `pnpm run typecheck`
- **Test**: `pnpm run test`
- **Validate manifest**: `pnpm run validate`
- Pre-commit hooks run `lint-staged` automatically via Husky
