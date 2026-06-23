import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET /auth/callback — Handles both OAuth and Magic Link redirects
 *
 * OAuth flow: Supabase redirects here with ?code=... after OAuth sign-in.
 * Magic link flow: Supabase redirects here with ?token_hash=...&type=magiclink.
 *
 * Open redirect protection: only relative paths allowed for redirect_to.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Resolve redirect target with open-redirect protection
  const redirectParam = searchParams.get("redirect") || searchParams.get("next") || "/dashboard";
  let redirectTo = redirectParam;
  if (redirectTo.startsWith("//") || redirectTo.startsWith("http:") || redirectTo.startsWith("https:")) {
    redirectTo = "/dashboard";
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'guildos_core',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Headers may have been sent already
          }
        },
      },
    }
  );

  // 1. OAuth code exchange (Google, GitHub, Discord)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return Response.redirect(new URL(redirectTo, request.url));
    }
  }

  // 2. Magic link / recovery token verification
  if (token_hash && (type === "magiclink" || type === "recovery" || type === "signup")) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "magiclink" | "recovery" | "signup",
      token_hash,
    });

    if (!error) {
      return Response.redirect(new URL(redirectTo, request.url));
    }
  }

  // Redirect to login on error
  return Response.redirect(new URL("/login?error=auth_failed", request.url));
}
