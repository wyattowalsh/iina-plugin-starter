import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePluginStatus } from "../hooks";
import { setPreference } from "../bridge";
import { debounce, formatTime } from "../utils";
import type { PlayerStatus } from "../../types";

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
  const pendingEnabled = useRef<boolean | null>(null);
  const pendingText = useRef<string | null>(null);
  const customTextFocused = useRef(false);

  useEffect(() => {
    if (!status) return;

    if (pendingEnabled.current !== null) {
      if (status.enabled === pendingEnabled.current) pendingEnabled.current = null;
    } else {
      setEnabled(status.enabled);
    }

    if (customTextFocused.current) return;

    if (pendingText.current !== null) {
      if (status.customText !== pendingText.current) return;
      pendingText.current = null;
    }

    setCustomText(status.customText);
  }, [status]);

  const writeCustomText = useMemo(
    () =>
      debounce((value: string) => {
        setPreference("example_text", value);
      }, 400),
    [],
  );

  const handleToggleEnabled = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.checked;
    setEnabled(next);
    pendingEnabled.current = next;
    setPreference("example_enabled", next);
  }, []);

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setCustomText(value);
      pendingText.current = value;
      writeCustomText(value);
    },
    [writeCustomText],
  );

  const handleCustomTextFocus = useCallback(() => {
    customTextFocused.current = true;
  }, []);

  const handleCustomTextBlur = useCallback(() => {
    customTextFocused.current = false;
  }, []);

  const playback = playbackSummary(status);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Plugin Dashboard</h1>

      {/* Stat Cards */}
      <div style={styles.grid}>
        <StatCard label="Status" value={playback.value} color={playback.color} />
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
          <label htmlFor="custom-overlay-text" style={styles.label}>
            Custom overlay text
          </label>
          <input
            id="custom-overlay-text"
            type="text"
            value={customText}
            onChange={handleTextChange}
            onFocus={handleCustomTextFocus}
            onBlur={handleCustomTextBlur}
            placeholder="Enter custom text…"
            style={styles.textInput}
          />
        </div>
      </section>
    </div>
  );
}

function playbackSummary(status: PlayerStatus | null): { value: string; color: string } {
  if (!status) return { value: "Waiting", color: "var(--text-secondary)" };
  if (status.paused) return { value: "Paused", color: "var(--orange)" };
  return { value: "Playing", color: "var(--green)" };
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
