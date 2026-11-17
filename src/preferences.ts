/**
 * Typed preference keys — single source of truth for plugin preferences.
 *
 * Must match the `preferenceDefaults` in Info.json.
 * Import `PrefKey` / `PrefType` in bridge.ts and UI code for compile-time safety.
 */

/** Map of preference keys to their TypeScript types. */
export interface PrefMap {
  example_enabled: boolean;
  example_text: string;
}

/** Valid preference key names. */
export type PrefKey = keyof PrefMap;

/** Inferred type for a given preference key. */
export type PrefType<K extends PrefKey> = PrefMap[K];

/** Every preference key. Runtime checks should use this list, not a hand-written string. */
export const PREF_KEYS = ["example_enabled", "example_text"] as const satisfies readonly PrefKey[];

/** True when `key` is one of {@link PREF_KEYS}. */
export function isPrefKey(key: unknown): key is PrefKey {
  return typeof key === "string" && PREF_KEYS.some((candidate) => candidate === key);
}

/**
 * Parse a raw preference value for `key`.
 * Returns `undefined` when `value` is not the type stored for that key.
 */
export function parsePrefEntry<K extends PrefKey>(key: K, value: unknown): PrefType<K> | undefined {
  switch (key) {
    case "example_enabled":
      return (typeof value === "boolean" ? value : undefined) as PrefType<K> | undefined;
    case "example_text":
      return (typeof value === "string" ? value : undefined) as PrefType<K> | undefined;
    default: {
      const unreachable: never = key;
      return unreachable;
    }
  }
}
