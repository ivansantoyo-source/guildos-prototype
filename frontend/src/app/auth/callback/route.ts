import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  let redirectTo = searchParams.get("redirect") || "/dashboard";
  // Prevent open redirect — only allow relative paths
  if (redirectTo.startsWith("//") || redirectTo.startsWith("http:") || redirectTo.startsWith("https:")) {
    redirectTo = "/dashboard";
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return Response.redirect(new URL(redirectTo, request.url));
    }
  }

  // Redirect to login on error
  return Response.redirect(new URL("/login?error=auth_failed", request.url));
}
