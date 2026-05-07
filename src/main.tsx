// polyfills MUST be the very first import — sets up Buffer globally
import "./polyfills";
import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// ── Error boundary — catches render-time crashes and shows a readable message
// instead of a blank black screen. Without this, any thrown error during render
// silently kills the entire React tree.
interface EBState { error: Error | null }

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[BurnBox] Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0c14",
          color: "#fff",
          fontFamily: "Inter, sans-serif",
          padding: "2rem",
          textAlign: "center",
          gap: "1rem",
        }}>
          <div style={{ fontSize: "2.5rem" }}>🔥</div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#888", fontSize: "0.875rem", maxWidth: "480px", margin: 0 }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1.5rem",
              background: "hsl(350 100% 54%)",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          <details style={{ marginTop: "0.5rem", color: "#555", fontSize: "0.75rem", maxWidth: "600px" }}>
            <summary style={{ cursor: "pointer" }}>Technical details</summary>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", marginTop: "0.5rem" }}>
              {this.state.error.stack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find root element");

createRoot(rootElement).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
