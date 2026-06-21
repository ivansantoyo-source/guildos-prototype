import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // Without a code (e.g., standard login redirect), just check session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Read the tenant_id from the user metadata (as designed in architectural blueprint)
    // For prototyping, we'll assume the tenant subdomain matches a predefined logic
    // or we redirect to the tenant resolution endpoint.
    const tenantId = user.user_metadata?.tenant_id || "timewarp";
    
    // Redirect to the tenant's specific dashboard
    return NextResponse.redirect(`${origin}/${tenantId}/dashboard`)
  }

  // Fallback to login
  return NextResponse.redirect(`${origin}/login`)
}
