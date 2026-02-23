import { useCallback } from "react";
import { usePluginStatus } from "../hooks";
import { sendToPlugin } from "../bridge";
import { formatTime } from "../utils";

/**
 * Sidebar Panel — interactive controls displayed in IINA's sidebar tab.
 *
 * Features: play/pause toggle, seek slider, volume control, speed selector.
 * Receives real-time status updates via event-driven bridge messaging.
 */
export function App() {
  const status = usePluginStatus();

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    sendToPlugin("seek", { position: Number(e.target.value) });
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    sendToPlugin("set-volume", { volume: Number(e.target.value) });
  }, []);

  const handleSpeed = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    sendToPlugin("set-speed", { speed: Number(e.target.value) });
  }, []);

  if (!status) {
    return <div style={styles.loading}>Waiting for playback…</div>;
  }

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
        <div style={styles.sectionTitle}>Position</div>
        <input
          type="range"
          min={0}
          max={Math.floor(status.duration)}
          value={Math.floor(status.position)}
          onChange={handleSeek}
          style={styles.slider}
        />
      </section>

      {/* Volume */}
      <section style={styles.section}>
        <div style={styles.row}>
          <span style={styles.sectionTitle}>Volume</span>
          <span style={styles.value}>{Math.round(status.volume)}%</span>
        </div>
        <input
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
          <span style={styles.sectionTitle}>Speed</span>
          <select value={status.speed} onChange={handleSpeed} style={styles.select}>
            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </div>
      </section>
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
};
