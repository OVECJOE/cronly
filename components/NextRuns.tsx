"use client";
import { getNextRuns } from "@/lib/cronEngine";

interface Props { expr: string; tz?: string; }

function relTime(date: Date): string {
  const diff = date.getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.round(diff / 3600000);
  if (hrs < 24) return `in ${hrs}h`;
  const days = Math.round(diff / 86400000);
  return `in ${days}d`;
}

export function NextRuns({ expr, tz = "local" }: Props) {
  const runs = getNextRuns(expr, 7);
  if (!runs.length) return null;

  return (
    <div>
      <p style={{ fontSize:"10px", color:"var(--text3)", fontFamily:"var(--sans)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>
        Next runs
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
        {runs.map((run, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:"12px",
            padding:"7px 12px", borderRadius:"8px",
            background: i === 0 ? "var(--amber-bg)" : "var(--bg3)",
            border: `1px solid ${i === 0 ? "rgba(232,168,48,0.2)" : "var(--border)"}`,
            transition:"all 0.2s",
          }}>
            <span style={{ fontSize:"10px", color:"var(--text3)", fontFamily:"var(--mono)", width:"14px" }}>{i+1}</span>
            <span style={{ flex:1, fontSize:"12px", fontFamily:"var(--mono)", color: i === 0 ? "var(--amber)" : "var(--text)" }}>
              {run.toLocaleString("en-US", { weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })}
            </span>
            <span style={{ fontSize:"11px", color: i === 0 ? "var(--amber-dim)" : "var(--text3)", fontFamily:"var(--sans)" }}>
              {relTime(run)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
