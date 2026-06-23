// ============================================================================
// POST /api/security/csp-report — Receives CSP violation reports
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    // Log CSP violations for security monitoring
    if (body?.['csp-report']) {
      const report = body['csp-report'];

      try {
        const supabase = await createClient();
        await supabase.from('csp_violations').insert({
          blocked_uri: report['blocked-uri']?.slice(0, 2048),
          violated_directive: report['violated-directive']?.slice(0, 256),
          document_uri: report['document-uri']?.slice(0, 2048),
          source_file: report['source-file']?.slice(0, 2048),
          line_number: report['line-number'] || null,
        });
      } catch {
        // If DB insert fails, at least log to console for monitoring
        console.warn('[CSP Violation]', JSON.stringify(report));
      }
    }

    // Always return 204 (no content) per CSP spec
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
