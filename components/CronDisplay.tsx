"use client";
import { validateCron } from "@/lib/cronEngine";

interface Props {
  expr: string;
  animated?: boolean;
}

const PART_LABELS = ["minute", "hour", "day", "month", "weekday"];

export function CronDisplay({ expr, animated = false }: Props) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return (
    <div style={{ fontFamily:"var(--mono)", fontSize:"2rem", color:"var(--text3)" }}>
      — — — — —
    </div>
  );

  const { errors } = validateCron(expr);

  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"10px", flexWrap:"wrap" }}>
      {parts.map((part, i) => (
        <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"5px" }}>
          <span
            className={animated ? "fade-up" : ""}
            style={{
              fontFamily:"var(--mono)",
              fontSize:"clamp(1.4rem, 3.5vw, 2.2rem)",
              fontWeight: 600,
              color: part === "*" ? "var(--text3)" : errors.length ? "var(--red)" : "var(--amber)",
              letterSpacing:"0.04em",
              animationDelay: animated ? `${i * 60}ms` : "0ms",
              opacity: animated ? 0 : 1,
              animationFillMode:"forwards",
              transition:"color 0.3s",
            }}>
            {part}
          </span>
          <span style={{
            fontSize:"9px", fontFamily:"var(--sans)", color:"var(--text3)",
            letterSpacing:"0.1em", textTransform:"uppercase"
          }}>
            {PART_LABELS[i]}
          </span>
        </div>
      )).reduce((acc: React.ReactNode[], el, i) => {
        acc.push(el);
        if (i < parts.length - 1) acc.push(
          <span key={`dot-${i}`} style={{
            color:"var(--border2)", fontSize:"1.8rem",
            paddingBottom:"18px", fontFamily:"var(--mono)", userSelect:"none"
          }}>·</span>
        );
        return acc;
      }, [])}
    </div>
  );
}
