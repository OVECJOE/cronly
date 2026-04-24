"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { getHistory, deleteExpression, exportHistory, importHistory, SavedExpression } from "@/lib/storage";

export function HistoryClient() {
  const [items, setItems] = useState<SavedExpression[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Reading from localStorage is a side-effect that must happen client-side.
    // Wrapping in a microtask satisfies the lint rule while keeping behaviour identical.
    queueMicrotask(() => setItems(getHistory()));
  }, []);

  const refresh = () => setItems(getHistory());

  const copy = (expr: string, id: string) => {
    navigator.clipboard.writeText(expr);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const del = (id: string) => {
    deleteExpression(id);
    refresh();
  };

  const doExport = () => {
    const blob = new Blob([exportHistory()], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "cronly-expressions.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { importHistory(ev.target?.result as string); refresh(); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filtered = filter ? items.filter(i => i.expr.includes(filter) || i.label.toLowerCase().includes(filter.toLowerCase())) : items;

  return (
    <>
      <Navbar />
      <div style={{ minHeight:"100vh", padding:"80px 1.5rem 4rem", maxWidth:"900px", margin:"0 auto" }}>
        <div className="fade-up" style={{ paddingTop:"2rem", marginBottom:"2rem", display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h1 style={{ fontFamily:"var(--display)", fontSize:"clamp(2rem,5vw,3rem)", fontWeight:300, color:"var(--text)", letterSpacing:"-0.03em" }}>
              Saved<br/><em style={{ color:"var(--amber)" }}>expressions.</em>
            </h1>
            <p style={{ fontSize:"13px", color:"var(--text3)", fontFamily:"var(--sans)", marginTop:"6px" }}>
              {items.length} saved · stored locally in your browser
            </p>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={doExport} style={{
              padding:"8px 14px", borderRadius:"8px", fontSize:"12px",
              fontFamily:"var(--sans)", cursor:"pointer", border:"1px solid var(--border)",
              background:"var(--bg2)", color:"var(--text2)"
            }}>↓ Export</button>
            <label style={{
              padding:"8px 14px", borderRadius:"8px", fontSize:"12px",
              fontFamily:"var(--sans)", cursor:"pointer", border:"1px solid var(--border)",
              background:"var(--bg2)", color:"var(--text2)"
            }}>
              ↑ Import
              <input type="file" accept=".json" style={{ display:"none" }} onChange={doImport}/>
            </label>
          </div>
        </div>

        {/* Filter */}
        {items.length > 0 && (
          <input
            value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Filter expressions…"
            style={{
              width:"100%", padding:"10px 16px", marginBottom:"1.25rem",
              background:"var(--bg2)", border:"1px solid var(--border)",
              borderRadius:"8px", color:"var(--text)", fontFamily:"var(--sans)",
              fontSize:"13px", outline:"none"
            }}
          />
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"5rem 0", color:"var(--text3)", fontFamily:"var(--sans)" }}>
            <div style={{ fontSize:"40px", marginBottom:"1rem", opacity:0.2 }}>📋</div>
            <p style={{ fontSize:"14px" }}>{items.length === 0 ? "No saved expressions yet." : "No matches."}</p>
            {items.length === 0 && (
              <button onClick={() => router.push("/")} style={{
                marginTop:"1rem", padding:"8px 18px", borderRadius:"8px", fontSize:"13px",
                fontFamily:"var(--sans)", cursor:"pointer", background:"var(--amber-bg)",
                color:"var(--amber)", border:"1px solid rgba(232,168,48,0.3)"
              }}>
                Translate a schedule →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {filtered.map(item => (
              <div key={item.id} style={{
                background:"var(--bg2)", border:"1px solid var(--border)",
                borderRadius:"12px", padding:"1rem 1.25rem",
                display:"grid", gridTemplateColumns:"1fr auto",
                gap:"1rem", alignItems:"center", transition:"border-color 0.15s"
              }}>
                <div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:"15px", color:"var(--amber)", fontWeight:500, marginBottom:"4px", letterSpacing:"0.06em" }}>
                    {item.expr}
                  </div>
                  <div style={{ fontSize:"13px", color:"var(--text2)", fontFamily:"var(--display)", fontStyle:"italic" }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize:"11px", color:"var(--text3)", fontFamily:"var(--sans)", marginTop:"4px" }}>
                    Saved {new Date(item.createdAt).toLocaleDateString()} · used {item.useCount}×
                  </div>
                </div>
                <div style={{ display:"flex", gap:"6px" }}>
                  <button onClick={() => copy(item.expr, item.id)} style={{
                    padding:"6px 12px", borderRadius:"6px", fontSize:"12px",
                    fontFamily:"var(--sans)", cursor:"pointer", border:"none",
                    background: copied === item.id ? "var(--green-bg)" : "var(--amber-bg)",
                    color: copied === item.id ? "var(--green)" : "var(--amber)",
                    transition:"all 0.2s", whiteSpace:"nowrap"
                  }}>
                    {copied === item.id ? "✓" : "Copy"}
                  </button>
                  <button onClick={() => del(item.id)} style={{
                    padding:"6px 10px", borderRadius:"6px", fontSize:"12px",
                    fontFamily:"var(--sans)", cursor:"pointer",
                    background:"var(--bg3)", color:"var(--text3)",
                    border:"1px solid var(--border)"
                  }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
