"use client";
import { useState } from "react";
import { toOutputFormat, OutputFormat } from "@/lib/cronEngine";

interface Props { expr: string; }

const FORMATS: { id: OutputFormat; label: string; lang: string }[] = [
  { id:"standard", label:"Standard", lang:"bash" },
  { id:"quartz",   label:"Quartz",   lang:"bash" },
  { id:"aws",      label:"AWS EventBridge", lang:"bash" },
  { id:"k8s",      label:"Kubernetes",      lang:"yaml" },
  { id:"github",   label:"GitHub Actions",  lang:"yaml" },
  { id:"node",     label:"Node.js",         lang:"js" },
  { id:"python",   label:"Python",          lang:"python" },
  { id:"go",       label:"Go",              lang:"go" },
];

export function OutputFormats({ expr }: Props) {
  const [active, setActive] = useState<OutputFormat>("standard");
  const [copied, setCopied] = useState(false);

  const output = toOutputFormat(expr, active);

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div>
      <p style={{ fontSize:"10px", color:"var(--text3)", fontFamily:"var(--sans)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"10px" }}>
        Output format
      </p>
      <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"10px" }}>
        {FORMATS.map(f => (
          <button key={f.id} onClick={() => setActive(f.id)} style={{
            padding:"4px 10px", borderRadius:"5px", fontSize:"11px",
            fontFamily:"var(--sans)", cursor:"pointer", transition:"all 0.15s",
            background: active === f.id ? "var(--amber-bg)" : "var(--bg3)",
            color: active === f.id ? "var(--amber)" : "var(--text2)",
            border: active === f.id ? "1px solid rgba(232,168,48,0.3)" : "1px solid var(--border)",
          } as React.CSSProperties}>
            {f.label}
          </button>
        ))}
      </div>
      <div style={{ position:"relative" }}>
        <pre style={{
          fontFamily:"var(--mono)", fontSize:"13px", color:"var(--green)",
          background:"var(--bg)", border:"1px solid var(--border)",
          borderRadius:"8px", padding:"14px 16px", overflowX:"auto",
          lineHeight:1.6, margin:0, whiteSpace:"pre-wrap", wordBreak:"break-all"
        }}>
          {output}
        </pre>
        <button onClick={copy} style={{
          position:"absolute", top:"10px", right:"10px",
          padding:"4px 10px", borderRadius:"5px", fontSize:"11px",
          fontFamily:"var(--sans)", cursor:"pointer", border:"1px solid var(--border2)",
          background: copied ? "var(--green-bg)" : "var(--bg3)",
          color: copied ? "var(--green)" : "var(--text2)",
          transition:"all 0.2s"
        }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
