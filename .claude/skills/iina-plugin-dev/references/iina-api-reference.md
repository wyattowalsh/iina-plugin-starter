# IINA Plugin API Reference

Complete API reference for IINA plugin entry scripts. All APIs are accessed via the global `iina` object.

## iina.core — Playback Control

```typescript
core.open(url: string): void                    // Open a URL or file path
core.osd(message: string): void                  // Show OSD text (needs show-osd)
core.pause(): void                               // Pause playback
core.resume(): void                              // Resume playback
core.togglePause(): void                         // Toggle pause/resume
core.seek(seconds: number, exact?: boolean): void // Seek to position
core.stop(): void                                // Stop playback

// Status (read-only)
core.status.title: string
core.status.url: string
core.status.position: number     // Current position in seconds
core.status.duration: number     // Total duration in seconds
core.status.paused: boolean
core.status.speed: number
core.status.isIdle: boolean
core.status.isNetworkResource: boolean
core.status.videoWidth: number
core.status.videoHeight: number
```

## iina.mpv — mpv Engine

```typescript
mpv.getNumber(property: string): number | null
mpv.getString(property: string): string | null
mpv.getFlag(property: string): boolean | null
mpv.set(property: string, value: any): void
mpv.command(command: string, args?: string[]): void

// Observe property changes (event-driven, preferred over polling)
mpv.observe(property: string, callback: () => void): void
```

Common properties: `time-pos`, `duration`, `pause`, `speed`, `volume`, `mute`, `video-params/w`, `video-params/h`, `playlist-count`, `playlist-pos`

## iina.event — Event System

```typescript
event.on(name: string, callback: (...args: any[]) => void): void
event.off(name: string, callback: (...args: any[]) => void): void
```

### IINA Events

- `iina.file-loaded` — A file has been loaded
- `iina.file-started` — Playback has started
- `iina.file-ended` — Playback has ended
- `iina.window-loaded` — Player window is ready
- `iina.window-will-close` — Player window is closing
- `iina.window-moved` — Player window was repositioned
- `iina.window-resized` — Player window was resized
- `iina.pip.changed` — Picture-in-Picture state changed
- `iina.music-mode.changed` — Music mode state changed
- `iina.fullscreen.changed` — Fullscreen state changed

### mpv Events

Use `mpv.observe()` for property changes instead of events.

## iina.overlay — Video Overlay

```typescript
overlay.loadFile(path: string): void          // Load HTML into overlay
overlay.show(): void                           // Show overlay
overlay.hide(): void                           // Hide overlay
overlay.setOpacity(opacity: number): void      // 0.0 to 1.0
overlay.setClickable(clickable: boolean): void // Allow mouse events

// Simple mode (no HTML file needed)
overlay.simpleMode(): void
overlay.setContent(html: string): void
overlay.setStyle(css: string): void

// Messaging
overlay.postMessage(name: string, data?: any): void
overlay.onMessage(name: string, callback: (data: any) => void): void
```

## iina.sidebar — Sidebar Tab

```typescript
sidebar.loadFile(path: string): void
sidebar.show(): void
sidebar.hide(): void
sidebar.postMessage(name: string, data?: any): void
sidebar.onMessage(name: string, callback: (data: any) => void): void
```

## iina.standaloneWindow — Standalone Window

```typescript
standaloneWindow.open(): void
standaloneWindow.loadFile(path: string): void
standaloneWindow.close(): void
standaloneWindow.setFrame(width: number, height: number): void
standaloneWindow.postMessage(name: string, data?: any): void
standaloneWindow.onMessage(name: string, callback: (data: any) => void): void
```

## iina.playlist — Playlist

```typescript
playlist.count: number
playlist.items: PlaylistItem[]
playlist.play(index: number): void
playlist.add(url: string): void
playlist.remove(index: number): void
playlist.move(from: number, to: number): void
```

## iina.subtitle — Subtitle Provider

```typescript
subtitle.registerProvider(provider: {
  search(query: SubtitleSearchQuery): Promise<SubtitleResult[]>,
  download(result: SubtitleResult): Promise<string>
}): void
```

## iina.http — HTTP Requests

Requires `network-request` permission.

```typescript
http.get(url: string): Promise<HTTPResponse>
http.post(url: string, body?: string): Promise<HTTPResponse>
http.request(options: HTTPRequestOptions): Promise<HTTPResponse>
```

## iina.ws — WebSocket

Requires `network-request` permission.

```typescript
ws.connect(url: string): WebSocketConnection
connection.send(data: string): void
connection.onMessage(callback: (data: string) => void): void
connection.close(): void
```

## iina.file — File System

Requires `file-system` permission.

```typescript
file.read(path: string, options?: { encoding: string }): string
file.write(path: string, content: string): void
file.exists(path: string): boolean
file.trash(path: string): void
file.list(path: string): string[]
```

## iina.utils — Utilities

```typescript
utils.ask(title: string, options: string[]): Promise<number>  // needs show-alert
utils.alert(message: string): void                             // needs show-alert
utils.prompt(title: string, defaultValue?: string): Promise<string>
utils.open(url: string): void  // Open URL in default browser
utils.exec(command: string, args?: string[]): Promise<string>  // needs file-system
```

## iina.menu — Plugin Menu

```typescript
menu.addItem(title: string, action: () => void): void
```

## iina.input — Input Events

```typescript
input.onKeyDown(key: string, callback: (event: InputEvent) => void): void
input.onKeyUp(key: string, callback: (event: InputEvent) => void): void
input.onMouseDown(callback: (event: MouseEvent) => void): void
input.onMouseUp(callback: (event: MouseEvent) => void): void
input.onScroll(callback: (event: ScrollEvent) => void): void
```

## iina.preferences — Plugin Preferences

```typescript
preferences.get(key: string): any
preferences.set(key: string, value: any): void
```

Preferences must have default values defined in `Info.json` → `preferenceDefaults`.

## iina.console — Logging

```typescript
console.log(message: string): void
console.warn(message: string): void
console.error(message: string): void
```

View logs in IINA → Window → Log Viewer.

## iina.global — Global Entry Only

Available only in `global.ts`:

```typescript
global.postMessage(playerID: string, name: string, data?: any): void
global.onMessage(name: string, callback: (data: any, playerID: string) => void): void
```
