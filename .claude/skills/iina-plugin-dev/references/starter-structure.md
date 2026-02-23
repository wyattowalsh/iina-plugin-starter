# Starter Kit Structure

Annotated file tree for the IINA Plugin React/TypeScript starter.

## File Tree

```
iina-plugin-starter/
├── Info.json                    ← EDIT: Plugin manifest (name, perms, entry points)
├── pref.html                    ← EDIT: Preferences page (data-pref-key bindings)
├── package.json                 ← EDIT: Add dependencies; modify targets for new webviews
│
├── src/
│   ├── types.ts                 ← EDIT: Add message types for bridge communication
│   ├── index.ts                 ← EDIT: Per-player logic (events, mpv, webview comms)
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

## Parcel Target → dist/ Mapping

| Target        | Source                         | Output                                           |
| ------------- | ------------------------------ | ------------------------------------------------ |
| `entry`       | `src/index.ts`                 | `dist/index.js`                                  |
| `globalEntry` | `src/global.ts`                | `dist/global.js`                                 |
| `overlay`     | `src/ui/overlay/index.html`    | `dist/ui/overlay/index.html` + bundled JS/CSS    |
| `sidebar`     | `src/ui/sidebar/index.html`    | `dist/ui/sidebar/index.html` + bundled JS/CSS    |
| `standalone`  | `src/ui/standalone/index.html` | `dist/ui/standalone/index.html` + bundled JS/CSS |

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
4. Load from entry script: `overlay.loadFile("dist/ui/myview/index.html")` or `sidebar.loadFile(...)` depending on target type.

## Removing a Webview Target

If your plugin only needs one UI (e.g., just a sidebar):

1. Delete the unused directories (e.g., `src/ui/overlay/`, `src/ui/standalone/`)
2. Remove their targets from `package.json`
3. Remove their `loadFile()` calls from `src/index.ts` / `src/global.ts`
4. Remove unused permissions from `Info.json`
