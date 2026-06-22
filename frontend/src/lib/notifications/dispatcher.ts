// ============================================================================
// GUILDOS — Notification Dispatcher
// Handles in-app notifications and external webhook triggers
// ============================================================================

import type { Notification, NotificationType } from '@/lib/types';
import { useGuildStore } from '@/lib/store/useGuildStore';
import { isDemoMode } from '@/lib/toggles';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Dispatch a notification — stores in Zustand and optionally fires external webhooks.
 * In demo mode, logs to console and stores in-memory.
 * In production, would also POST to Supabase notifications table.
 */
export function dispatchNotification(payload: NotificationPayload): void {
  const store = useGuildStore.getState();
  const orgId = store.tenant?.id ?? 'demo-time-warp-001';

  const notification: Notification = {
    id: `not-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    organization_id: orgId,
    user_id: payload.userId ?? 'system',
    type: payload.type,
    title: payload.title,
    message: payload.message ?? undefined,
    metadata: payload.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  // Store in Zustand
  store.setNotifications([notification, ...store.notifications]);

  // Special handling for specific notification types
  switch (payload.type) {
    case 'GRAIL_DROP':
      handleGrailDrop(notification);
      break;
    case 'PRICE_SPIKE':
      handlePriceSpike(notification);
      break;
    case 'SCORE_DETHRONED':
      handleScoreDethroned(notification);
      break;
    case 'ORACLE_MATCH':
      handleOracleMatch(notification);
      break;
    case 'FACTION_WIN':
      handleFactionWin(notification);
      break;
    default:
      break;
  }

  if (isDemoMode()) {
    console.log(`[DEMO NOTIFICATION] ${payload.type}: ${payload.title}`, payload);
  }
}

// --- Special handlers ---

function handleGrailDrop(notification: Notification): void {
  // In production: POST to IoT webhook URL for light pulse + audio
  const store = useGuildStore.getState();
  const webhookUrl = store.tenant?.iot_webhook_url;

  if (webhookUrl && !isDemoMode()) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'loot_drop_legendary',
        tenant_id: notification.organization_id,
        item_name: notification.metadata?.item_name ?? 'Unknown Item',
        market_value: notification.metadata?.market_value ?? 0,
        action_payload: {
          light_hex: '#FFD700',
          light_pulse_ms: 3000,
          audio_url: 'https://cdn.guildos.com/assets/sfx/legendary_drop.mp3',
        },
      }),
    }).catch((err) => console.error('IoT webhook failed:', err));
  } else if (isDemoMode()) {
    console.log(
      `%c💎 LEGENDARY DROP! %c${notification.metadata?.item_name ?? 'Unknown'} %cat $${notification.metadata?.market_value ?? '??'}`,
      'color: gold; font-size: 18px;',
      'color: white;',
      'color: gold;'
    );
    console.log('   [IoT Simulated] Gold lights pulse for 3s, legendary_drop.mp3 plays');
  }
}

function handlePriceSpike(notification: Notification): void {
  if (isDemoMode()) {
    console.log(
      `%c📈 PRICE SPIKE! %c${notification.message}`,
      'color: red; font-weight: bold;',
      'color: white;'
    );
  }
}

function handleScoreDethroned(notification: Notification): void {
  if (isDemoMode()) {
    console.log(
      `%c🏆 SCORE DETHRONED! %c${notification.message}`,
      'color: purple; font-weight: bold;',
      'color: white;'
    );
  }
  // In production: also trigger SMS via Twilio
}

function handleOracleMatch(notification: Notification): void {
  if (isDemoMode()) {
    console.log(
      `%c🔮 ORACLE MATCH! %c${notification.message}`,
      'color: cyan; font-weight: bold;',
      'color: white;'
    );
  }
}

function handleFactionWin(notification: Notification): void {
  if (isDemoMode()) {
    console.log(
      `%c⚔️ FACTION WAR OVER! %c${notification.message}`,
      'color: orange; font-size: 16px;',
      'color: white;'
    );
  }
}

/**
 * Dispatch a notification and return it (for API route usage).
 */
export function createNotification(payload: NotificationPayload): Notification {
  const store = useGuildStore.getState();
  const orgId = store.tenant?.id ?? 'demo-time-warp-001';

  return {
    id: `not-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    organization_id: orgId,
    user_id: payload.userId ?? 'system',
    type: payload.type,
    title: payload.title,
    message: payload.message ?? undefined,
    metadata: payload.metadata ?? {},
    created_at: new Date().toISOString(),
  };
}
