"use client";
import { useState } from "react";
import { getCalendarDays } from "@/lib/cronEngine";

interface Props { expr: string; }

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export function CalendarPreview({ expr }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const activeDays = getCalendarDays(expr, year, month);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : -1;

  const prev = () => { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); };
  const next = () => { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); };

  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"12px", padding:"1rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
        <button onClick={prev} style={{ background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:"16px", padding:"2px 6px" }}>‹</button>
        <span style={{ fontSize:"12px", fontFamily:"var(--sans)", color:"var(--text2)", letterSpacing:"0.06em" }}>
          {MONTHS[month-1]} {year}
        </span>
        <button onClick={next} style={{ background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:"16px", padding:"2px 6px" }}>›</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px", marginBottom:"4px" }}>
        {DOW.map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:"9px", color:"var(--text3)", fontFamily:"var(--sans)", letterSpacing:"0.08em", padding:"2px 0" }}>{d}</div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px" }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i}/>;
          const active = activeDays.has(day);
          const isToday = day === today;
          return (
            <div key={i} style={{
              textAlign:"center", fontSize:"11px", fontFamily:"var(--mono)",
              padding:"5px 2px", borderRadius:"5px",
              background: active ? "var(--amber-bg)" : "transparent",
              color: active ? "var(--amber)" : isToday ? "var(--text)" : "var(--text3)",
              border: isToday ? "1px solid var(--border2)" : "1px solid transparent",
              fontWeight: active ? 600 : 400,
              transition:"all 0.2s",
            }}>
              {day}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop:"10px", display:"flex", alignItems:"center", gap:"6px" }}>
        <div style={{ width:"8px", height:"8px", borderRadius:"2px", background:"var(--amber-bg)", border:"1px solid var(--amber-dim)" }}/>
        <span style={{ fontSize:"10px", color:"var(--text3)", fontFamily:"var(--sans)" }}>
          {activeDays.size} run{activeDays.size !== 1 ? "s" : ""} this month
        </span>
      </div>
    </div>
  );
}
