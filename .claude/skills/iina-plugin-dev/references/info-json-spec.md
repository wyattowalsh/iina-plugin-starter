# Info.json Specification

Complete reference for the IINA plugin manifest file.

IINA refuses to load a plugin unless `name`, `identifier`, `version`, `entry`, and `author` are present. `author.name` is required. `author.email` and `author.url` are optional.

## Required Fields

```json
{
  "name": "My Plugin",
  "identifier": "com.example.my-plugin",
  "version": "0.1.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "url": "https://example.com"
  },
  "entry": "dist/index.js"
}
```

| Field        | Type   | Description                                                          |
| ------------ | ------ | -------------------------------------------------------------------- |
| `name`       | string | Display name in IINA's plugin list                                   |
| `identifier` | string | Reverse-domain unique identifier (e.g., `com.example.my-plugin`)     |
| `version`    | string | Semantic version string                                              |
| `author`     | object | Required by IINA. `name` is required. `email` and `url` are optional |
| `entry`      | string | Path to the per-player entry script (relative to the plugin root)    |

## Optional Fields

| Field                | Type     | Description                                                |
| -------------------- | -------- | ---------------------------------------------------------- |
| `globalEntry`        | string   | Path to the global entry script (runs once at IINA launch) |
| `description`        | string   | Short description shown in the plugin list                 |
| `preferencesPage`    | string   | Path to the preferences HTML page                          |
| `preferenceDefaults` | object   | Default values for preferences (key → value)               |
| `helpPage`           | string   | Path to a help page, or an external URL                    |
| `sidebarTab`         | object   | `{ "name": "Tab Title" }` — registers a sidebar tab        |
| `permissions`        | string[] | Required permissions array                                 |
| `allowedDomains`     | string[] | Domains allowed for network requests                       |
| `ghRepo`             | string   | GitHub `owner/repo` for auto-update                        |
| `ghVersion`          | number   | Increment to trigger auto-update for users                 |
| `subtitleProviders`  | object[] | `{ "id", "name" }` entries for IINA's subtitle search      |

The global entry path key is `globalEntry`. IINA does not read `"global":`.

`pnpm run validate` checks `Info.json` against `info.schema.json` and exits non-zero on failure.

## Permissions

| Value             | Enables                                                       |
| ----------------- | ------------------------------------------------------------- |
| `show-osd`        | `core.osd()` — Display OSD messages                           |
| `show-alert`      | `utils.ask()` and `utils.prompt()`. There is no `utils.alert` |
| `video-overlay`   | `overlay.*` — Draw on the video overlay                       |
| `network-request` | `http.*` and `ws.*` — HTTP, and a local WebSocket server      |
| `file-system`     | `file.*`, `utils.exec()` — File I/O and process execution     |

## Example: Minimal Plugin (entry only)

```json
{
  "name": "Simple OSD Plugin",
  "identifier": "com.example.simple-osd",
  "version": "1.0.0",
  "author": { "name": "Dev" },
  "entry": "dist/index.js",
  "permissions": ["show-osd"]
}
```

## Example: Full Plugin (overlay + sidebar + global entry)

```json
{
  "name": "Media Dashboard",
  "identifier": "com.example.media-dashboard",
  "version": "0.1.0",
  "description": "A comprehensive media dashboard for IINA.",
  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "url": "https://github.com/yourusername"
  },
  "entry": "dist/index.js",
  "globalEntry": "dist/global.js",
  "permissions": ["show-osd", "video-overlay", "network-request"],
  "allowedDomains": ["api.example.com"],
  "preferencesPage": "pref.html",
  "preferenceDefaults": {
    "auto_show_overlay": true,
    "api_key": ""
  },
  "sidebarTab": {
    "name": "Dashboard"
  },
  "ghRepo": "yourusername/media-dashboard",
  "ghVersion": 1
}
```

## Example: Subtitle Provider Plugin

```json
{
  "name": "My Subtitle Provider",
  "identifier": "com.example.subtitles",
  "version": "1.0.0",
  "author": { "name": "Dev" },
  "entry": "dist/index.js",
  "permissions": ["network-request"],
  "allowedDomains": ["api.opensubtitles.com"],
  "subtitleProviders": [{ "id": "my-subs", "name": "My Subtitles" }]
}
```

Register the same id from the player entry with `subtitle.registerProvider(id, provider)`.
