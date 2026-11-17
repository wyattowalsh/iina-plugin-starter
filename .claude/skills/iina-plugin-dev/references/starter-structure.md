# Starter Kit Structure

Annotated file tree for the IINA Plugin React/TypeScript starter.

## File Tree

```
iina-plugin-starter/
├── Info.json                    ← EDIT: Plugin manifest (author.name, globalEntry, perms)
├── pref.html                    ← EDIT: Preferences page (data-pref-key bindings)
├── package.json                 ← EDIT: Add dependencies; modify targets for new webviews
│
├── src/
│   ├── types.ts                 ← EDIT: Add message types for bridge communication
│   ├── index.ts                 ← EDIT: Per-player logic (events, playback, webview comms)
│   ├── global.ts                ← EDIT: App-wide logic (menus, standalone window)
│   │
│   └── ui/
│       ├── bridge.ts            ← RARELY EDIT: Typed messaging helpers
│       │
│       ├── overlay/             ← EDIT: HUD widget on video
│       │   ├── index.html       ← Shell (CSS vars, #root div)
│       │   ├── index.tsx        ← React root mount
│       │   └── App.tsx          ← EDIT: Main overlay component
│       │
│       ├── sidebar/             ← EDIT: Controls panel in sidebar tab
│       │   ├── index.html
│       │   ├── index.tsx
│       │   └── App.tsx          ← EDIT: Main sidebar component
│       │
│       └── standalone/          ← EDIT: Dashboard window
│           ├── index.html
│           ├── index.tsx
│           └── App.tsx          ← EDIT: Main standalone component
│
├── tsconfig.json                ← DO NOT EDIT: References root
├── tsconfig.entry.json          ← RARELY EDIT: TS config for entry scripts (no DOM)
├── tsconfig.ui.json             ← RARELY EDIT: TS config for React webviews (DOM)
├── eslint.config.mjs            ← RARELY EDIT: ESLint flat config
├── .prettierrc                  ← RARELY EDIT: Code formatting
├── .editorconfig                ← RARELY EDIT
│
├── .github/workflows/
│   ├── ci.yml                   ← RARELY EDIT: CI pipeline
│   └── release.yml              ← RARELY EDIT: Auto-release on tag
│
├── .husky/pre-commit            ← DO NOT EDIT: Git hooks
├── .vscode/                     ← DO NOT EDIT: Editor config
│
├── .claude/skills/iina-plugin-dev/
│   ├── SKILL.md                 ← DO NOT EDIT: Agent skill instructions
│   └── references/              ← DO NOT EDIT: Agent reference docs
│
├── dist/                        ← GENERATED: Parcel output (gitignored)
├── AGENTS.md                    ← RARELY EDIT: AI agent discovery file
├── CONTRIBUTING.md              ← RARELY EDIT
├── README.md                    ← EDIT: Customize for your plugin
└── LICENSE                      ← EDIT: Choose your license
```

`Info.json` uses `globalEntry` for the global script (`dist/global.js`). `author.name` is required by IINA.

## Parcel Target → dist/ Mapping

| Target        | Source                         | Output                                           |
| ------------- | ------------------------------ | ------------------------------------------------ |
| `entry`       | `src/index.ts`                 | `dist/index.js`                                  |
| `globalEntry` | `src/global.ts`                | `dist/global.js`                                 |
| `overlay`     | `src/ui/overlay/index.html`    | `dist/ui/overlay/index.html` + bundled JS/CSS    |
| `sidebar`     | `src/ui/sidebar/index.html`    | `dist/ui/sidebar/index.html` + bundled JS/CSS    |
| `standalone`  | `src/ui/standalone/index.html` | `dist/ui/standalone/index.html` + bundled JS/CSS |

Point `Info.json` → `globalEntry` at `dist/global.js`. The Parcel target name and the manifest key are both `globalEntry`.

## Adding a New Webview Target

1. Create directory: `src/ui/myview/`
2. Add files: `index.html`, `index.tsx`, `App.tsx` (copy from overlay as template)
3. Add Parcel target in `package.json`:
   ```json
   "myview": {
     "distDir": "./dist/ui/myview/",
     "source": "src/ui/myview/index.html"
   }
   ```
4. From the player entry, call `loadFile` inside `iina.window-loaded` (`overlay.loadFile` or `sidebar.loadFile`). If `core.window.loaded` is already true, load immediately as well. For an overlay, call `setOpacity` and `show` inside `iina.plugin-overlay-loaded`. The overlay stays hidden until `show()`. A standalone page is loaded from the global entry when its menu item opens the window, not from `window-loaded`.

## Removing a Webview Target

If your plugin only needs one UI (e.g., just a sidebar):

1. Delete the unused directories (e.g., `src/ui/overlay/`, `src/ui/standalone/`)
2. Remove their targets from `package.json`
3. Remove their `loadFile()` calls from the `iina.window-loaded` handler in `src/index.ts`. Remove the standalone `loadFile()` from the menu action in `src/global.ts`.
4. If you remove the overlay, also remove `overlay.setOpacity` and `overlay.show` from the `iina.plugin-overlay-loaded` handler.
5. Remove that webview's `broadcastStatus` posts, and drop it from `allWebviews`.
6. If you remove the standalone dashboard, delete the dashboard menu item in `src/global.ts`.
7. Remove unused permissions from `Info.json`

## Commands

- `iina-plugin` is not an npm dependency. It lives at `/Applications/IINA.app/Contents/MacOS/iina-plugin` and must be on `PATH` before `pnpm run link`, `unlink`, or `pack`. See [Creating Plugins](https://docs.iina.io/pages/creating-plugins.html).
- `pnpm run init` is interactive-only. A non-TTY exits 1 and writes nothing.
- `pnpm run dev:reload` prints the webview context-menu Reload steps. It does not send Command-Shift-R and it does not reload by itself. Entry scripts still need an IINA restart.
- `pnpm run validate` checks `Info.json` against `info.schema.json` and exits non-zero on failure.
- CI runs `typecheck`, `lint`, `format:check`, `test`, `validate`, and `build`.
- Release zips `Info.json`, `dist/`, and `pref.html` into `plugin.iinaplgz`. It does not run `iina-plugin pack`.
