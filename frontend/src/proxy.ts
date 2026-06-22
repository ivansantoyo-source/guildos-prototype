import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets with extensions
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || 'guildos.local';

  // --- 1. Supabase Session Refresh ---
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let user = null;

  // Gracefully skip Supabase if env vars aren't configured (demo mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
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
      // Supabase not available — continue in demo mode
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
    currentHost !== hostname; // not the bare host

  if (isSubdomain) {
    // Inject tenant ID header for downstream route handlers
    response.headers.set('x-tenant-subdomain', currentHost);

    // Rewrite to tenant-scoped routes
    const newUrl = url.clone();
    newUrl.pathname = `/${currentHost}${url.pathname}`;
    return NextResponse.rewrite(newUrl, {
      headers: response.headers,
    });
  }

  // --- 3. Protected Routes (require auth, only when Supabase is configured) ---
  if (supabaseUrl && supabaseAnonKey) {
    const protectedPaths = ['/dashboard', '/inventory', '/bounty-board', '/nexus', '/shopkeeper'];
    const isProtectedRoute = protectedPaths.some((path) =>
      url.pathname.startsWith(path)
    );

    if (isProtectedRoute && !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', url.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}
