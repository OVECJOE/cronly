"use client";
import { useState } from "react";
import { Navbar } from "./Navbar";
import { CronDisplay } from "./CronDisplay";
import { CalendarPreview } from "./CalendarPreview";
import { NextRuns } from "./NextRuns";
import { OutputFormats } from "./OutputFormats";
import { cronToEnglish, validateCron, isQuartzSixField } from "@/lib/cronEngine";
import { detectConflicts } from "@/lib/cronEngine";
import { saveExpression } from "@/lib/storage";

export function ReverseClient() {
  const [input, setInput] = useState("");
  const [conflict, setConflict] = useState("");
  const [conflictResult, setConflictResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"runs"|"calendar"|"output"|"conflict">("runs");

  const rawInput = input.trim();

  // Auto-detect and strip Quartz 6-field seconds prefix
  const isQuartz = rawInput ? isQuartzSixField(rawInput) : false;
  const normalised = isQuartz ? rawInput.split(/\s+/).slice(1).join(" ") : rawInput;

  const { valid, errors, expanded } = normalised
    ? validateCron(normalised)
    : { valid: false, errors: [], expanded: undefined };

  // Use the expanded 5-field form (e.g. "@daily" → "0 0 * * *") for all downstream logic
  const resolvedExpr = expanded ?? normalised;
  const description  = valid ? cronToEnglish(resolvedExpr) : "";

  const displayExpr = valid ? resolvedExpr : rawInput;

  const handleSave = () => {
    if (!valid) return;
    saveExpression(displayExpr, description);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const checkConflict = () => {
    if (!valid || !conflict.trim()) return;
    const conflictInput = isQuartzSixField(conflict.trim())
      ? conflict.trim().split(/\s+/).slice(1).join(" ")
      : conflict.trim();
    const { valid: v2 } = validateCron(conflictInput);
    if (!v2) { setConflictResult("Second expression is invalid."); return; }
    const conflictInputFinal = isQuartzSixField(conflict.trim())
      ? conflict.trim().split(/\s+/).slice(1).join(" ")
      : conflict.trim();
    const overlaps = detectConflicts(displayExpr, conflictInputFinal);
    if (overlaps.length === 0) setConflictResult("No conflicts in the next 24 hours.");
    else setConflictResult(`${overlaps.length} overlap${overlaps.length !== 1 ? "s" : ""} found in the next 24 hours.`);
  };

  const tabs = [
    { id:"runs", label:"Next runs" },
    { id:"calendar", label:"Calendar" },
    { id:"output", label:"Use in…" },
    { id:"conflict", label:"Conflict check"},
  ] as const;

  return (
    <>
      <Navbar />
      <div style={{ minHeight:"100vh", padding:"80px 1.5rem 4rem", maxWidth:"900px", margin:"0 auto" }}>
        <div className="fade-up" style={{ paddingTop:"2rem", marginBottom:"2rem" }}>
          <h1 style={{
            fontFamily:"var(--display)", fontSize:"clamp(2rem,5vw,3.5rem)",
            fontWeight:300, color:"var(--text)", letterSpacing:"-0.03em", marginBottom:"0.5rem"
          }}>
            Decode a cron<br/>
            <em style={{ color:"var(--amber)" }}>expression.</em>
          </h1>
          <p style={{ fontSize:"14px", color:"var(--text2)", fontFamily:"var(--sans)", fontWeight:300 }}>
            Paste any cron expression to get a plain English explanation, next runs, and export options.
          </p>
        </div>

        {/* Input */}
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ position:"relative" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="0 9 * * 1-5"
              spellCheck={false}
              style={{
                width:"100%", padding:"16px 20px",
                background:"var(--bg2)", border:`1.5px solid ${errors.length && input ? "var(--red)" : "var(--border2)"}`,
                borderRadius:"12px", color:"var(--amber)", fontFamily:"var(--mono)",
                fontSize:"18px", fontWeight:500, outline:"none", letterSpacing:"0.06em",
                transition:"border-color 0.2s"
              }}
            />
            {input && (
              <button onClick={() => setInput("")} style={{
                position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", color:"var(--text3)", cursor:"pointer",
                fontSize:"18px", lineHeight:1, padding:"2px"
              }}>×</button>
            )}
          </div>
          {/* Quartz detection badge */}
          {isQuartz && (
            <div style={{
              marginTop:"8px", padding:"8px 12px", borderRadius:"8px",
              background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.25)",
              fontSize:"12px", fontFamily:"var(--sans)", color:"var(--text2)", lineHeight:1.5
            }}>
              <span style={{ color:"#a78bfa", marginRight:"6px" }}>◆</span>
              Quartz 6-field cron detected — seconds field stripped, showing equivalent 5-field standard cron.
            </div>
          )}
          {errors.length > 0 && input && (
            <div style={{ marginTop:"8px" }}>
              {errors.map((e, i) => (
                <p key={i} style={{ fontSize:"12px", color:"var(--red)", fontFamily:"var(--sans)", marginBottom:"2px" }}>
                  ⚠ {e}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Common examples */}
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"2rem" }}>
          {[
            "0 9 * * 1-5", "*/15 * * * *", "0 0 1 * *", "0 12 * * 0",
            "0 */2 * * *", "@daily", "@hourly",
            "0 0 9 * * 1-5",
          ].map(ex => (
            <button key={ex} onClick={() => setInput(ex)} style={{
              padding:"5px 12px", borderRadius:"20px", fontSize:"11px",
              fontFamily:"var(--mono)", cursor:"pointer", border:"1px solid var(--border)",
              background:"var(--bg2)", color:"var(--text2)", transition:"all 0.15s",
            }}>
              {ex}
            </button>
          ))}
        </div>

        {/* Result */}
        {valid && (
          <div className="fade-up">
            <div style={{
              background:"var(--bg2)", border:"1px solid var(--border2)",
              borderRadius:"16px", padding:"2rem", marginBottom:"1.5rem"
            }}>
              <CronDisplay expr={displayExpr} animated />
              <p style={{
                fontFamily:"var(--display)", fontStyle:"italic", fontSize:"1.2rem",
                color:"var(--text2)", marginTop:"1.25rem", marginBottom:"1rem"
              }}>
                {description}
              </p>
              <button onClick={handleSave} style={{
                padding:"8px 16px", borderRadius:"8px", fontSize:"13px",
                fontFamily:"var(--sans)", cursor:"pointer", border:"1px solid var(--border)",
                background: saved ? "var(--green-bg)" : "var(--bg3)",
                color: saved ? "var(--green)" : "var(--text2)", transition:"all 0.2s"
              }}>
                {saved ? "✓ Saved" : "Save expression"}
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:"4px", borderBottom:"1px solid var(--border)", marginBottom:"1rem" }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding:"8px 16px", border:"none", background:"none", cursor:"pointer",
                  fontSize:"13px", fontFamily:"var(--sans)", transition:"all 0.15s",
                  color: activeTab === t.id ? "var(--amber)" : "var(--text2)",
                  borderBottom:`2px solid ${activeTab === t.id ? "var(--amber)" : "transparent"}`,
                  marginBottom:"-1px"
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="fade-up">
              {activeTab === "runs" && <NextRuns expr={displayExpr} />}
              {activeTab === "calendar" && <CalendarPreview expr={displayExpr} />}
              {activeTab === "output" && <OutputFormats expr={displayExpr} />}
              {activeTab === "conflict" && (
                <div>
                  <p style={{ fontSize:"13px", color:"var(--text2)", fontFamily:"var(--sans)", marginBottom:"10px" }}>
                    Check if two cron expressions will ever run at the same time (next 24h).
                  </p>
                  <div style={{ display:"flex", gap:"8px", marginBottom:"10px" }}>
                    <input
                      value={conflict}
                      onChange={e => setConflict(e.target.value)}
                      placeholder="*/10 * * * *"
                      spellCheck={false}
                      style={{
                        flex:1, padding:"10px 14px",
                        background:"var(--bg2)", border:"1px solid var(--border2)",
                        borderRadius:"8px", color:"var(--amber)", fontFamily:"var(--mono)",
                        fontSize:"14px", outline:"none"
                      }}
                    />
                    <button onClick={checkConflict} style={{
                      padding:"10px 18px", borderRadius:"8px", fontSize:"13px",
                      fontFamily:"var(--sans)", cursor:"pointer",
                      background:"var(--amber-bg)", color:"var(--amber)",
                      border:"1px solid rgba(232,168,48,0.3)"
                    }}>
                      Check
                    </button>
                  </div>
                  {conflictResult && (
                    <p style={{
                      padding:"10px 14px", borderRadius:"8px", fontSize:"13px",
                      fontFamily:"var(--sans)", color: conflictResult.includes("No") ? "var(--green)" : "var(--red)",
                      background: conflictResult.includes("No") ? "var(--green-bg)" : "var(--red-bg)",
                      border:`1px solid ${conflictResult.includes("No") ? "rgba(93,184,122,0.2)" : "rgba(224,92,92,0.2)"}`
                    }}>
                      {conflictResult}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
