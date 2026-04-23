"use client";

interface Props {
  status:    string;
  progress?: number;
  message?:  string;
}

export function ModelStatus({ status, progress = 0, message }: Props) {
  if (status === "idle") return null;

  type Cfg = { color: string; bg: string; border: string; label: string; pulse: boolean };

  const cfg: Record<string, Cfg> = {
    downloading: {
      color: "var(--amber)", bg: "var(--amber-bg)", border: "rgba(232,168,48,0.2)",
      label: message || `Loading… ${progress}%`, pulse: true,
    },
    loading: {
      color: "var(--amber)", bg: "var(--amber-bg)", border: "rgba(232,168,48,0.2)",
      label: message || "Loading…", pulse: true,
    },
    warming: {
      color: "var(--amber)", bg: "var(--amber-bg)", border: "rgba(232,168,48,0.2)",
      label: "Starting up…", pulse: true,
    },
    ready: {
      color: "var(--green)", bg: "var(--green-bg)", border: "rgba(93,184,122,0.2)",
      label: "Parser ready · fully offline", pulse: false,
    },
    error: {
      color: "var(--text2)", bg: "var(--bg3)", border: "var(--border)",
      label: "Unavailable — try refreshing", pulse: false,
    },
  };

  const c = cfg[status] ?? cfg.error;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "8px",
      padding: "5px 14px", borderRadius: "20px", fontSize: "12px",
      fontFamily: "var(--sans)", background: c.bg,
      border: `1px solid ${c.border}`, color: c.color,
    }}>
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%", background: "currentColor",
        animation: c.pulse ? "pulse 1.4s infinite" : "none", flexShrink: 0,
      }} />
      {c.label}
    </div>
  );
}
