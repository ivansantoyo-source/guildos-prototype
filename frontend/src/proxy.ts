import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || 'guildos.local';

  // --- 0. Demo Mode Detection ---
  // Priority: URL param > cookie > env var
  // Read cookie manually (more reliable across Next.js versions)
  const cookieHeader = request.headers.get('cookie') || '';
  const demoParam = url.searchParams.get('demo');
  const hasDemoCookie = cookieHeader.includes('guildos_demo_mode=true');
  const isDemoRequest =
    demoParam === 'true' ||
    hasDemoCookie ||
    process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

  // If demo cookie is set but URL doesn't have ?demo=true, add it via redirect
  if (hasDemoCookie && demoParam !== 'true' && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/_next/')) {
    const demoUrl = url.clone();
    demoUrl.searchParams.set('demo', 'true');
    return NextResponse.redirect(demoUrl);
  }

  // --- 1. Supabase Session Refresh ---
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let user = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip Supabase entirely in demo mode — no auth needed
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
      // Supabase not available — continue without auth
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
    // Preserve demo param in rewrites
    if (isDemoRequest) {
      newUrl.searchParams.set('demo', 'true');
    }
    return NextResponse.rewrite(newUrl, {
      headers: response.headers,
    });
  }

  // --- 3. Protected Routes (auth gate — skipped in demo) ---
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

  // --- 4. Set demo cookie on response (persists across navigations) ---
  if (isDemoRequest) {
    response.cookies.set('guildos_demo_mode', 'true', {
      path: '/',
      maxAge: 86400, // 24 hours
      sameSite: 'lax',
      httpOnly: false, // client-side needs to read it too
    });
  }

  return response;
}
