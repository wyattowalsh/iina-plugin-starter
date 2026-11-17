/**
 * Node-only mock of the IINA entry global.
 * Installed on globalThis.iina. Never assigns window.iina.
 */
import { vi } from "vitest";

type MessageHandler = (data: unknown) => void;
type GlobalHandler = (data: unknown, playerId?: string) => void;
type EventHandler = (...args: unknown[]) => void;

export interface EntryPlaylistItem {
  filename: string;
  title: string | null;
  isPlaying: boolean;
  isCurrent: boolean;
}

function createWebview() {
  const handlers = new Map<string, MessageHandler[]>();
  return {
    loadFile: vi.fn(),
    setOpacity: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    postMessage: vi.fn(),
    onMessage: vi.fn((name: string, handler: MessageHandler) => {
      const list = handlers.get(name);
      if (list) list.push(handler);
      else handlers.set(name, [handler]);
    }),
    emit(name: string, data?: unknown) {
      const list = handlers.get(name);
      if (!list) return;
      for (const handler of [...list]) handler(data);
    },
  };
}

function createEvent() {
  const handlers = new Map<string, EventHandler[]>();
  const byId = new Map<string, { name: string; handler: EventHandler }>();
  let nextId = 0;

  return {
    on: vi.fn((name: string, callback: EventHandler) => {
      const id = String(++nextId);
      const list = handlers.get(name);
      if (list) list.push(callback);
      else handlers.set(name, [callback]);
      byId.set(id, { name, handler: callback });
      return id;
    }),
    off: vi.fn((name: string, id: string) => {
      const record = byId.get(id);
      if (!record || record.name !== name) return;
      byId.delete(id);
      const list = handlers.get(name);
      if (!list) return;
      const index = list.indexOf(record.handler);
      if (index >= 0) list.splice(index, 1);
    }),
    emit(name: string, ...args: unknown[]) {
      const list = handlers.get(name);
      if (!list) return;
      for (const handler of [...list]) handler(...args);
    },
  };
}

function createGlobalApi() {
  const handlers = new Map<string, GlobalHandler[]>();
  return {
    postMessage: vi.fn(),
    onMessage: vi.fn((name: string, handler: GlobalHandler) => {
      const list = handlers.get(name);
      if (list) list.push(handler);
      else handlers.set(name, [handler]);
    }),
    emit(name: string, data: unknown, playerId?: string) {
      const list = handlers.get(name);
      if (!list) return;
      for (const handler of [...list]) handler(data, playerId);
    },
  };
}

export function createEntryMock() {
  const preferenceMap = new Map<string, unknown>([
    ["example_enabled", true],
    ["example_text", ""],
  ]);

  const core = {
    status: {
      title: "Test Video.mp4",
      position: 42.5,
      duration: 120,
      paused: false,
      url: "file:///test.mp4",
      idle: false,
    },
    window: {
      loaded: false,
    },
    pause: vi.fn(),
    resume: vi.fn(),
    seek: vi.fn(),
    seekTo: vi.fn(),
    osd: vi.fn(),
  };

  const event = createEvent();
  const emitEvent = event.emit;
  event.emit = (name: string, ...args: unknown[]) => {
    if (name === "iina.window-loaded") core.window.loaded = true;
    emitEvent(name, ...args);
  };

  return {
    core,
    mpv: {
      getNumber: vi.fn((prop: string): number | undefined => {
        if (prop === "speed") return 1;
        if (prop === "volume") return 100;
        return undefined;
      }),
      set: vi.fn(),
    },
    event,
    overlay: createWebview(),
    sidebar: createWebview(),
    standaloneWindow: {
      ...createWebview(),
      open: vi.fn(),
      close: vi.fn(),
      setFrame: vi.fn(),
    },
    preferences: {
      map: preferenceMap,
      get(key: string) {
        return preferenceMap.get(key);
      },
      set(key: string, value: unknown) {
        preferenceMap.set(key, value);
      },
      sync: vi.fn(),
    },
    playlist: {
      list: vi.fn((): EntryPlaylistItem[] => []),
      count: vi.fn((): number => 0),
      play: vi.fn(),
    },
    menu: {
      item: vi.fn((title: string, action: () => void) => ({ title, action })),
      addItem: vi.fn(),
    },
    global: createGlobalApi(),
    console: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
}

export type EntryMock = ReturnType<typeof createEntryMock>;

export function installEntryMock(): EntryMock {
  const mock = createEntryMock();
  (globalThis as unknown as { iina: EntryMock }).iina = mock;
  return mock;
}

installEntryMock();
