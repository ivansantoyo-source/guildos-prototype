"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[GuildOS Error Boundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <span className="text-5xl block mb-4">💥</span>
            <h2 className="text-xl font-bold text-foreground mb-2">Something Went Wrong</h2>
            <p className="text-sm text-muted-foreground mb-6">
              An unexpected error occurred. Our systems have been notified.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-left text-[11px] bg-muted/30 rounded-lg p-3 mb-4 overflow-auto max-h-32 text-destructive">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleRetry}
              className="px-6 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
