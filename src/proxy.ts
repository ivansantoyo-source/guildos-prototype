import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || 'guildos.local';

  // Get the subdomain (e.g., "timewarp.guildos.com" -> "timewarp")
  const currentHost =
    process.env.NODE_ENV === 'production' && process.env.VERCEL === '1'
      ? hostname.replace(`.guildos.com`, '')
      : hostname.replace(`.localhost:3000`, '');

  // If there's a subdomain (tenant), rewrite the URL to /app/[tenant]/path
  if (currentHost !== 'localhost:3000' && currentHost !== 'guildos.com' && currentHost !== 'guildos.local') {
    url.pathname = `/${currentHost}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Otherwise, proceed to landing page or generic root
  return NextResponse.next();
}
