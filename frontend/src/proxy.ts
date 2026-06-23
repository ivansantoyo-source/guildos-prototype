import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

// ============================================================================
// GUILDOS PROXY MIDDLEWARE — v2.1
// Handles: demo mode bypass, Supabase auth, subdomain routing, auth gate
// ============================================================================

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || 'guildos.local';

  // --- 0. Demo Mode Detection (Multi-source with explicit priority) ---
  // Priority: URL param > cookie > env var
  // The URL param is the user's EXPLICIT choice — it always wins.
  const cookieHeader = request.headers.get('cookie') || '';
  const demoParam = url.searchParams.get('demo');
  const hasDemoCookie = cookieHeader.includes('guildos_demo_mode=true');
  const hasDemoFalseCookie = cookieHeader.includes('guildos_demo_mode=false');
  const envDemoDefault = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

  // Explicit URL param takes precedence
  let isDemoRequest: boolean;
  if (demoParam === 'true') {
    isDemoRequest = true;
  } else if (demoParam === 'false') {
    isDemoRequest = false;
  } else if (hasDemoFalseCookie) {
    // User explicitly disabled demo mode
    isDemoRequest = false;
  } else if (hasDemoCookie) {
    // User explicitly enabled demo mode via cookie
    isDemoRequest = true;
  } else {
    // Fall back to env var default
    isDemoRequest = envDemoDefault;
  }

  // If demo cookie exists but URL doesn't reflect it, redirect to sync URL
  // This ensures the URL bar always shows the correct state
  if (isDemoRequest && demoParam !== 'true' && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/_next/')) {
    const demoUrl = url.clone();
    demoUrl.searchParams.set('demo', 'true');
    return NextResponse.redirect(demoUrl);
  }

  // If demo was explicitly disabled but URL still has ?demo=true, clean it up
  if (!isDemoRequest && demoParam === 'true' && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/_next/')) {
    const cleanUrl = url.clone();
    cleanUrl.searchParams.delete('demo');
    return NextResponse.redirect(cleanUrl);
  }

  // --- 1. Supabase Session Refresh (skip in demo — no auth needed) ---
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let user = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip Supabase entirely in demo mode — saves latency and avoids auth errors
  if (!isDemoRequest && supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch {
      // Supabase not available — continue without auth (graceful degradation)
      console.warn('[proxy] Supabase auth check failed — continuing without auth');
    }
  }

  // --- 2. Subdomain / Tenant Resolution ---
  const currentHost =
    process.env.NODE_ENV === 'production' && process.env.VERCEL === '1'
      ? hostname.replace(`.guildos.com`, '')
      : hostname.replace(`.localhost:3000`, '');

  const isSubdomain =
    currentHost !== 'localhost:3000' &&
    currentHost !== 'guildos.com' &&
    currentHost !== 'guildos.local' &&
    currentHost !== hostname;

  if (isSubdomain) {
    response.headers.set('x-tenant-subdomain', currentHost);
    const newUrl = url.clone();
    newUrl.pathname = `/${currentHost}${url.pathname}`;
    // Preserve demo param in subdomain rewrites
    if (isDemoRequest) {
      newUrl.searchParams.set('demo', 'true');
    }
    return NextResponse.rewrite(newUrl, {
      headers: response.headers,
    });
  }

  // --- 3. Protected Routes (auth gate — skipped in demo mode) ---
  if (!isDemoRequest && supabaseUrl && supabaseAnonKey) {
    const protectedPaths = [
      '/dashboard', '/inventory', '/bounty-board', '/nexus',
      '/shopkeeper', '/analytics', '/profile', '/settings',
    ];
    const isProtectedRoute = protectedPaths.some((path) =>
      url.pathname.startsWith(path)
    );

    if (isProtectedRoute && !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', url.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // --- 4. Set demo cookie on response (persists across sessions for 7 days) ---
  // Always set the cookie to keep it fresh
  response.cookies.set('guildos_demo_mode', isDemoRequest ? 'true' : 'false', {
    path: '/',
    maxAge: 604800, // 7 days
    sameSite: 'lax',
    httpOnly: false, // client-side needs to read it for URL sync
  });

  // --- 5. Security headers for production ---
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Demo-Mode', isDemoRequest ? 'true' : 'false');
  }

  return response;
}

// Next.js 16 uses proxy.ts instead of middleware.ts.
// The default export and config named export are the entry points.
export default proxy;
