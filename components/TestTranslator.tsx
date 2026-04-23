"use client";
import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { ModelStatus } from "./ModelStatus";

export function TranslatorClient() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [modelReady, setModelReady] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load transformers.js from CDN
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js";
    script.onload = async () => {
      setStatus("loading");
      setMessage("Loading library...");
      
      // @ts-ignore
      const { pipeline, env } = window.transformers;
      
      // Force local only
      env.allowLocalModels = true;
      env.allowRemoteModels = false;
      env.localModelPath = "/models/";
      env.useBrowserCache = false;
      
      try {
        setMessage("Loading model from local files...");
        
        // Try to load model
        const pipe = await pipeline(
          "text2text-generation",
          "cronly-cron-t5-onnx",
          { quantized: false }
        );
        
        setMessage("Warming up...");
        await pipe("test", { max_new_tokens: 1 });
        
        setStatus("ready");
        setModelReady(true);
        setMessage("Ready!");
        
        // @ts-ignore
        window.translationPipe = pipe;
      } catch (err: any) {
        console.error("Model load error:", err);
        setError(err.message || "Failed to load model");
        setStatus("error");
      }
    };
    script.onerror = () => {
      setError("Failed to load Transformers.js");
      setStatus("error");
    };
    document.head.appendChild(script);
  }, []);

  const translate = async () => {
    if (!input.trim() || !modelReady) return;
    
    try {
      // @ts-ignore
      const pipe = window.translationPipe;
      if (!pipe) return;
      
      const output = await pipe("schedule: " + input, {
        max_new_tokens: 20,
        do_sample: false,
      });
      
      setResult(output[0].generated_text);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight:"100vh", padding:"80px 1.5rem 4rem", maxWidth:"900px", margin:"0 auto" }}>
        <h1 style={{ fontSize:"3rem", marginBottom:"1rem" }}>
          Plain English<br /><em style={{ color:"var(--amber)" }}>to cron.</em>
        </h1>
        
        <ModelStatus 
          status={status as any} 
          progress={progress} 
          message={message} 
        />
        
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={modelReady ? "every weekday at 9am..." : "Loading..."}
          disabled={!modelReady}
          onBlur={translate}
          style={{
            width:"100%", padding:"18px",
            background:"var(--bg2)", border:"1.5px solid var(--border2)",
            borderRadius:"12px", color:"var(--text)",
            fontSize:"17px",
          }}
        />
        
        {error && (
          <div style={{ color:"var(--red)", marginTop:"8px" }}>
            {error}
          </div>
        )}
        
        {result && (
          <div style={{ marginTop:"1rem", fontSize:"1.5rem", fontFamily:"var(--mono)" }}>
            {result}
          </div>
        )}
      </div>
    </>
  );
}