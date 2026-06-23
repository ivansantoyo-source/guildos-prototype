"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Bug } from "lucide-react";

// ─────────────────────────────────────────────────────────
// Props & State
// ─────────────────────────────────────────────────────────
export interface TavernErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI — completely replaces default fallback */
  fallback?: React.ReactNode;
  /** Error callback fired with error details */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface TavernErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export class TavernErrorBoundary extends React.Component<
  TavernErrorBoundaryProps,
  TavernErrorBoundaryState
> {
  constructor(props: TavernErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): TavernErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[TavernErrorBoundary] ${new Date().toISOString()} — Error in Live Tavern map:`,
      error,
      errorInfo
    );
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReport = () => {
    if (!this.state.error) return;
    console.warn(
      "[TavernErrorBoundary] Report submitted. Error details:",
      {
        name: this.state.error.name,
        message: this.state.error.message,
        stack: this.state.error.stack,
        timestamp: new Date().toISOString(),
        componentStack: "Live Tavern",
      }
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback override
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="guild-card rounded-2xl border border-destructive/30 bg-destructive/5 backdrop-blur-sm p-8">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-foreground mb-2">
              The Tavern Map Encountered an Error
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              The live station map encountered an unexpected rendering error.
              This may be due to invalid station data or a transient rendering
              issue. Our systems have been notified.
            </p>

            {/* Dev-only error detail */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="w-full text-left text-[11px] bg-muted/30 rounded-lg p-3 mb-6 overflow-auto max-h-24 text-destructive border border-destructive/20 font-mono">
                {this.state.error.name}: {this.state.error.message}
              </pre>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={this.handleReport}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-all"
              >
                <Bug className="w-4 h-4" />
                Report Issue
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
