# iina-plugin-starter

A React/TypeScript starter kit for building [IINA](https://iina.io) plugins.

> **IINA** is a modern, open-source media player for macOS built on mpv. Its plugin system lets you extend the player with custom UIs, playback controls, subtitle providers, and more.

## Features

- ⚛️ **React 19** in all webview targets (overlay, sidebar, standalone window)
- 🔷 **TypeScript** with full IINA API types via [`iina-plugin-definition`](https://www.npmjs.com/package/iina-plugin-definition)
- 📦 **Parcel** bundler — zero-config, multiple output targets
- 🔗 **Typed bridge** for entry script ↔ webview communication
- 🎨 **Dark/light mode** via `prefers-color-scheme` CSS
- 🤖 **AI agent skill** — scaffold new plugins from natural language prompts
- ✅ **ESLint + Prettier + Husky** — code quality out of the box
- 🚀 **GitHub Actions** — CI (lint/typecheck/build) + Release (pack `.iinaplgz`)

## Quick Start

```bash
# Clone the starter
git clone https://github.com/yourusername/iina-plugin-starter.git my-plugin
cd my-plugin

# Install
pnpm install

# Build all targets
pnpm run build

# Link to IINA for testing
pnpm run link
```

Then restart IINA → open a video → your plugin's overlay and sidebar appear.

## Project Structure

```
├── Info.json              # Plugin manifest
├── pref.html              # Preferences page (native IINA bindings)
├── src/
│   ├── types.ts           # Shared message type contracts
│   ├── index.ts           # Per-player entry (JSContext, no DOM)
│   ├── global.ts          # App-wide entry (menus, standalone window)
│   └── ui/
│       ├── bridge.ts      # Typed postMessage/onMessage helper
│       ├── overlay/       # HUD widget on video
│       ├── sidebar/       # Interactive controls panel
│       └── standalone/    # Dashboard window
├── tsconfig.entry.json    # TS config for entry scripts (no DOM)
├── tsconfig.ui.json       # TS config for React webviews (with DOM)
└── eslint.config.mjs      # ESLint flat config
```

## Architecture

IINA plugins have two execution environments:

```
┌─────────────────────────────────────────────────────┐
│ IINA Player                                          │
│  ┌──────────────┐    postMessage     ┌────────────┐ │
│  │ Entry Script  │ ◄───────────────► │  Webview    │ │
│  │ (JSContext)   │    onMessage      │  (React)    │ │
│  │               │                   │             │ │
│  │ • iina.core   │                   │ • Overlay   │ │
│  │ • iina.mpv    │                   │ • Sidebar   │ │
│  │ • iina.event  │                   │ • Window    │ │
│  └──────────────┘                   └────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Entry scripts** run in JavaScriptCore (no DOM). They control playback via `iina.*` APIs and push status to webviews via event-driven `postMessage`.

**React webviews** run in WKWebView (full DOM). They render UI and send user actions back to entry scripts via the typed bridge.

## Customizing

### 1. Edit `Info.json`

Set your plugin's `name`, `identifier`, `description`, `author`, and `permissions`.

### 2. Implement Entry Logic

Edit `src/index.ts` for per-player behavior. Use [`iina.core`](https://docs.iina.io), `iina.mpv`, `iina.event`, etc.

### 3. Build Your UI

Edit the React apps in `src/ui/overlay/App.tsx`, `src/ui/sidebar/App.tsx`, and `src/ui/standalone/App.tsx`.

Communication between entry scripts and webviews uses typed helpers:

```tsx
// In a React component
import { sendToPlugin, onPluginMessage } from "../bridge";

onPluginMessage("status-update", (status) => {
  console.log(status.title); // fully typed
});

sendToPlugin("seek", { position: 30 }); // fully typed
```

### 4. Add Permissions

Declare in `Info.json` → `permissions`:

| Permission        | Enables        |
| ----------------- | -------------- |
| `show-osd`        | OSD messages   |
| `video-overlay`   | Draw on video  |
| `show-alert`      | Native dialogs |
| `network-request` | HTTP/WebSocket |
| `file-system`     | File I/O, exec |

## Scripts

| Command              | Description                |
| -------------------- | -------------------------- |
| `pnpm run dev`       | Parcel watch mode          |
| `pnpm run build`     | Production build           |
| `pnpm run link`      | Symlink into IINA          |
| `pnpm run unlink`    | Remove symlink             |
| `pnpm run pack`      | Pack `.iinaplgz`           |
| `pnpm run typecheck` | Type-check both entry + UI |
| `pnpm run lint`      | ESLint                     |
| `pnpm run format`    | Prettier                   |

## AI Agent Skill

This repo includes a Claude Agent Skill at `.claude/skills/iina-plugin-dev/`. Use it to scaffold new plugins from natural language:

```
/iina-plugin-dev create a plugin that shows lyrics synced to audio playback
```

## Publishing

1. Bump `version` in `Info.json`
2. Increment `ghVersion` for auto-update
3. `pnpm run build`
4. `git tag v0.2.0 && git push --tags`
5. GitHub Actions creates the release with `.iinaplgz`

## Resources

- [IINA Plugin API Docs](https://docs.iina.io)
- [IINA Plugin Definition Types](https://www.npmjs.com/package/iina-plugin-definition)
- [IINA on GitHub](https://github.com/iina/iina)
- [Official Plugin Example](https://github.com/iina/plugin-online-media)

## License

MIT
