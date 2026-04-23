"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { CronDisplay } from "./CronDisplay";
import { CalendarPreview } from "./CalendarPreview";
import { NextRuns } from "./NextRuns";
import { OutputFormats } from "./OutputFormats";
import { validateCron, cronToEnglish } from "@/lib/cronEngine";
import { saveExpression } from "@/lib/storage";

interface SharedData {
  expr: string;
  desc: string;
}

export function ShareClient() {
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"runs" | "calendar" | "output">("runs");
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) { setError("No expression found in this link."); return; }
    try {
      const decoded = JSON.parse(atob(hash)) as SharedData;
      const { valid, errors } = validateCron(decoded.expr);
      if (!valid) throw new Error(errors[0] || "Invalid expression");
      // Ensure description is fresh
      decoded.desc = cronToEnglish(decoded.expr);
      setData(decoded);
    } catch {
      setError("This share link is invalid or corrupted.");
    }
  }, []);

  const handleSave = () => {
    if (!data) return;
    saveExpression(data.expr, data.desc);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.expr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleTryOwn = () => router.push("/");

  const tabs = [
    { id: "runs", label: "Next runs" },
    { id: "calendar", label: "Calendar" },
    { id: "output", label: "Export" },
  ] as const;

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", padding: "80px 1.5rem 4rem", maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div className="fade-up" style={{ paddingTop: "2rem", marginBottom: "2rem" }}>
          <span style={{
            display: "inline-block", fontSize: "11px", fontFamily: "var(--sans)",
            color: "var(--amber)", letterSpacing: "0.1em", textTransform: "uppercase",
            marginBottom: "1rem", background: "var(--amber-bg)",
            border: "1px solid rgba(232,168,48,0.2)", padding: "4px 12px", borderRadius: "20px"
          }}>
            Shared expression
          </span>
          <h1 style={{
            fontFamily: "var(--display)", fontSize: "clamp(2rem,5vw,3.5rem)",
            fontWeight: 300, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.1
          }}>
            Someone shared<br />
            <em style={{ color: "var(--amber)" }}>a cron with you.</em>
          </h1>
        </div>

        {/* Error state */}
        {error && (
          <div className="fade-up" style={{
            padding: "1.5rem", borderRadius: "12px", textAlign: "center",
            background: "var(--red-bg)", border: "1px solid rgba(224,92,92,0.2)"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "0.75rem" }}>⚠️</div>
            <p style={{ fontSize: "14px", color: "var(--red)", fontFamily: "var(--sans)", marginBottom: "1rem" }}>
              {error}
            </p>
            <button onClick={handleTryOwn} style={{
              padding: "8px 18px", borderRadius: "8px", fontSize: "13px",
              fontFamily: "var(--sans)", cursor: "pointer", border: "none",
              background: "var(--amber-bg)", color: "var(--amber)"
            }}>
              Translate your own →
            </button>
          </div>
        )}

        {/* Loading state */}
        {!data && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="loading-shimmer" style={{ height: "60px", borderRadius: "10px" }} />
            ))}
          </div>
        )}

        {/* Result */}
        {data && (
          <div className="fade-up">
            {/* Main card */}
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border2)",
              borderRadius: "16px", padding: "2rem", marginBottom: "1.5rem"
            }}>
              <CronDisplay expr={data.expr} animated />

              <p style={{
                fontFamily: "var(--display)", fontStyle: "italic", fontSize: "1.25rem",
                color: "var(--text2)", marginTop: "1.25rem", marginBottom: "1.5rem", lineHeight: 1.4
              }}>
                {data.desc}
              </p>

              {/* Raw expression */}
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", borderRadius: "8px",
                background: "var(--bg)", border: "1px solid var(--border)",
                marginBottom: "1.25rem"
              }}>
                <code style={{
                  fontFamily: "var(--mono)", fontSize: "15px",
                  color: "var(--amber)", flex: 1, letterSpacing: "0.06em"
                }}>
                  {data.expr}
                </code>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={handleCopy} style={{
                  padding: "8px 20px", borderRadius: "8px", fontSize: "13px",
                  fontFamily: "var(--sans)", cursor: "pointer",
                  background: copied ? "var(--green-bg)" : "var(--amber-bg)",
                  color: copied ? "var(--green)" : "var(--amber)",
                  border: `1px solid ${copied ? "rgba(93,184,122,0.3)" : "rgba(232,168,48,0.3)"}`,
                  transition: "all 0.2s"
                } as React.CSSProperties}>
                  {copied ? "✓ Copied" : "Copy expression"}
                </button>

                <button onClick={handleSave} style={{
                  padding: "8px 16px", borderRadius: "8px", fontSize: "13px",
                  fontFamily: "var(--sans)", cursor: "pointer",
                  border: "1px solid var(--border)",
                  background: saved ? "var(--green-bg)" : "var(--bg3)",
                  color: saved ? "var(--green)" : "var(--text2)",
                  transition: "all 0.2s"
                }}>
                  {saved ? "✓ Saved" : "Save to library"}
                </button>

                <button onClick={handleTryOwn} style={{
                  padding: "8px 16px", borderRadius: "8px", fontSize: "13px",
                  fontFamily: "var(--sans)", cursor: "pointer",
                  border: "1px solid var(--border)",
                  background: "var(--bg3)", color: "var(--text2)"
                }}>
                  Make your own →
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", marginBottom: "1rem" }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
                  fontSize: "13px", fontFamily: "var(--sans)", transition: "all 0.15s",
                  color: activeTab === t.id ? "var(--amber)" : "var(--text2)",
                  borderBottom: `2px solid ${activeTab === t.id ? "var(--amber)" : "transparent"}`,
                  marginBottom: "-1px"
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="fade-up">
              {activeTab === "runs" && <NextRuns expr={data.expr} />}
              {activeTab === "calendar" && <CalendarPreview expr={data.expr} />}
              {activeTab === "output" && <OutputFormats expr={data.expr} />}
            </div>

            {/* Attribution footer */}
            <div style={{
              marginTop: "3rem", paddingTop: "1.5rem",
              borderTop: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: "0.75rem"
            }}>
              <p style={{ fontSize: "12px", color: "var(--text3)", fontFamily: "var(--sans)" }}>
                Created with Cronly — the cron translator for humans.
              </p>
              <button onClick={handleTryOwn} style={{
                padding: "6px 14px", borderRadius: "20px", fontSize: "12px",
                fontFamily: "var(--sans)", cursor: "pointer",
                background: "var(--amber-bg)", color: "var(--amber)",
                border: "1px solid rgba(232,168,48,0.2)"
              }}>
                Try Cronly free →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
