# AGENTS.md

This repository is a **React/TypeScript starter kit for building IINA plugins**.

## Architecture

IINA plugins have two execution environments:

- **Entry scripts** (`src/index.ts`, `src/global.ts`) — Run in JavaScriptCore. NO DOM. Access IINA APIs via the global `iina` object.
- **React webviews** (`src/ui/*/`) — Run in WKWebView. Full DOM + React. Communicate with entry scripts via typed `postMessage`/`onMessage` bridge.

## Key Files

| File                 | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `Info.json`          | Plugin manifest (name, permissions, entry points) |
| `src/types.ts`       | Shared message type contracts                     |
| `src/index.ts`       | Per-player entry (event listeners, webview comms) |
| `src/global.ts`      | App-wide entry (menus, standalone window)         |
| `src/ui/bridge.ts`   | Typed webview ↔ entry messaging                   |
| `src/ui/overlay/`    | HUD widget on video                               |
| `src/ui/sidebar/`    | Interactive controls panel                        |
| `src/ui/standalone/` | Dashboard window                                  |

## Build & Dev

```bash
pnpm install          # Install deps
pnpm run build        # Parcel builds all targets to dist/
pnpm run dev          # Parcel watch, then rewrite webview HTML for IINA
pnpm run link         # Symlink into IINA's plugin dir (iina-plugin on PATH)
pnpm run typecheck    # Check both entry + UI tsconfigs
pnpm run lint         # ESLint
pnpm run format:check # Prettier check
pnpm run test         # Vitest
pnpm run validate     # Check Info.json against info.schema.json
```

## Agent Skill

See `.claude/skills/iina-plugin-dev/SKILL.md` for the AI agent skill that scaffolds new IINA plugins from natural language prompts.
