import { useCallback, useMemo } from "react";
import { usePluginStatus } from "../hooks";
import { getPreference, setPreference } from "../bridge";
import { formatTime, debounce } from "../utils";
import { useEffect, useState } from "react";

/**
 * Standalone Dashboard — a full window opened from the Plugin menu.
 *
 * Demonstrates a richer UI than overlay/sidebar: stat cards,
 * preference management, and a settings panel.
 */
export function App() {
  const status = usePluginStatus();
  const [enabled, setEnabled] = useState(true);
  const [customText, setCustomText] = useState("");

  // Debounce preference writes to avoid excessive I/O on every keystroke.
  const debouncedSetPref = useMemo(
    () => debounce((key: "example_text", value: string) => setPreference(key, value), 400),
    [],
  );

  useEffect(() => {
    // Load preferences
    getPreference("example_enabled").then(setEnabled);
    getPreference("example_text").then((v) => setCustomText(v ?? ""));
  }, []);

  const handleToggleEnabled = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    setPreference("example_enabled", next);
  }, [enabled]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomText(e.target.value);
      debouncedSetPref("example_text", e.target.value);
    },
    [debouncedSetPref],
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Plugin Dashboard</h1>

      {/* Stat Cards */}
      <div style={styles.grid}>
        <StatCard
          label="Status"
          value={status?.paused ? "Paused" : "Playing"}
          color={status?.paused ? "var(--orange)" : "var(--green)"}
        />
        <StatCard label="Position" value={status ? formatTime(status.position) : "--:--"} />
        <StatCard label="Duration" value={status ? formatTime(status.duration) : "--:--"} />
        <StatCard label="Speed" value={status ? `${status.speed}×` : "--"} />
        <StatCard label="Volume" value={status ? `${Math.round(status.volume)}%` : "--"} />
      </div>

      {/* Now Playing */}
      {status && (
        <section style={styles.card}>
          <div style={styles.cardTitle}>Now Playing</div>
          <div style={styles.nowPlaying}>{status.title}</div>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressBar,
                width: status.duration > 0 ? `${(status.position / status.duration) * 100}%` : "0%",
              }}
            />
          </div>
          <div style={styles.timeRow}>
            <span>{formatTime(status.position)}</span>
            <span>{formatTime(status.duration)}</span>
          </div>
        </section>
      )}

      {/* Settings */}
      <section style={styles.card}>
        <div style={styles.cardTitle}>Plugin Settings</div>
        <div style={styles.settingRow}>
          <label style={styles.label}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleToggleEnabled}
              style={styles.checkbox}
            />
            Enable plugin features
          </label>
        </div>
        <div style={styles.settingRow}>
          <label style={styles.label}>Custom overlay text</label>
          <input
            type="text"
            value={customText}
            onChange={handleTextChange}
            placeholder="Enter custom text…"
            style={styles.textInput}
          />
        </div>
      </section>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color: color ?? "var(--text)" }}>{value}</div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    maxWidth: 720,
    margin: "0 auto",
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 20,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "12px 14px",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    color: "var(--text-secondary)",
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    marginTop: 4,
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    color: "var(--text-secondary)",
    marginBottom: 10,
  },
  nowPlaying: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    background: "var(--border)",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
    background: "var(--accent)",
    transition: "width 0.3s ease",
  },
  timeRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: "var(--text-secondary)",
    marginTop: 6,
  },
  settingRow: {
    padding: "8px 0",
    borderBottom: "1px solid var(--border)",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    cursor: "pointer",
  },
  checkbox: {
    accentColor: "var(--accent)",
  },
  textInput: {
    marginTop: 6,
    width: "100%",
    padding: "6px 10px",
    fontSize: 13,
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
  },
};
