// ============================================================================
// GUILDOS — Canonical API Client (mirrors Aegis aegisFetch pattern)
// ============================================================================

import { createClient } from '@/lib/supabase/client';

// --- Error types for classification ---

export class NetworkError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class AuthError extends Error {
  constructor(message: string, public readonly status: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ServerError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'ServerError';
  }
}

// --- Options ---

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  /** Timeout in milliseconds (default: 15000 = 15s) */
  timeout?: number;
  /** Max retries for GET requests (default: 2) */
  maxRetries?: number;
}

// --- Helpers ---

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with a configurable timeout via AbortController.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout: number }
): Promise<Response> {
  const { timeout, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Classify a fetch error based on type and status.
 */
function classifyError(error: unknown, status?: number): Error {
  // TimeoutError — AbortController fires AbortError
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new TimeoutError();
  }

  // NetworkError — fetch threw a TypeError (DNS, connection refused, etc.)
  if (error instanceof TypeError) {
    return new NetworkError(`Network error: ${error.message}`, error);
  }

  // AuthError
  if (status === 401 || status === 403) {
    return new AuthError(`Authentication failed (${status})`, status);
  }

  // ServerError (4xx/5xx)
  if (status && status >= 400) {
    return new ServerError(`Request failed (${status})`, status);
  }

  // Fallback: re-throw whatever was caught
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

/**
 * guildFetch — THE canonical way to call GuildOS API routes.
 * Auto-injects Supabase JWT, handles errors, returns typed JSON.
 * Includes configurable timeout, retry logic for GET requests,
 * and structured error classification.
 */
export async function guildFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    skipAuth = false,
    headers: customHeaders,
    timeout = 15000,
    maxRetries = 2,
    ...rest
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Auto-inject auth token
  if (!skipAuth) {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {
      // Continue without auth if Supabase is not configured
    }
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Determine if retries apply (GET requests only — mutations are not idempotent)
  const method = (options.method ?? 'GET').toUpperCase();
  const isIdempotent = method === 'GET';

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= (isIdempotent ? maxRetries : 0); attempt++) {
    try {
      // Wait before retrying (exponential backoff: 1s, 2s, ...)
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await sleep(delay);
      }

      const response = await fetchWithTimeout(url, {
        ...rest,
        headers,
        timeout,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const errorMessage =
          body?.error || body?.message || `HTTP ${response.status}: ${response.statusText}`;
        const classified = classifyError(errorMessage, response.status);
        lastError = classified;

        // Don't retry on auth errors — they won't succeed on retry
        if (classified instanceof AuthError) {
          throw classified;
        }

        // Throw on the last attempt; otherwise continue to retry
        if (attempt >= (isIdempotent ? maxRetries : 0)) {
          throw new ServerError(errorMessage, response.status, body);
        }
        continue;
      }

      return response.json();
    } catch (error) {
      const classified = classifyError(error);

      // Don't retry auth errors
      if (classified instanceof AuthError) {
        throw classified;
      }

      // Don't retry if we already parsed the error body on a successful fetch
      if (classified instanceof ServerError) {
        throw classified;
      }

      lastError = classified;

      // If this was the final attempt, throw the error
      if (attempt >= (isIdempotent ? maxRetries : 0)) {
        throw classified;
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError ?? new Error('Request failed');
}
