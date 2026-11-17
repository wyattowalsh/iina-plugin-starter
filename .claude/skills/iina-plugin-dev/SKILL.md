---
name: iina-plugin-dev
description: >
  Build IINA media player plugins using the React/TypeScript starter kit.
  Use when the user wants to create, modify, or extend an IINA plugin —
  including scaffolding new plugins, adding overlay/sidebar/standalone UIs,
  implementing IINA API features (playback control, subtitles, playlists,
  menus, file access, HTTP requests), or configuring plugin preferences.
  Triggers on: "iina plugin", "iina-plugin", "create a plugin for IINA",
  "media player plugin", or similar requests about IINA plugin development.
---

# IINA Plugin Development Skill

Build plugins for [IINA](https://iina.io), the modern macOS media player, using the React/TypeScript starter kit in this repository.

## Architecture

IINA plugins have **two execution environments**:

1. **Entry scripts** (`src/index.ts`, `src/global.ts`) — Run in JavaScriptCore. **No DOM**. Access IINA APIs via the global `iina` object.
2. **React webviews** (`src/ui/*/`) — Run in WKWebView. Full DOM + React. Communicate with entry scripts via `postMessage`/`onMessage`.

```
┌───────────────────────────────────────────────────┐
│ IINA Player                                        │
│  ┌──────────────┐    postMessage    ┌────────────┐ │
│  │ Entry Script  │ ◄──────────────► │  Webview   │ │
│  │ (JSContext)   │    onMessage     │  (React)   │ │
│  │               │                  │            │ │
│  │ iina.core     │                  │ Overlay    │ │
│  │ iina.mpv      │                  │ Sidebar    │ │
│  │ iina.event    │                  │ Window     │ │
│  └──────────────┘                  └────────────┘ │
└───────────────────────────────────────────────────┘
```

## Workflow: Creating a New Plugin

1. **Copy this starter** into a new directory
2. **Edit `Info.json`**: Set `name`, `identifier`, `description`, `author` (`author.name` is required by IINA), and `permissions`. The global script key is `globalEntry`. IINA does not read `"global":`.
3. **Edit `src/index.ts`**: Add IINA API logic (event listeners, playback, webview comms)
4. **Edit React UIs**: Modify `src/ui/overlay/App.tsx`, `src/ui/sidebar/App.tsx`, and/or `src/ui/standalone/App.tsx`
5. **Wire the bridge**: Use `sendToPlugin()` and `onPluginMessage()` from `src/ui/bridge.ts`
6. **Add message types**: Define new messages in `src/types.ts` → `EntryToWebviewMessages` and `WebviewToEntryMessages`
7. **Build**: `pnpm run build`
8. **Test**: `iina-plugin` must be on `PATH` before `pnpm run link`. It is `/Applications/IINA.app/Contents/MacOS/iina-plugin`, not an npm package ([Creating Plugins](https://docs.iina.io/pages/creating-plugins.html)). Then restart IINA and open a video so `iina.window-loaded` fires. The overlay stays hidden until `show()`. Check the Log Viewer.

## Critical Rules

- **Entry scripts have NO DOM**. Never use `window`, `document`, `fetch`, `console.log`. Use `iina.console.log()` instead.
- **React code has NO `iina` global**. Use `window.iina.postMessage()` / `window.iina.onMessage()` via the bridge.
- **Always declare permissions** in Info.json before using APIs that require them.
- **Manifest**: `author.name` is required by IINA. The global entry key is `globalEntry`. IINA does not read `"global":`.
- **Property changes** are `event.on("mpv.<prop>.changed", fn)`. `event.on` returns an id string. Remove the listener with `event.off(event, id)`.
- **Pause** with `core.pause()` and `core.resume()`. `core.seek(seconds, exact)` is relative. Absolute seeks are `core.seekTo`. The starter sidebar uses `seekTo`.
- **Menus**: `const item = menu.item(title, action)` then `menu.addItem(item)`.
- **Webview loading**: call `overlay.loadFile` and `sidebar.loadFile` from `iina.window-loaded` (also immediately when `core.window.loaded` is already true). The overlay stays hidden until `show()`. Call `overlay.setOpacity` and `overlay.show` from `iina.plugin-overlay-loaded`. The global entry loads the standalone page when the menu opens it, not on `window-loaded`.
- **`iina-plugin` is not an npm dependency.** It is `/Applications/IINA.app/Contents/MacOS/iina-plugin` and must be on `PATH` before `pnpm run link`, `unlink`, or `pack`.
- **Two tsconfigs**: `tsconfig.entry.json` (no DOM) for entry scripts, `tsconfig.ui.json` (with DOM) for React.

## Quick API Reference

| Module                  | Purpose       | Key Methods                                                                       |
| ----------------------- | ------------- | --------------------------------------------------------------------------------- |
| `iina.core`             | Playback      | `open()`, `osd()`, `pause()`, `resume()`, `seek(seconds, exact)`, `seekTo()`      |
| `iina.mpv`              | mpv engine    | `getNumber()`, `getString()`, `getFlag()`, `set()`, `command()`                   |
| `iina.event`            | Events        | `on()` returns an id; `off(event, id)`; `mpv.<prop>.changed`                      |
| `iina.overlay`          | Video overlay | `loadFile()`, `show()`, `hide()`, `setOpacity()`, `postMessage()`                 |
| `iina.sidebar`          | Sidebar tab   | `loadFile()`, `show()`, `postMessage()`, `onMessage()`                            |
| `iina.standaloneWindow` | Window        | `open()`, `loadFile()`, `close()`, `setFrame()`, `postMessage()`                  |
| `iina.http`             | HTTP          | `get()`, `post()`, `download()` — needs `network-request`                         |
| `iina.file`             | File I/O      | `read()`, `write()`, `exists()`, `list()`, `trash()` — needs `file-system`        |
| `iina.menu`             | Menus         | `item(title, action)`, then `addItem(item)`                                       |
| `iina.playlist`         | Playlist      | `list()`, `count()`, `add()`, `play()` — `PlaylistItem.title` is `string \| null` |
| `iina.preferences`      | Settings      | `get(key)`, `set(key, value)`, `sync()`                                           |
| `iina.console`          | Logging       | `log()`, `warn()`, `error()`                                                      |
| `iina.global`           | Cross-player  | `postMessage(...)`, `onMessage(name, fn)`                                         |

## Permissions

Declare in `Info.json` → `permissions` array:

- `show-osd` — Display OSD messages
- `show-alert` — `utils.ask()` (synchronous boolean) and `utils.prompt()`. There is no `utils.alert`.
- `video-overlay` — Draw on the video overlay
- `network-request` — HTTP and the local WebSocket server (`iina.ws`)
- `file-system` — Read/write files, execute programs

## Scripts

- `pnpm run init` is interactive-only. A non-TTY exits 1 and writes nothing.
- `pnpm run dev:reload` prints the webview context-menu Reload steps. It does not send Command-Shift-R and it does not reload by itself. Entry scripts still need an IINA restart.
- `pnpm run validate` checks `Info.json` against `info.schema.json` and exits non-zero on failure.
- CI runs `typecheck`, `lint`, `format:check`, `test`, `validate`, and `build`.
- Release zips `Info.json`, `dist/`, and `pref.html` into `plugin.iinaplgz`. It does not run `iina-plugin pack`.

## Detailed References

- [IINA API Reference](references/iina-api-reference.md) — Complete API methods + event names
- [Starter Structure](references/starter-structure.md) — File tree with modification guidance
- [Info.json Spec](references/info-json-spec.md) — All manifest fields and examples
