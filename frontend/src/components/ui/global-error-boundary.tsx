"use client";

import React from "react";

// ─────────────────────────────────────────────────────────
// Props & State
// ─────────────────────────────────────────────────────────
export interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI */
  fallback?: React.ReactNode;
  /** Called with error details when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[GlobalErrorBoundary] ${new Date().toISOString()} — Error:`,
      error,
      errorInfo
    );
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="guild-card rounded-xl border border-destructive/20 bg-destructive/5 backdrop-blur-sm p-6">
          <div className="flex flex-col items-center text-center max-w-sm mx-auto">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <span className="text-lg">⚠️</span>
            </div>

            {/* Title */}
            <h4 className="text-sm font-bold text-foreground mb-1">
              Something went wrong
            </h4>

            {/* Description */}
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              A component in this section encountered an error. Try again to
              resume functionality.
            </p>

            {/* Dev-only error detail */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="w-full text-left text-[10px] bg-muted/30 rounded-lg p-2 mb-4 overflow-auto max-h-16 text-destructive border border-destructive/20 font-mono">
                {this.state.error.message}
              </pre>
            )}

            {/* Retry */}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
