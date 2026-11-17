# IINA Plugin API Reference

API reference for IINA plugin entry scripts. All APIs are accessed via the global `iina` object. Signatures follow `iina-plugin-definition` 0.99.3 (`iina/index.d.ts`).

## iina.core — Playback Control

```typescript
core.open(url: string): void
core.osd(message: string): void                 // needs show-osd
core.pause(): void
core.resume(): void
core.stop(): void
core.seek(seconds: number, exact: boolean): void // relative; negative seeks backward
core.seekTo(seconds: number): void              // absolute position in seconds
core.setSpeed(speed: number): void

// The starter sidebar sends an absolute position. The entry applies it with seekTo:
core.seekTo(position);

// Status (read-only) — core.status
core.status.paused: boolean
core.status.idle: boolean
core.status.position: number | null    // seconds
core.status.duration: number | null    // seconds
core.status.speed: number
core.status.videoWidth: number | null
core.status.videoHeight: number | null
core.status.isNetworkResource: boolean
core.status.url: string
core.status.title: string

// Window — core.window
core.window.loaded: boolean            // true once the player window exists
core.window.frame: Rect                // { x, y, width, height }
core.window.fullscreen: boolean
core.window.pip: boolean
core.window.ontop: boolean
```

`core.seek(seconds, exact)` jumps relative to the current position. `exact` selects an exact seek or the nearest keyframe. Absolute seeks are `core.seekTo`.

## iina.mpv — mpv Engine

```typescript
mpv.getFlag(name: string): boolean
mpv.getNumber(name: string): number
mpv.getString(name: string): string
mpv.getNative<T>(name: string): T
mpv.set(name: string, value: any): void
mpv.command(name: string, args: string[]): void
mpv.addHook(name: string, priority: number, callback: (next?: () => void) => void): void
```

Property changes are not a method on `mpv`. Listen with `event.on("mpv.<prop>.changed", fn)`.

Common properties: `time-pos`, `duration`, `pause`, `speed`, `volume`, `mute`, `playlist-count`, `playlist-pos`.

## iina.event — Event System

```typescript
event.on(event: string, callback: (...args: any[]) => void): string
event.off(event: string, id: string): void
```

`event.on` returns an id string. Pass that id to `event.off`. The TypeScript overloads accept the IINA events below and `mpv.${string}`.

```typescript
const id = event.on("mpv.pause.changed", () => {
  /* core.status.paused */
});
event.off("mpv.pause.changed", id);
```

### IINA Events

- `iina.window-loaded` — Player window is ready. `overlay.loadFile` and `sidebar.loadFile` belong here. If `core.window.loaded` is already true when the entry runs, load those pages immediately as well.
- `iina.window-size-adjusted` — callback `(frame: Rect) => void`
- `iina.window-moved` — callback `(frame: Rect) => void`
- `iina.window-resized` — callback `(frame: Rect) => void`
- `iina.window-fs.changed` — callback `(fullscreen: boolean) => void`
- `iina.window-screen.changed`
- `iina.window-miniaturized`
- `iina.window-deminiaturized`
- `iina.window-main.changed` — callback `(isMain: boolean) => void`
- `iina.window-will-close`
- `iina.window-did-close`
- `iina.music-mode.changed` — callback `(enabled: boolean) => void`
- `iina.pip.changed` — callback `(enabled: boolean) => void`
- `iina.file-loaded` — callback `(url: string) => void`
- `iina.file-started`
- `iina.mpv-inititalized` — spelled this way in the API
- `iina.thumbnails-ready`
- `iina.plugin-overlay-loaded` — this plugin's overlay webview finished loading. `overlay.setOpacity` and `overlay.show` belong here.

### mpv Events

Prefix mpv event names with `mpv.`. Property changes use the `.changed` suffix:

```typescript
event.on("mpv.time-pos.changed", () => {});
event.on("mpv.end-file", () => {});
```

## iina.overlay — Video Overlay

Needs `video-overlay`. The overlay stays hidden until `show()`. `show()` in the same turn as `loadFile` does not display it.

```typescript
function loadPlayerWebviews(): void {
  overlay.loadFile("dist/ui/overlay/index.html");
  sidebar.loadFile("dist/ui/sidebar/index.html");
}

event.on("iina.window-loaded", loadPlayerWebviews);
if (core.window.loaded) loadPlayerWebviews();

event.on("iina.plugin-overlay-loaded", () => {
  overlay.setOpacity(0.9);
  overlay.show();
});
```

```typescript
overlay.show(): void
overlay.hide(): void
overlay.setOpacity(opacity: number): void       // 0 to 1
overlay.setClickable(clickable: boolean): void  // hit targets need data-clickable
overlay.loadFile(path: string): void            // path relative to the plugin root
overlay.simpleMode(): void
overlay.setStyle(style: string): void           // simple mode only
overlay.setContent(content: string): void       // simple mode only
overlay.postMessage(name: string, data: any): void
overlay.onMessage(name: string, callback: (data: any) => void): void
```

## iina.sidebar — Sidebar Tab

Requires `sidebarTab` in `Info.json`. `loadFile` belongs in `iina.window-loaded` (same rule as the overlay).

```typescript
sidebar.show(): void
sidebar.hide(): void
sidebar.loadFile(path: string): void
sidebar.postMessage(name: string, data: any): void
sidebar.onMessage(name: string, callback: (data: any) => void): void
```

## iina.standaloneWindow — Standalone Window

The global entry loads the page when the menu opens the window. Do not load it from `iina.window-loaded`.

```typescript
standaloneWindow.open(): void
standaloneWindow.close(): void
standaloneWindow.loadFile(path: string): void
standaloneWindow.simpleMode(): void
standaloneWindow.setStyle(style: string): void
standaloneWindow.setContent(content: string): void
standaloneWindow.setProperty(props: {
  title?: string;
  resizable?: boolean;
  hudWindow?: boolean;
  fullSizeContentView?: boolean;
  hideTitleBar?: boolean;
}): void
standaloneWindow.setFrame(w?: number | null, h?: number | null, x?: number | null, y?: number | null): void
standaloneWindow.postMessage(name: string, data: any): void
standaloneWindow.onMessage(name: string, callback: (data: any) => void): void
```

Pass `null` to `setFrame` to keep the current value. Each entry (main and global) has its own window.

## iina.playlist — Playlist

`list` and `count` are methods. `PlaylistItem.title` from IINA is `string | null` (null for a normal local file; use `core.status.title` for the item that is playing).

```typescript
interface PlaylistItem {
  filename: string;
  title: string | null;
  isPlaying: boolean;
}

playlist.list(): PlaylistItem[]
playlist.count(): number
playlist.add(url: string, at?: number): PlaylistItem
playlist.remove(index: number): PlaylistItem
playlist.move(index: number, to: number): PlaylistItem
playlist.play(index: number): void
playlist.playNext(): void
playlist.playPrevious(): void
playlist.registerMenuBuilder(builder: (entries: PlaylistItem[]) => MenuItem[]): void
```

## iina.subtitle — Subtitle Provider

Declare providers in `Info.json` → `subtitleProviders` as `{ "id", "name" }`. Register the same id from the player entry.

```typescript
subtitle.CUSTOM_IMPLEMENTATION: string
subtitle.item<T>(
  data: T,
  desc?: (item: SubtitleItem<T>) => { name: string; left: string; right: string },
): SubtitleItem<T>

subtitle.registerProvider<T>(id: string, provider: SubtitleProvider<T>): void

interface SubtitleProvider<T> {
  search(): Promise<SubtitleItem<T>[]> | string; // or subtitle.CUSTOM_IMPLEMENTATION
  description?(): (item: SubtitleItem<T>) => { name: string; left: string; right: string };
  download(item: SubtitleItem<T>): Promise<string[]>;
}
```

`search` takes no query argument. Gather the current file from `core.status`.

## iina.http — HTTP Requests

Requires `network-request`.

```typescript
interface HTTPRequestOption<DataType = Record<string, any>> {
  params: Record<string, string>;
  headers: Record<string, string>;
  data: DataType;
}

interface HTTPResponse {
  text: string;
  data: any | null;
  statusCode: number;
  reason: string;
}

http.get(url: string, options: HTTPRequestOption): Promise<HTTPResponse>
http.post(url: string, options: HTTPRequestOption): Promise<HTTPResponse>
http.put(url: string, options: HTTPRequestOption): Promise<HTTPResponse>
http.patch(url: string, options: HTTPRequestOption): Promise<HTTPResponse>
http.delete(url: string, options: HTTPRequestOption): Promise<HTTPResponse>
http.xmlrpc(location: string): { call<T>(method: string, args: any[]): Promise<T> }
http.download(
  url: string,
  dest: string,
  options?: HTTPRequestOption & { method: string },
): Promise<undefined>
```

`download` destinations follow `file` path rules (`@data/`, `@tmp/`). A destination outside the plugin sandbox also needs `file-system`.

## iina.ws — Local WebSocket Server

Requires `network-request`. macOS 10.15 or later. This module hosts a local `ws://` server. TLS is not supported.

```typescript
ws.createServer(options: { port?: number }): void
ws.startServer(): void
ws.onStateUpdate(
  callback: (
    state: "setup" | "ready" | "waiting" | "failed" | "cancelled",
    error?: { message: string; description: string },
  ) => void,
): void
ws.onNewConnection(callback: (conn: string, info: { path: string }) => void): void
ws.onConnectionStateUpdate(
  callback: (
    conn: string,
    state: "setup" | "preparing" | "ready" | "waiting" | "failed" | "cancelled",
    error?: { message: string; description: string },
  ) => void,
): void
ws.onMessage(
  callback: (conn: string, message: { data: () => Uint8Array; text: () => string }) => void,
): void
ws.sendText(conn: string, text: string): Promise<"no_connection" | "success">
```

Register the state handlers before `startServer()`.

## iina.file — File System

Requires `file-system`.

Paths may use `@tmp/`, `@data/`, and `@video/:id`, `@audio/:id`, `@sub/:id` (`:id` is the track id).

```typescript
file.list(
  path: string,
  options: { includeSubDir?: boolean },
): { filename: string; path: string; isDir: boolean }[]
file.exists(path: string): boolean
file.write(path: string, content: string): void
file.read(path: string, options?: object): string | undefined
file.trash(path: string): void
file.delete(path: string): void
file.showInFinder(path: string): void
file.handle(path: string, mode: string): FileHandle // mode is "read" or "write"

// FileHandle
handle.offset(): number
handle.seekTo(offset: number): void
handle.seekToEnd(): void
handle.read(length: number): Uint8Array | undefined
handle.readToEnd(): Uint8Array | undefined
handle.write(data: string | Uint8Array | number[]): void
handle.close(): void
```

## iina.utils — Utilities

```typescript
utils.ask(title: string): boolean
// Synchronous. true if the user clicks OK, false for Cancel. Needs show-alert.

utils.prompt(title: string): string | undefined
// Synchronous. Needs show-alert.

utils.open(url: string): boolean
// http(s) opens in the browser. A file path is revealed in Finder.

utils.exec(
  file: string,
  args: string[],
  cwd?: string | null,
  stdoutHook?: ((data: string) => void) | null,
  stderrHook?: ((data: string) => void) | null,
): Promise<{ status: number; stdout: string; stderr: string }>
// Needs file-system.

utils.fileInPath(file: string): boolean
utils.resolvePath(path: string): string
utils.chooseFile(
  title: string,
  options: { chooseDir?: boolean; allowedFileTypes?: string[] },
): string
utils.keyChainWrite(service: string, name: string, password: string): boolean
utils.keyChainRead(service: string, name: string): string | false
```

`show-alert` covers `ask` and `prompt`. `ask` returns a boolean directly; it is not a promise.

## iina.menu — Plugin Menu

Create an item, then add that item. The main entry and the global entry keep separate menus.

```typescript
menu.item(
  title: string,
  action?: (() => void) | null,
  options?: { enabled?: boolean; selected?: boolean; keyBinding?: string },
): MenuItem
menu.separator(): MenuItem
menu.addItem(item: MenuItem): void
menu.items(): MenuItem[]
menu.removeAt(index: number): void
menu.removeAllItems(): void
menu.forceUpdate(): void
```

```typescript
// Global entry: load the standalone page when the menu opens it.
const dashboardItem = menu.item("Show Plugin Dashboard", () => {
  standaloneWindow.open();
  standaloneWindow.loadFile("dist/ui/standalone/index.html");
  standaloneWindow.setFrame(800, 500);
});
menu.addItem(dashboardItem);
```

`MenuItem` has `title`, `selected`, `enabled`, `action`, and `addSubMenuItem(item)`.

## iina.input — Input Events

Listeners return `true` to stop propagation. The returned string is the listener id. Prefer `menu` for shortcuts. Avoid `PRIORITY_HIGH` unless the listener must run before mpv key bindings.

```typescript
input.MOUSE: string
input.RIGHT_MOUSE: string
input.OTHER_MOUSE: string
input.PRIORITY_LOW: number
input.PRIORITY_HIGH: number

input.normalizeKeyCode(code: string): string
input.getAllKeyBindings(): Record<string, { key: string; action: string; isIINACommand: string }>

input.onKeyDown(
  button: string,
  callback: (data: { x: number; y: number; isRepeat: boolean }) => boolean,
  priority?: number,
): string
input.onKeyUp(
  button: string,
  callback: (data: { x: number; y: number; isRepeat: boolean }) => boolean,
  priority?: number,
): string
input.onMouseDown(
  button: string,
  callback: (data: { x: number; y: number }) => boolean,
  priority?: number,
): string
input.onMouseUp(
  button: string,
  callback: (data: { x: number; y: number }) => boolean,
  priority?: number,
): string
input.onMouseDrag(
  button: string,
  callback: (data: { x: number; y: number }) => boolean,
  priority?: number,
): string
```

`onMouseDown` / `onMouseUp` take `input.MOUSE`, `input.RIGHT_MOUSE`, or `input.OTHER_MOUSE`. `onMouseDrag` is the left button only.

## iina.preferences — Plugin Preferences

Defaults live in `Info.json` → `preferenceDefaults`.

```typescript
preferences.get(key: string): any
preferences.set(key: string, value: any): void
preferences.sync(): void
```

Call `sync()` after a programmatic `set`. Otherwise values are written when the preferences page closes.

## iina.console — Logging

```typescript
console.log(...message: any[]): void
console.warn(message: any): void
console.error(message: any): void
```

View logs in IINA → Window → Log Viewer. Entry scripts use `iina.console`, not the DOM `console`.

## iina.global — Cross-Player Messaging

Available in both entries when the plugin has a `globalEntry`. `createPlayerInstance` and the three-argument `postMessage` are global-entry only. `getLabel` and the two-argument `postMessage` are main-entry only.

```typescript
// Global entry.
// null: players created with createPlayerInstance (not ordinary user windows).
// number: the id createPlayerInstance returned.
// string: the player argument from onMessage; pass that string back unchanged.
global.postMessage(target: null | number | string, name: string, data: any): void

// Main entry → global entry.
global.postMessage(name: string, data: any): void

global.onMessage(name: string, callback: (data: any, player?: string) => void): void

// Global entry only. Returns the new player's id.
global.createPlayerInstance(options: {
  disableWindowAnimation?: boolean;
  disableUI?: boolean;
  enablePlugins?: boolean;
  label?: string;
  url?: string;
}): number

// Main entry only. The custom label from createPlayerInstance, not the onMessage player string.
global.getLabel(): string
```

On the global entry, `player` is set when a player sent the message. Reply with `postMessage(player, name, data)`.
