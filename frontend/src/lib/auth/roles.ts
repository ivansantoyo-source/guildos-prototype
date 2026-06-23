// ============================================================================
// GUILDOS — Role-Based Access Control
// Pure functions — no client APIs, safe to import from server or client
// ============================================================================

export type UserRole = 'owner' | 'admin' | 'staff' | 'customer';

export interface UserSession {
  id: string;
  organization_id: string;
  role: UserRole;
  faction?: string;
  level_tier?: string;
}

/**
 * Check if a user has one of the required roles.
 */
export function requireRole(
  session: UserSession | null,
  ...roles: UserRole[]
): { authorized: boolean; error?: string } {
  if (!session) {
    return { authorized: false, error: 'Authentication required' };
  }

  if (!roles.includes(session.role)) {
    return { authorized: false, error: `Requires one of: ${roles.join(', ')}` };
  }

  return { authorized: true };
}

/**
 * Check if user is the org owner.
 */
export function isOwner(session: UserSession | null): boolean {
  return session?.role === 'owner';
}

/**
 * Check if user is an admin (owner or admin role).
 */
export function isAdmin(session: UserSession | null): boolean {
  return session?.role === 'owner' || session?.role === 'admin';
}

/**
 * Check if user can manage inventory.
 */
export function canManageInventory(session: UserSession | null): boolean {
  if (!session) return false;
  return ['owner', 'admin', 'staff'].includes(session.role);
}

/**
 * Check if user can manage bounties.
 */
export function canManageBounties(session: UserSession | null): boolean {
  if (!session) return false;
  return ['owner', 'admin', 'staff'].includes(session.role);
}

/**
 * Check if user can access settings (BYO keys, etc.).
 */
export function canAccessSettings(session: UserSession | null): boolean {
  return isAdmin(session);
}

/**
 * Check if user can verify identity (staff-level function).
 */
export function canVerifyIdentity(session: UserSession | null): boolean {
  if (!session) return false;
  return ['owner', 'admin', 'staff'].includes(session.role);
}

/**
 * Check if user can view analytics.
 */
export function canViewAnalytics(session: UserSession | null): boolean {
  return isAdmin(session);
}

/**
 * Get a demo session for testing.
 */
export function getDemoSession(role: UserRole = 'owner'): UserSession {
  return {
    id: 'demo-profile-001',
    organization_id: 'demo-time-warp-001',
    role,
    faction: 'SEGA_SYNDICATE',
    level_tier: 'RETRO_MAGE',
  };
}
