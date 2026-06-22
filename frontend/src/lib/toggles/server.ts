// ============================================================================
// GUILDOS — Server-side Demo Detection
// API routes can't access localStorage, so we use cookies.
// ============================================================================

import { cookies } from 'next/headers';

/**
 * Check demo mode from server-side (API routes).
 * Priority: Cookie > env var
 */
export async function isDemoModeServer(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get('guildos_demo_mode');
    if (demoCookie?.value === 'true') return true;
    if (demoCookie?.value === 'false') return false;
  } catch {
    // cookies() only works in App Router context
  }

  // Fall back to env var
  return process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
}
