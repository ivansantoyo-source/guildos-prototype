// ============================================================================
// GUILDOS — Server-Side Authentication Utilities
// API route wrapper helpers for auth, validation, and rate limiting
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isDemoModeServer } from '@/lib/toggles/server';
import { requireRole, getDemoSession } from '@/lib/auth/roles';
import { validateBody } from '@/lib/validation/schemas';
import { rateLimit } from '@/lib/security/rate-limit';
import type { UserSession, UserRole } from '@/lib/auth/roles';
import type { ZodSchema } from 'zod';
import type { Session } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface ServerSession {
  /** Raw Supabase session object (null in demo mode) */
  session: Session | null;
  /** Authenticated user information */
  user: {
    id: string;
    email?: string;
  };
  /** Application-level user with role and organization_id */
  dbUser: UserSession;
  // Convenience flattened accessors (mirrors dbUser)
  id: string;
  organization_id: string;
  role: UserRole;
  faction?: string;
  level_tier?: string;
  isDemo: boolean;
}

/**
 * Extended NextRequest with validated data attached by withHardening.
 * Cast the request in your handler to access typed data:
 *
 * @example
 * const data = (req as ValidatedNextRequest<typeof InventorySchema.type>).validatedData;
 */
export interface ValidatedNextRequest<T = unknown> extends NextRequest {
  validatedData: T;
}

// ============================================================================
// getServerSession — Get authenticated session from the server
// ============================================================================

/**
 * Creates a Supabase server client, retrieves the current session, and returns
 * session + user information. In demo mode, returns a mock demo session
 * (role='owner', org='demo-time-warp-001'). Returns null if no session exists
 * and not in demo mode.
 *
 * @param request - Optional NextRequest to extract searchParams for demo detection
 * @returns ServerSession with raw session, user, and app-level user info, or null
 *          if not authenticated and not in demo mode
 */
export async function getServerSession(request?: NextRequest): Promise<ServerSession | null> {
  const searchParams = request?.nextUrl.searchParams;
  const demoMode = await isDemoModeServer(searchParams);

  if (demoMode) {
    const dbUser = getDemoSession('owner');
    return {
      session: null,
      user: { id: dbUser.id, email: 'demo@guildos.local' },
      dbUser,
      // Flattened convenience fields
      id: dbUser.id,
      organization_id: dbUser.organization_id,
      role: dbUser.role,
      faction: dbUser.faction,
      level_tier: dbUser.level_tier,
      isDemo: true,
    };
  }

  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const dbUser: UserSession = {
    id: user?.id ?? session.user.id,
    organization_id: (user?.app_metadata?.organization_id as string) ?? session.user.id,
    role: (user?.app_metadata?.role as UserRole) ?? 'customer',
  };

  return {
    session,
    user: {
      id: session.user.id,
      email: user?.email ?? session.user.email,
    },
    dbUser,
    // Flattened convenience fields
    id: dbUser.id,
    organization_id: dbUser.organization_id,
    role: dbUser.role,
    faction: dbUser.faction,
    level_tier: dbUser.level_tier,
    isDemo: false,
  };
}

// ============================================================================
// requireAuth — Check authorization, return NextResponse or null
// ============================================================================

/**
 * Checks if a session exists and whether the user has one of the required roles.
 *
 * @param session - The session from getServerSession()
 * @param roles - Optional list of allowed roles. When omitted, any authenticated
 *                user passes (just checks authentication, no role restriction).
 * @returns NextResponse with 401 or 403 JSON on failure, or null if authorized
 *
 * @example
 * const authError = requireAuth(session, ['admin', 'owner']);
 * if (authError) return authError;
 */
export function requireAuth(
  session: ServerSession | null,
  roles?: UserRole[]
): NextResponse | null {
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (roles && roles.length > 0) {
    const check = requireRole(session.dbUser, ...roles);
    if (!check.authorized) {
      return NextResponse.json(
        { error: check.error ?? 'Insufficient permissions' },
        { status: 403 }
      );
    }
  }

  return null;
}

// ============================================================================
// withAuth — Higher-order function for auth-enforced routes
// ============================================================================

type AuthHandler = (req: NextRequest, session: ServerSession) => Promise<NextResponse>;

/**
 * Wraps an API route handler with authentication.
 * Calls getServerSession() and requireAuth() before executing the handler.
 * Passes the authenticated session as the second argument to the handler.
 *
 * @param handler - Route handler receiving (request, session)
 * @param roles - Optional list of allowed roles. When omitted, any authenticated
 *                user passes.
 * @returns Wrapped handler
 *
 * @example
 * export const GET = withAuth(async (req, session) => {
 *   return NextResponse.json({ user: session.dbUser });
 * }, ['admin', 'owner']);
 */
export function withAuth(
  handler: AuthHandler,
  roles?: UserRole[]
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getServerSession(req);
    const authError = requireAuth(session, roles);
    if (authError) return authError;
    return handler(req, session!);
  };
}

// ============================================================================
// withValidation — Higher-order function for body validation
// ============================================================================

type ValidatedHandler<T> = (
  req: NextRequest,
  session: ServerSession | null,
  data: T
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with Zod schema validation.
 * Parses the request body and validates it against the provided schema.
 * Passes validated data as the third argument to the handler.
 * Returns 400 on validation failure.
 *
 * @param handler - Route handler receiving (request, session, validatedData)
 * @param schema - Zod schema to validate the request body against
 * @returns Wrapped handler
 *
 * @example
 * export const POST = withValidation(
 *   async (req, session, data) => {
 *     return NextResponse.json({ received: data });
 *   },
 *   InventorySchema
 * );
 */
export function withValidation<T>(
  handler: ValidatedHandler<T>,
  schema: ZodSchema<T>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getServerSession(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body — expected JSON' },
        { status: 400 }
      );
    }

    const result = validateBody(schema, body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.errors },
        { status: 400 }
      );
    }

    return handler(req, session, result.data);
  };
}

// ============================================================================
// withRateLimit — Higher-order function for rate limiting
// ============================================================================

type RateLimitedHandler = (req: NextRequest, session: ServerSession | null) => Promise<NextResponse>;

/**
 * Wraps an API route handler with distributed rate limiting.
 * Uses the rateLimit utility from @/lib/security/rate-limit which supports
 * Vercel KV in production with an in-memory fallback for development.
 * Returns 429 when the rate limit is exceeded.
 *
 * @param handler - Route handler receiving (request, session)
 * @param key - Rate limit key (e.g., endpoint name or user/IP identifier)
 * @param maxRequests - Maximum requests allowed within the window
 * @param windowMs - Time window in milliseconds
 * @returns Wrapped handler
 *
 * @example
 * export const POST = withRateLimit(
 *   async (req, session) => {
 *     return NextResponse.json({ ok: true });
 *   },
 *   'my-endpoint',
 *   10,
 *   60_000
 * );
 */
export function withRateLimit(
  handler: RateLimitedHandler,
  key: string,
  maxRequests: number,
  windowMs: number
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getServerSession(req);

    if (await rateLimit(key, { maxRequests, windowMs })) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfterMs: windowMs },
        { status: 429 }
      );
    }

    return handler(req, session);
  };
}

// ============================================================================
// withHardening — Convenience wrapper
// Chains withAuth, withValidation, and withRateLimit based on options
// ============================================================================

export interface HardeningOptions<T = unknown> {
  /** Allowed roles for auth check. Omit to allow any authenticated user. */
  roles?: UserRole[];
  /** Zod schema for request body validation. When provided, validated data is
   *  attached to the request as `(req as ValidatedNextRequest<T>).validatedData`. */
  schema?: ZodSchema<T>;
  /** Rate limiting configuration */
  rateLimit?: {
    /** Rate limit key (e.g., endpoint name or user/IP identifier) */
    key: string;
    /** Maximum requests within the window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
  };
}

/**
 * Convenience wrapper that composes withAuth, withValidation, and withRateLimit
 * into a single function based on the provided options.
 *
 * Order of execution (outermost to innermost):
 *   1. Rate limit check — rejects with 429 if exceeded
 *   2. Authentication + role check — rejects with 401/403 if unauthorized
 *   3. Request body validation — rejects with 400 if invalid
 *   4. Handler — executes with session and optional validated data
 *
 * When a schema is provided, the request body is cloned before reading so the
 * handler can still call req.json(). Validated data is also available on
 * `(req as ValidatedNextRequest<T>).validatedData`.
 *
 * @param handler - Route handler receiving (request, session)
 * @param options - Hardening options for auth, validation, and rate limiting
 * @returns Fully wrapped handler
 *
 * @example
 * export const POST = withHardening(
 *   async (req, session) => {
 *     const data = (req as ValidatedNextRequest<typeof InventorySchema.type>).validatedData;
 *     return NextResponse.json({ saved: data });
 *   },
 *   {
 *     roles: ['admin', 'owner'],
 *     schema: InventorySchema,
 *     rateLimit: { key: 'inventory-create', maxRequests: 30, windowMs: 60_000 },
 *   }
 * );
 */
export function withHardening<T = unknown>(
  handler: AuthHandler,
  options: HardeningOptions<T>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    // 1. Rate limit (outermost check)
    if (options.rateLimit) {
      if (await rateLimit(options.rateLimit.key, {
        maxRequests: options.rateLimit.maxRequests,
        windowMs: options.rateLimit.windowMs,
      })) {
        return NextResponse.json(
          { error: 'Too many requests', retryAfterMs: options.rateLimit.windowMs },
          { status: 429 }
        );
      }
    }

    // 2. Authentication + role check
    const session = await getServerSession(req);
    const authError = requireAuth(session, options.roles);
    if (authError) return authError;

    // 3. Request body validation
    if (options.schema) {
      // Clone the request so the original body stream remains readable
      // for both validatedData consumers and manual req.json() calls.
      let body: unknown;
      try {
        const cloned = req.clone();
        body = await cloned.json();
      } catch {
        return NextResponse.json(
          { error: 'Invalid request body — expected JSON' },
          { status: 400 }
        );
      }

      const result = validateBody(options.schema, body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: result.errors },
          { status: 400 }
        );
      }

      // Attach validated data to the original request for the handler
      Object.defineProperty(req, 'validatedData', {
        value: result.data,
        writable: false,
        configurable: true,
      });
    }

    // 4. Execute handler
    return handler(req, session!);
  };
}
