"use client";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 w-full max-w-md mx-4">
        <div className="bg-card border border-border rounded-xl p-8 guild-card shadow-[0_0_60px_oklch(0.78_0.2_145/8%)]">
          <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md mt-4">
            An unexpected error occurred. Our systems have been notified.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono mt-3">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="mt-6 px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg border border-border hover:border-primary/40 transition-all duration-200 hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
