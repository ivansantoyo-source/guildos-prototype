"use client";

// ============================================================================
// GUILDOS — Audit Logging
// Track all sensitive actions for security and compliance
// ============================================================================

import { isDemoMode } from '@/lib/toggles';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PAYMENT'
  | 'REFUND'
  | 'BOOKING'
  | 'IDENTITY_VERIFY'
  | 'WAIVER_ACCEPT'
  | 'PERMISSION_CHANGE'
  | 'BOUNTY_CLAIM'
  | 'BOUNTY_FULFILL'
  | 'LFG_JOIN'
  | 'LFG_HOST'
  | 'SETTINGS_CHANGE'
  | 'STATION_BOOK';

export interface AuditLogEntry {
  id: string;
  organization_id: string;
  profile_id: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Log an auditable action.
 * In demo mode, logs to console.
 * In production, POSTs to audit_log table via API.
 */
export async function logAction(params: {
  organizationId: string;
  profileId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const entry = {
    organization_id: params.organizationId,
    profile_id: params.profileId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    metadata: params.metadata,
    created_at: new Date().toISOString(),
  };

  if (isDemoMode()) {
    console.log('[Audit]', entry.action, entry.resource_type, entry.resource_id);
    return;
  }

  try {
    await fetch('/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    console.error('[Audit] Failed to log action:', err);
  }
}

/**
 * Get audit trail for a specific resource.
 */
export async function getAuditTrail(
  resourceType: string,
  resourceId: string,
): Promise<AuditLogEntry[]> {
  if (isDemoMode()) {
    return [];
  }

  const res = await fetch(`/api/audit/trail?resource_type=${resourceType}&resource_id=${resourceId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.entries ?? [];
}

/**
 * Get recent actions by a user.
 */
export async function getUserActions(profileId: string, limit: number = 20): Promise<AuditLogEntry[]> {
  if (isDemoMode()) {
    return [];
  }

  const res = await fetch(`/api/audit/user/${profileId}?limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.entries ?? [];
}
