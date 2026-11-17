/**
 * Display titles for playlist rows.
 * IINA's playlist items keep `title: null` for ordinary files; webviews receive a string.
 */

import type { PlaylistItem } from "./types";

/**
 * Full-string URL match. Authority is optional so `scheme:path` still counts.
 * Same shape as the contract: ^(([^:/?#]+):)(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?
 */
const URL_PATTERN = /^(([^:/?#]+):)(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/;

/**
 * Prefer a non-empty title, including whitespace.
 * `null` and `""` fall back to the filename: the whole string when it is a URL,
 * otherwise the substring after the last `/`, or "Untitled" when that is empty.
 */
export function displayTitle(filename: string, title: string | null): string {
  if (title !== null && title !== "") {
    return title;
  }
  if (URL_PATTERN.test(filename)) {
    return filename;
  }
  const slash = filename.lastIndexOf("/");
  const base = slash < 0 ? filename : filename.slice(slash + 1);
  if (base === "") {
    return "Untitled";
  }
  return base;
}

/** Map raw playlist rows to webview items. `isCurrent` is intentionally dropped. */
export function toDisplayItems(
  items: readonly {
    filename: string;
    title: string | null;
    isPlaying: boolean;
  }[],
): PlaylistItem[] {
  return items.map((item) => ({
    filename: item.filename,
    title: displayTitle(item.filename, item.title),
    isPlaying: item.isPlaying,
  }));
}
