/**
 * Typed preference keys — single source of truth for plugin preferences.
 *
 * Must match the `preferenceDefaults` in Info.json.
 * Import `PrefKey` / `PrefValue` in bridge.ts and UI code for compile-time safety.
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
