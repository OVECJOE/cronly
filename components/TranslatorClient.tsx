"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { CronDisplay } from "./CronDisplay";
import { CalendarPreview } from "./CalendarPreview";
import { NextRuns } from "./NextRuns";
import { OutputFormats } from "./OutputFormats";
import { ModelStatus } from "./ModelStatus";
import { translateToCron, CronResult, EXAMPLE_SCHEDULES } from "@/lib/cronEngine";
import { ModelManager, ModelProgress, ModelPhase } from "@/lib/ai/modelManager";
import { saveExpression } from "@/lib/storage";

export function TranslatorClient() {
  const [input, setInput]           = useState("");
  const [result, setResult]         = useState<CronResult | null>(null);
  const [translating, setTranslating] = useState(false);
  const [modelProgress, setModelProgress] = useState<ModelProgress>({ phase:"idle", pct:0, message:"" });
  const [saved, setSaved]           = useState(false);
  const [shareUrl, setShareUrl]     = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [activeTab, setActiveTab]   = useState<"runs"|"calendar"|"output">("runs");
  const [error, setError]           = useState("");
  const debounce                    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef                    = useRef<AbortController | null>(null);
  const router                      = useRouter();

  // Boot the model manager once on mount
  useEffect(() => {
    const manager = ModelManager.getInstance();
    const unsub   = manager.onProgress(setModelProgress);
    manager.init();
    return unsub;
  }, []);

  const translate = useCallback(async (text: string) => {
    if (!text.trim()) { setResult(null); setError(""); return; }

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setTranslating(true);
    setError("");

    try {
      const res = await translateToCron(text);
      if (signal.aborted) return;
      setResult(res);
      if (!res.valid) {
        setError(`Invalid expression produced: ${res.errors.join(", ")}`);
      }
    } catch (e: any) {
      if (signal.aborted) return;
      setError(e.message ?? "Could not parse schedule. Try rephrasing (e.g. \"every day at 9am\").");
      setResult(null);
    } finally {
      if (!signal.aborted) setTranslating(false);
    }
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => translate(input), 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [input, translate]);

  const handleSave = () => {
    if (!result?.valid) return;
    saveExpression(result.expr, result.description);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleShare = () => {
    if (!result?.valid) return;
    const encoded = btoa(JSON.stringify({ expr: result.expr, desc: result.description }));
    const url     = `${window.location.origin}/share#${encoded}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const modelPhase = modelProgress.phase as ModelPhase;
  const modelReady = modelPhase === "ready";

  const tabs = [
    { id: "runs",     label: "Next runs"  },
    { id: "calendar", label: "Calendar"   },
    { id: "output",   label: "Export"     },
  ] as const;

  return (
    <>
      <Navbar />
      <div style={{ minHeight:"100vh", padding:"80px 1.5rem 4rem", maxWidth:"900px", margin:"0 auto" }}>

        {/* Hero */}
        <div className="fade-up" style={{ paddingTop:"2rem", marginBottom:"2.5rem" }}>
          <h1 style={{
            fontFamily:"var(--display)", fontSize:"clamp(2.5rem,6vw,4.5rem)",
            fontWeight:300, color:"var(--text)", letterSpacing:"-0.03em",
            lineHeight:1.05, marginBottom:"0.75rem"
          }}>
            Plain English<br />
            <em style={{ color:"var(--amber)", fontStyle:"italic" }}>to cron.</em>
          </h1>
          <p className="fade-up delay-1" style={{
            fontSize:"15px", color:"var(--text2)", fontFamily:"var(--sans)",
            fontWeight:300, maxWidth:"420px", lineHeight:1.7
          }}>
            Runs entirely offline — rule-based parser, no model downloads, no server. Type anything.
          </p>
        </div>

        {/* Model status */}
        <div className="fade-up delay-2" style={{ marginBottom:"1.25rem" }}>
          <ModelStatus status={modelPhase} progress={modelProgress.pct} message={modelProgress.message} />
        </div>

        {/* Input */}
        <div className="fade-up delay-2" style={{ marginBottom:"1.25rem" }}>
          <div style={{ position:"relative" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={modelReady ? "every weekday at 9am…" : "Initialising…"}
              disabled={!modelReady}
              suppressHydrationWarning
              autoFocus
              style={{
                width:"100%", padding:"18px 48px 18px 48px",
                background:"var(--bg2)",
                border:`1.5px solid ${error ? "var(--red)" : "var(--border2)"}`,
                borderRadius:"12px", color:"var(--text)",
                fontFamily:"var(--sans)", fontSize:"17px", fontWeight:300,
                outline:"none", transition:"border-color 0.2s",
                opacity: modelReady ? 1 : 0.5, cursor: modelReady ? "text" : "not-allowed"
              }}
              onFocus={e => e.target.style.borderColor = error ? "var(--red)" : "var(--amber-dim)"}
              onBlur={e  => e.target.style.borderColor = error ? "var(--red)" : "var(--border2)"}
            />
            {/* Spinner / chevron */}
            <span style={{
              position:"absolute", left:"18px", top:"50%", transform:"translateY(-50%)",
              color: translating ? "var(--amber)" : "var(--text3)", fontSize:"16px",
              animation: translating ? "pulse 1s infinite" : "none"
            }}>
              {translating ? "⟳" : "›"}
            </span>
            {input && (
              <button onClick={() => { setInput(""); setResult(null); setError(""); }} style={{
                position:"absolute", right:"16px", top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", color:"var(--text3)", cursor:"pointer",
                fontSize:"18px", lineHeight:1, padding:"2px"
              }}>×</button>
            )}
          </div>

          {/* Error */}
          {error && (
            <p style={{
              marginTop:"8px", fontSize:"12px", fontFamily:"var(--sans)",
              color:"var(--red)", padding:"6px 12px",
              background:"var(--red-bg)", borderRadius:"6px",
              border:"1px solid rgba(224,92,92,0.2)"
            }}>
              ⚠ {error}
            </p>
          )}
        </div>

        {/* Example chips */}
        <div className="fade-up delay-3" style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"2rem" }}>
          {EXAMPLE_SCHEDULES.slice(0, 10).map(ex => (
            <button
              key={ex}
              onClick={() => modelReady && setInput(ex)}
              disabled={!modelReady}
              suppressHydrationWarning
              style={{
                padding:"5px 12px", borderRadius:"20px", fontSize:"11px",
                fontFamily:"var(--sans)", cursor: modelReady ? "pointer" : "not-allowed",
                border:"1px solid var(--border)", background:"var(--bg2)",
                color:"var(--text2)", transition:"all 0.15s", whiteSpace:"nowrap",
                opacity: modelReady ? 1 : 0.4
              }}
              onMouseEnter={e => {
                if (!modelReady) return;
                const t = e.target as HTMLElement;
                t.style.borderColor = "var(--border2)";
                t.style.color = "var(--text)";
              }}
              onMouseLeave={e => {
                const t = e.target as HTMLElement;
                t.style.borderColor = "var(--border)";
                t.style.color = "var(--text2)";
              }}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Result card */}
        {result?.valid && !error && (
          <div className="fade-up">
            <div style={{
              background:"var(--bg2)", border:"1px solid var(--border2)",
              borderRadius:"16px", padding:"2rem", marginBottom:"1.5rem"
            }}>
              <CronDisplay expr={result.expr} animated />

              <p style={{
                fontFamily:"var(--display)", fontStyle:"italic", fontSize:"1.25rem",
                color:"var(--text2)", marginTop:"1.25rem", marginBottom:"1.5rem", lineHeight:1.4
              }}>
                {result.description}
              </p>

              {/* Actions */}
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                <CopyButton expr={result.expr} />

                <button onClick={handleSave} style={{
                  padding:"8px 16px", borderRadius:"8px", fontSize:"13px",
                  fontFamily:"var(--sans)", cursor:"pointer",
                  border:"1px solid var(--border)",
                  background: saved ? "var(--green-bg)" : "var(--bg3)",
                  color: saved ? "var(--green)" : "var(--text2)",
                  transition:"all 0.2s"
                }}>
                  {saved ? "✓ Saved" : "Save"}
                </button>

                <button onClick={handleShare} style={{
                  padding:"8px 16px", borderRadius:"8px", fontSize:"13px",
                  fontFamily:"var(--sans)", cursor:"pointer",
                  border:"1px solid var(--border)",
                  background: shareCopied ? "var(--amber-bg)" : "var(--bg3)",
                  color: shareCopied ? "var(--amber)" : "var(--text2)",
                  transition:"all 0.2s"
                }}>
                  {shareCopied ? "✓ Link copied" : "Share"}
                </button>
              </div>

              {shareUrl && (
                <div style={{
                  marginTop:"10px", padding:"8px 12px", borderRadius:"8px",
                  background:"var(--bg)", border:"1px solid var(--border)",
                  fontSize:"11px", fontFamily:"var(--mono)",
                  color:"var(--text2)", wordBreak:"break-all"
                }}>
                  {shareUrl}
                </div>
              )}
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
              {activeTab === "runs"     && <NextRuns expr={result.expr} />}
              {activeTab === "calendar" && <CalendarPreview expr={result.expr} />}
              {activeTab === "output"   && <OutputFormats expr={result.expr} />}
            </div>
          </div>
        )}

        {/* Empty / waiting state */}
        {!result && !translating && !error && (
          <div className="fade-up delay-4" style={{
            textAlign:"center", padding:"4rem 0",
            color:"var(--text3)", fontFamily:"var(--sans)"
          }}>
            <div style={{ fontSize:"48px", marginBottom:"1rem", opacity:0.2 }}>⏱</div>
            <p style={{ fontSize:"14px" }}>
              {modelReady ? "Start typing a schedule above" : "Initialising parser…"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function CopyButton({ expr }: { expr: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(expr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} style={{
      padding:"8px 20px", borderRadius:"8px", fontSize:"13px",
      fontFamily:"var(--sans)", cursor:"pointer", transition:"all 0.2s",
      background: copied ? "var(--green-bg)" : "var(--amber-bg)",
      color: copied ? "var(--green)" : "var(--amber)",
      border:`1px solid ${copied ? "rgba(93,184,122,0.3)" : "rgba(232,168,48,0.3)"}`,
    } as React.CSSProperties}>
      {copied ? "✓ Copied" : "Copy expression"}
    </button>
  );
}
