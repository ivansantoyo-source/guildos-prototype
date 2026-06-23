"use client";
import { useEffect } from "react";

export default function GlobalErrorPage({
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
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-2xl font-bold text-red-400">
              Something went wrong
            </h1>
            <p className="text-white/60 max-w-md">
              An unexpected error occurred. Our systems have been notified.
            </p>
            {error.digest && (
              <p className="text-xs text-white/30 font-mono">
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
