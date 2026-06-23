// ============================================================================
// GUILDOS — Server-side Demo Detection
// API routes can't access localStorage, so we use URL params + cookies.
// Priority: URL param > cookie > env var (mirrors client-side isDemoMode())
// ============================================================================

import { cookies } from 'next/headers';

/**
 * Check demo mode from server-side (API routes).
 * Priority: URL param (?demo=true) > cookie > env var
 *
 * @param searchParams — Pass `request.nextUrl.searchParams` from the API route.
 *   This ensures direct API calls with ?demo=true work even when the proxy
 *   hasn't set the guildos_demo_mode cookie (the proxy matcher excludes /api/).
 */
export async function isDemoModeServer(searchParams?: URLSearchParams): Promise<boolean> {
  // 1. Check URL param (highest priority — user's explicit choice)
  if (searchParams) {
    const demoParam = searchParams.get('demo');
    if (demoParam === 'true') return true;
    if (demoParam === 'false') return false;
  }

  // 2. Check cookie (set by proxy middleware on page loads)
  try {
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get('guildos_demo_mode');
    if (demoCookie?.value === 'true') return true;
    if (demoCookie?.value === 'false') return false;
  } catch {
    // cookies() only works in App Router context
  }

  // 3. Fall back to env var (default — only demo when explicitly 'true')
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}
