// ============================================================================
// GUILDOS — Canonical API Client (mirrors Aegis aegisFetch pattern)
// ============================================================================

import { createClient } from '@/lib/supabase/client';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * guildFetch — THE canonical way to call GuildOS API routes.
 * Auto-injects Supabase JWT, handles errors, returns typed JSON.
 */
export async function guildFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

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

  const response = await fetch(url, {
    ...rest,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}
