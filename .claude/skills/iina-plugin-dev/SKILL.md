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
2. **Edit `Info.json`**: Set `name`, `identifier`, `description`, `author`, `permissions`
3. **Edit `src/index.ts`**: Add IINA API logic (event listeners, mpv observers, webview comms)
4. **Edit React UIs**: Modify `src/ui/overlay/App.tsx`, `src/ui/sidebar/App.tsx`, and/or `src/ui/standalone/App.tsx`
5. **Wire the bridge**: Use `sendToPlugin()` and `onPluginMessage()` from `src/ui/bridge.ts`
6. **Add message types**: Define new messages in `src/types.ts` → `EntryToWebviewMessages` and `WebviewToEntryMessages`
7. **Build**: `pnpm run build`
8. **Test**: `pnpm run link` → restart IINA → check Log Viewer

## Critical Rules

- **Entry scripts have NO DOM**. Never use `window`, `document`, `fetch`, `console.log`. Use `iina.console.log()` instead.
- **React code has NO `iina` global**. Use `window.iina.postMessage()` / `window.iina.onMessage()` via the bridge.
- **Always declare permissions** in Info.json before using APIs that require them.
- **Use mpv.observe() for status updates**, not polling with setInterval.
- **Two tsconfigs**: `tsconfig.entry.json` (no DOM) for entry scripts, `tsconfig.ui.json` (with DOM) for React.

## Quick API Reference

| Module                  | Purpose       | Key Methods                                                                     |
| ----------------------- | ------------- | ------------------------------------------------------------------------------- |
| `iina.core`             | Playback      | `open()`, `osd()`, `pause()`, `resume()`, `seek()`, `togglePause()`             |
| `iina.mpv`              | mpv engine    | `getNumber()`, `getString()`, `getFlag()`, `set()`, `command()`, `observe()`    |
| `iina.event`            | Events        | `on("iina.file-loaded", fn)`, `on("iina.window-will-close", fn)`                |
| `iina.overlay`          | Video overlay | `loadFile()`, `show()`, `hide()`, `postMessage()`, `onMessage()`                |
| `iina.sidebar`          | Sidebar tab   | `loadFile()`, `show()`, `postMessage()`, `onMessage()`                          |
| `iina.standaloneWindow` | Window        | `open()`, `loadFile()`, `close()`, `setFrame()`, `postMessage()`, `onMessage()` |
| `iina.http`             | HTTP          | `get()`, `post()` — needs `network-request` permission                          |
| `iina.file`             | File I/O      | `read()`, `write()`, `exists()`, `trash()` — needs `file-system` permission     |
| `iina.menu`             | Menus         | `addItem(title, action)`                                                        |
| `iina.preferences`      | Settings      | `get(key)`, `set(key, value)`                                                   |
| `iina.console`          | Logging       | `log()`, `warn()`, `error()`                                                    |
| `iina.global`           | Cross-player  | `postMessage(playerID, name, data)`, `onMessage(name, fn)`                      |

## Permissions

Declare in `Info.json` → `permissions` array:

- `show-osd` — Display OSD messages
- `show-alert` — Show native alert dialogs
- `video-overlay` — Draw on video overlay
- `network-request` — HTTP/WebSocket requests
- `file-system` — Read/write files, execute programs

## Detailed References

- [IINA API Reference](references/iina-api-reference.md) — Complete API methods + event names
- [Starter Structure](references/starter-structure.md) — File tree with modification guidance
- [Info.json Spec](references/info-json-spec.md) — All manifest fields and examples
