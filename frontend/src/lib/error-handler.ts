"use client";

// ============================================================================
// GUILDOS — Global Error Handler
// Prevents silent failures in production by catching unhandled rejections
// and global errors, logging them, and optionally forwarding to error
// monitoring services (e.g., Sentry, Datadog RUM).
// ============================================================================

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Rejection]', event.reason);

    // Prevent the default behavior (some browsers show a console warning)
    event.preventDefault();

    // In production, you'd send this to an error monitoring service
    // Example: Sentry.captureException(event.reason);
  });

  window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error || event.message);
  });
}
