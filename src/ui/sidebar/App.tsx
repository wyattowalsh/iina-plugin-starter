import { useCallback, useEffect, useRef, useState } from "react";
import { usePluginMessage, usePluginStatus } from "../hooks";
import { sendToPlugin } from "../bridge";
import { formatTime } from "../utils";

const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/** Preset steps, plus the live speed when it is not already one of them. */
function matchingSpeed(current: number): number | undefined {
  return SPEED_STEPS.find((step) => Math.abs(step - current) < 0.001);
}

function speedChoices(current: number): number[] {
  if (!Number.isFinite(current) || matchingSpeed(current) !== undefined) {
    return SPEED_STEPS;
  }
  return [...SPEED_STEPS, current].sort((a, b) => a - b);
}

/**
 * Sidebar Panel — interactive controls displayed in IINA's sidebar tab.
 *
 * Features: play/pause toggle, seek slider, volume control, speed selector.
 * Receives real-time status updates via event-driven bridge messaging.
 */
function useCommittedSlider(commit: (value: number) => void) {
  const draggingRef = useRef(false);
  const valueRef = useRef<number | null>(null);
  const [draft, setDraft] = useState<number | null>(null);

  const finish = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const value = valueRef.current;
    valueRef.current = null;
    setDraft(null);
    if (value !== null && Number.isFinite(value)) commit(value);
  }, [commit]);

  useEffect(() => {
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [finish]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLInputElement>) => {
    const value = Number(event.currentTarget.value);
    draggingRef.current = true;
    valueRef.current = value;
    setDraft(value);
  }, []);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      if (draggingRef.current) {
        valueRef.current = value;
        setDraft(value);
        return;
      }
      commit(value);
    },
    [commit],
  );

  return { draft, onPointerDown, onChange };
}

export function App() {
  const playlist = usePluginMessage("playlist-update", []);
  const status = usePluginStatus();
  const commitSeek = useCallback((position: number) => {
    if (Number.isFinite(position)) sendToPlugin("seek", { position });
  }, []);
  const commitVolume = useCallback((volume: number) => {
    if (Number.isFinite(volume)) sendToPlugin("set-volume", { volume });
  }, []);
  const seek = useCommittedSlider(commitSeek);
  const volume = useCommittedSlider(commitVolume);

  const handleSpeed = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    sendToPlugin("set-speed", { speed: Number(event.target.value) });
  }, []);

  if (!status) {
    return <div style={styles.loading}>Waiting for playback…</div>;
  }

  const speeds = speedChoices(status.speed);
  const speedValue = matchingSpeed(status.speed) ?? status.speed;
  const shownPosition = seek.draft ?? status.position;
  const volumeMax = status.volumeMax > 0 ? status.volumeMax : 100;
  const shownVolume = Math.min(volumeMax, Math.max(0, volume.draft ?? status.volume));

  return (
    <div style={styles.container}>
      {/* Now Playing */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Now Playing</div>
        <div style={styles.title}>{status.title}</div>
        <div style={styles.meta}>
          {formatTime(shownPosition)} / {formatTime(status.duration)}
        </div>
      </section>

      {/* Transport Controls */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Controls</div>
        <button type="button" onClick={() => sendToPlugin("toggle-pause")} style={styles.button}>
          {status.paused ? "▶ Play" : "⏸ Pause"}
        </button>
      </section>

      {/* Seek */}
      <section style={styles.section}>
        <label htmlFor="position" style={{ ...styles.sectionTitle, display: "block" }}>
          Position
        </label>
        <input
          id="position"
          type="range"
          min={0}
          max={Math.max(0, Math.floor(status.duration))}
          value={Math.min(
            seek.draft ?? Math.floor(status.position),
            Math.max(0, Math.floor(status.duration)),
          )}
          onPointerDown={seek.onPointerDown}
          onChange={seek.onChange}
          style={styles.slider}
        />
      </section>

      {/* Volume */}
      <section style={styles.section}>
        <div style={styles.row}>
          <label htmlFor="volume" style={styles.sectionTitle}>
            Volume
          </label>
          <span style={styles.value}>{Math.round(shownVolume)}%</span>
        </div>
        <input
          id="volume"
          type="range"
          min={0}
          max={volumeMax}
          value={Math.round(shownVolume)}
          onPointerDown={volume.onPointerDown}
          onChange={volume.onChange}
          style={styles.slider}
        />
      </section>

      {/* Speed */}
      <section style={styles.section}>
        <div style={styles.row}>
          <label htmlFor="speed" style={styles.sectionTitle}>
            Speed
          </label>
          <select id="speed" value={speedValue} onChange={handleSpeed} style={styles.select}>
            {speeds.map((step) => (
              <option key={step} value={step}>
                {step}×
              </option>
            ))}
          </select>
        </div>
      </section>

      {playlist.length > 0 && (
        <section style={styles.section} aria-label="Playlist">
          <div style={styles.sectionTitle}>Playlist</div>
          <ol style={styles.playlist}>
            {playlist.map((item, index) => (
              <li key={`${item.filename}:${index}`} style={styles.playlistItem}>
                <button
                  type="button"
                  style={{
                    ...styles.playlistButton,
                    fontWeight: item.isPlaying ? 600 : 400,
                  }}
                  aria-current={item.isPlaying ? "true" : undefined}
                  onClick={() => sendToPlugin("play-playlist-item", { index })}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  loading: {
    padding: 16,
    color: "var(--text-secondary)",
    textAlign: "center",
  },
  section: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  meta: {
    fontSize: 12,
    color: "var(--text-secondary)",
    marginTop: 2,
  },
  button: {
    width: "100%",
    padding: "8px 0",
    border: "none",
    borderRadius: 6,
    background: "var(--accent)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  slider: {
    width: "100%",
    margin: "4px 0",
    accentColor: "var(--accent)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  value: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-secondary)",
  },
  select: {
    fontSize: 12,
    padding: "2px 4px",
    borderRadius: 4,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
  },
  playlist: {
    margin: 0,
    paddingLeft: 18,
  },
  playlistItem: {
    fontSize: 12,
    marginTop: 4,
  },
  playlistButton: {
    display: "block",
    width: "100%",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "inherit",
    font: "inherit",
    textAlign: "left",
    cursor: "pointer",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
