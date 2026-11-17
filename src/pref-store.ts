/**
 * Typed access to IINA plugin preferences.
 * Defaults match `preferenceDefaults` in Info.json.
 */

import { parsePrefEntry, type PrefKey, type PrefType } from "./preferences";

const DEFAULTS: { [K in PrefKey]: PrefType<K> } = {
  example_enabled: true,
  example_text: "",
};

/** Read a preference, falling back to the built-in default when the stored value is unusable. */
export function readPref<K extends PrefKey>(key: K): PrefType<K> {
  const parsed = parsePrefEntry(key, iina.preferences.get(key));
  if (parsed !== undefined) {
    return parsed;
  }
  return DEFAULTS[key];
}

/** Persist a preference and flush it to disk. */
export function writePref(key: PrefKey, value: boolean | string): void {
  switch (key) {
    case "example_enabled":
      if (typeof value !== "boolean") {
        return;
      }
      iina.preferences.set(key, value);
      iina.preferences.sync();
      return;
    case "example_text":
      if (typeof value !== "string") {
        return;
      }
      iina.preferences.set(key, value);
      iina.preferences.sync();
      return;
    default: {
      const unreachable: never = key;
      return unreachable;
    }
  }
}
