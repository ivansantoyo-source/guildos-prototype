// ============================================================================
// GUILDOS — Demo-Aware URL Utility
// Centralized demo mode URL handling — every internal link must use this.
// ============================================================================

/**
 * Returns a demo-aware href.
 * In demo mode, appends ?demo=true to the URL.
 * In production mode, returns the URL unchanged.
 *
 * Usage:
 *   import { demoHref } from '@/lib/utils/url';
 *   <Link href={demoHref('/dashboard')}>Dashboard</Link>
 */
export function demoHref(path: string): string {
  if (typeof window === 'undefined') return path;

  // Check demo mode from multiple sources (priority order)
  const isDemo = checkDemoMode();

  if (!isDemo) return path;

  // Already has demo param
  if (path.includes('?demo=true') || path.includes('&demo=true')) return path;

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}demo=true`;
}

/**
 * Client-side demo mode check without Zustand dependency.
 * Priority: URL param > cookie > localStorage > env var
 */
function checkDemoMode(): boolean {
  try {
    // 1. URL param (highest priority)
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') return true;
    if (params.get('demo') === 'false') return false;

    // 2. Cookie
    if (document.cookie.includes('guildos_demo_mode=true')) return true;
    if (document.cookie.includes('guildos_demo_mode=false')) return false;

    // 3. localStorage Zustand preference
    const stored = localStorage.getItem('guildos-store');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed?.state?.demoMode === 'boolean') {
        return parsed.state.demoMode;
      }
    }
  } catch {
    // Fall through to env var
  }

  // 4. Env var default — only demo when explicitly 'true'
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * React hook for demo-aware hrefs.
 * Re-renders when demo mode changes.
 */
export { demoHref as useDemoHref };

/**
 * Check if we're currently in demo mode (synchronous, client-side only).
 * Use this for conditional rendering, not for hrefs.
 */
export function isCurrentlyDemoMode(): boolean {
  if (typeof window === 'undefined') return true;
  return checkDemoMode();
}

/**
 * Persist demo mode across navigations.
 * Call this once on app initialization.
 */
export function persistDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    document.cookie = `guildos_demo_mode=${enabled}; path=/; max-age=86400; SameSite=Lax`;
    const url = new URL(window.location.href);
    if (enabled && url.searchParams.get('demo') !== 'true') {
      url.searchParams.set('demo', 'true');
      window.history.replaceState({}, '', url.toString());
    }
    if (!enabled && url.searchParams.has('demo')) {
      url.searchParams.delete('demo');
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    // Silently fail — cookie/URL persistence is best-effort
  }
}
