// ============================================================================
// GUILDOS — Standard API Error Helpers
// Provides consistent error response formatting across all API routes.
// No stack traces are leaked in production responses.
// ============================================================================

import { NextResponse } from 'next/server';

/**
 * Standard error response with consistent JSON shape.
 *
 * @param status - HTTP status code (400, 401, 403, 404, 429, 500, etc.)
 * @param message - Human-readable error message
 * @param details - Optional detailed error info (validation errors, etc.)
 * @returns NextResponse with JSON body
 *
 * @example
 * return standardError(404, 'Bounty not found');
 * return standardError(400, 'Validation failed', 'item_name is required');
 */
export function standardError(
  status: number,
  message: string,
  details?: string
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  );
}

/**
 * Safe handler for catching unknown errors in API routes.
 * Logs the full error server-side, then returns a sanitized 500 response
 * (no stack trace leakage to the client).
 *
 * @param err - The caught error (unknown type)
 * @param contextLabel - Optional label for server-side logging (e.g. '[Inventory]')
 * @returns NextResponse with a generic 500 error
 *
 * @example
 * try { ... } catch (err) {
 *   return handleApiError(err, '[Inventory:POST]');
 * }
 */
export function handleApiError(
  err: unknown,
  contextLabel?: string
): NextResponse {
  const message =
    err instanceof Error ? err.message : 'Unknown error';

  if (contextLabel) {
    console.error(`${contextLabel} ${message}`);
    if (err instanceof Error && err.stack) {
      console.error(`${contextLabel} Stack:`, err.stack);
    }
  } else {
    console.error('API Error:', message, err);
  }

  return NextResponse.json(
    { error: 'Unable to process request' },
    { status: 500 }
  );
}
