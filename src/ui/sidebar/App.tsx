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
export function App() {
  const playlist = usePluginMessage("playlist-update", []);
  const status = usePluginStatus();
  const sliderRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);
  const seekValueRef = useRef<number | null>(null);
  const recentSeekRef = useRef<{ position: number; at: number } | null>(null);
  const [seekDraft, setSeekDraft] = useState<number | null>(null);

  const rememberSeek = useCallback((position: number) => {
    seekValueRef.current = position;
    setSeekDraft(position);
  }, []);

  const emitSeek = useCallback((position: number) => {
    if (!Number.isFinite(position)) return;
    const now = Date.now();
    const recent = recentSeekRef.current;
    if (recent && recent.position === position && now - recent.at < 50) return;
    recentSeekRef.current = { position, at: now };
    sendToPlugin("seek", { position });
  }, []);

  const finishSeekDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const tracked = seekValueRef.current;
    const fromDom = sliderRef.current ? Number(sliderRef.current.value) : Number.NaN;
    const position = tracked !== null && Number.isFinite(tracked) ? tracked : fromDom;
    seekValueRef.current = null;
    setSeekDraft(null);
    if (Number.isFinite(position)) emitSeek(position);
  }, [emitSeek]);

  useEffect(() => {
    window.addEventListener("pointerup", finishSeekDrag);
    window.addEventListener("pointercancel", finishSeekDrag);
    return () => {
      window.removeEventListener("pointerup", finishSeekDrag);
      window.removeEventListener("pointercancel", finishSeekDrag);
    };
  }, [finishSeekDrag]);

  const handleSeekPointerDown = useCallback(
    (event: React.PointerEvent<HTMLInputElement>) => {
      draggingRef.current = true;
      rememberSeek(Number(event.currentTarget.value));
    },
    [rememberSeek],
  );

  const handleSeekChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const position = Number(event.target.value);
      if (draggingRef.current) {
        rememberSeek(position);
        return;
      }
      emitSeek(position);
    },
    [emitSeek, rememberSeek],
  );

  const handleVolume = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    sendToPlugin("set-volume", { volume: Number(event.target.value) });
  }, []);

  const handleSpeed = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    sendToPlugin("set-speed", { speed: Number(event.target.value) });
  }, []);

  if (!status) {
    return <div style={styles.loading}>Waiting for playback…</div>;
  }

  const speeds = speedChoices(status.speed);
  const speedValue = matchingSpeed(status.speed) ?? status.speed;

  return (
    <div style={styles.container}>
      {/* Now Playing */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Now Playing</div>
        <div style={styles.title}>{status.title}</div>
        <div style={styles.meta}>
          {formatTime(status.position)} / {formatTime(status.duration)}
        </div>
      </section>

      {/* Transport Controls */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Controls</div>
        <button onClick={() => sendToPlugin("toggle-pause")} style={styles.button}>
          {status.paused ? "▶ Play" : "⏸ Pause"}
        </button>
      </section>

      {/* Seek */}
      <section style={styles.section}>
        <label htmlFor="position" style={{ ...styles.sectionTitle, display: "block" }}>
          Position
        </label>
        <input
          ref={sliderRef}
          id="position"
          type="range"
          min={0}
          max={Math.floor(status.duration)}
          value={seekDraft ?? Math.floor(status.position)}
          onPointerDown={handleSeekPointerDown}
          onChange={handleSeekChange}
          style={styles.slider}
        />
      </section>

      {/* Volume */}
      <section style={styles.section}>
        <div style={styles.row}>
          <label htmlFor="volume" style={styles.sectionTitle}>
            Volume
          </label>
          <span style={styles.value}>{Math.round(status.volume)}%</span>
        </div>
        <input
          id="volume"
          type="range"
          min={0}
          max={150}
          value={Math.round(status.volume)}
          onChange={handleVolume}
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
              <li
                key={`${item.filename}:${index}`}
                style={{
                  ...styles.playlistItem,
                  fontWeight: item.isPlaying ? 600 : 400,
                }}
                aria-current={item.isPlaying ? "true" : undefined}
              >
                {item.title}
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
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
