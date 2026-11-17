import { usePluginStatus } from "../hooks";
import { formatTime } from "../utils";

/**
 * Overlay HUD — a minimal, non-interactive widget displayed over the video.
 *
 * Shows custom overlay text (when set), title, time position, playback state, and speed.
 * Renders nothing before the first status snapshot and when the plugin is disabled.
 */
export function App() {
  const status = usePluginStatus();

  if (!status || status.enabled === false) return null;

  const progress = status.duration > 0 ? (status.position / status.duration) * 100 : 0;
  const customText = status.customText.trim();

  return (
    <div style={styles.container}>
      {customText !== "" && <div style={styles.customText}>{customText}</div>}
      <div style={styles.title}>{status.title}</div>
      <div style={styles.time}>
        {formatTime(status.position)} / {formatTime(status.duration)}
        <span aria-hidden="true">{status.paused ? " ⏸" : " ▶"}</span>
        <span style={styles.visuallyHidden}>{status.paused ? "Paused" : "Playing"}</span>
        {status.speed !== 1 && ` ${status.speed}×`}
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressBar, width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    bottom: 48,
    left: 16,
    right: 16,
    padding: "8px 12px",
    background: "rgba(0, 0, 0, 0.55)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: 8,
    pointerEvents: "none",
  },
  customText: {
    fontSize: 13,
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.9)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.9)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  time: {
    position: "relative",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  visuallyHidden: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
  progressTrack: {
    marginTop: 6,
    height: 3,
    borderRadius: 1.5,
    background: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 1.5,
    background: "rgba(255, 255, 255, 0.7)",
    transition: "width 0.3s ease",
  },
};
