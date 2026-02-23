# Info.json Specification

Complete reference for the IINA plugin manifest file.

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

| Field        | Type   | Description                                                      |
| ------------ | ------ | ---------------------------------------------------------------- |
| `name`       | string | Display name in IINA's plugin list                               |
| `identifier` | string | Reverse-domain unique identifier (e.g., `com.example.my-plugin`) |
| `version`    | string | Semantic version string                                          |
| `author`     | object | `name` (required), `email` (optional), `url` (optional)          |
| `entry`      | string | Path to per-player entry script (relative to plugin root)        |

## Optional Fields

| Field                | Type     | Description                                            |
| -------------------- | -------- | ------------------------------------------------------ |
| `global`             | string   | Path to global entry script (runs once at IINA launch) |
| `description`        | string   | Short description shown in plugin list                 |
| `preferencesPage`    | string   | Path to preferences HTML page                          |
| `preferenceDefaults` | object   | Default values for preferences (key → value)           |
| `helpPage`           | string   | Path to help page HTML                                 |
| `sidebarTab`         | object   | `{ "name": "Tab Title" }` — registers a sidebar tab    |
| `permissions`        | string[] | Required permissions array                             |
| `allowedDomains`     | string[] | Domains allowed for network requests                   |
| `ghRepo`             | string   | GitHub `owner/repo` for auto-update                    |
| `ghVersion`          | number   | Increment to trigger auto-update for users             |
| `subtitleProviders`  | object[] | Subtitle provider registrations                        |

## Permissions

| Value             | Enables                                                   |
| ----------------- | --------------------------------------------------------- |
| `show-osd`        | `core.osd()` — Display OSD messages                       |
| `show-alert`      | `utils.ask()`, `utils.alert()`, `utils.prompt()`          |
| `video-overlay`   | `overlay.*` — Draw on the video overlay                   |
| `network-request` | `http.*`, `ws.*` — HTTP & WebSocket requests              |
| `file-system`     | `file.*`, `utils.exec()` — File I/O and process execution |

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

## Example: Full Plugin (overlay + sidebar + global)

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
  "global": "dist/global.js",
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
  "allowedDomains": ["api.opensubtitles.com"]
}
```
