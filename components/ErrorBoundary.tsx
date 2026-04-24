"use client";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props  { children: ReactNode; }
interface State  { error: Error | null; }

/**
 * Top-level React error boundary.
 * Catches any unhandled render-time error and shows a graceful recovery UI
 * instead of a white blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this would forward to an error-tracking service.
    console.error("[Cronly] Unhandled render error:", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: "2rem",
      }}>
        <div style={{
          maxWidth: "480px", textAlign: "center",
          background: "var(--bg2)", border: "1px solid var(--border2)",
          borderRadius: "16px", padding: "2.5rem 2rem",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "1rem", opacity: 0.4 }}>⚠</div>
          <h2 style={{
            fontFamily: "var(--display)", fontSize: "1.5rem", fontWeight: 300,
            color: "var(--text)", marginBottom: "0.75rem",
          }}>
            Something went wrong
          </h2>
          <p style={{
            fontSize: "13px", color: "var(--text2)", fontFamily: "var(--sans)",
            lineHeight: 1.6, marginBottom: "1.5rem",
          }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button
              onClick={this.reset}
              style={{
                padding: "8px 18px", borderRadius: "8px", fontSize: "13px",
                fontFamily: "var(--sans)", cursor: "pointer",
                background: "var(--amber-bg)", color: "var(--amber)",
                border: "1px solid rgba(232,168,48,0.3)",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "8px 18px", borderRadius: "8px", fontSize: "13px",
                fontFamily: "var(--sans)", cursor: "pointer",
                background: "var(--bg3)", color: "var(--text2)",
                border: "1px solid var(--border)", textDecoration: "none",
                display: "inline-flex", alignItems: "center",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
