/**
 * ModelManager — thin wrapper around the offline NLP parser.
 *
 * Previously this spun up a Web Worker that downloaded google/t5-small from
 * HuggingFace.  It is now backed entirely by the deterministic rule-based
 * parser in nlpParser.ts, which:
 *   - requires zero network access
 *   - is available immediately (phase goes straight to "ready" on init)
 *   - returns results synchronously (still exposed as Promise for API compat)
 *
 * The public interface is unchanged so all consumers (cronEngine, UI) work
 * without modification.
 */

import { parseCronFromText } from "./nlpParser";

// ─── Public types (re-exported for consumers) ─────────────────────────────────

export type ModelPhase =
  | "idle"
  | "downloading"
  | "loading"
  | "warming"
  | "ready"
  | "error";

export interface ModelProgress {
  phase:        ModelPhase;
  pct:          number;   // 0-100
  message:      string;
  bytesLoaded?: number;
  bytesTotal?:  number;
}

export type ProgressCallback = (p: ModelProgress) => void;

// ─── Singleton ────────────────────────────────────────────────────────────────

let instance: ModelManager | null = null;

export class ModelManager {
  private phase: ModelPhase          = "idle";
  private listeners: ProgressCallback[] = [];

  static getInstance(): ModelManager {
    if (!instance) instance = new ModelManager();
    return instance;
  }

  /** Subscribe to phase / progress updates. Returns an unsubscribe function.
   *  If the parser is already ready when the subscription is registered (e.g.
   *  after a React hot-reload or soft navigation that resets component state
   *  while the singleton survives), the callback is fired immediately so the
   *  component's local state is never left stuck at "idle".
   */
  onProgress(cb: ProgressCallback): () => void {
    this.listeners.push(cb);
    if (this.phase === "ready") {
      cb({ phase: "ready", pct: 100, message: "Rule-based parser ready" });
    }
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private emit(p: ModelProgress) {
    this.phase = p.phase;
    this.listeners.forEach(l => l(p));
  }

  /**
   * "Initialise" the parser engine.
   * The NLP parser needs no setup, so we immediately signal ready.
   * Idempotent — re-emits "ready" on every call so callers that missed the
   * first event (e.g. after a React re-mount) always converge to ready state.
   */
  async init(): Promise<void> {
    if (this.phase === "ready") {
      // Re-emit so any newly subscribed listener (e.g. after HMR / re-mount)
      // receives the current state.
      await Promise.resolve();
      this.emit({ phase: "ready", pct: 100, message: "Rule-based parser ready" });
      return;
    }
    if (this.phase !== "idle") return;
    // Micro-tick so subscribers attached synchronously before init() resolves
    // receive the event in the same JS task.
    await Promise.resolve();
    this.emit({ phase: "ready", pct: 100, message: "Rule-based parser ready" });
  }

  /**
   * Translate natural language to a cron expression.
   * Runs the NLP parser synchronously but returns a Promise for API compat.
   */
  translate(text: string, _timeoutMs = 8000): Promise<string> {
    try {
      const result = parseCronFromText(text.trim());
      return Promise.resolve(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return Promise.reject(new Error(msg));
    }
  }

  get currentPhase(): ModelPhase { return this.phase; }
  get isReady(): boolean         { return this.phase === "ready"; }
}
