import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isDemoMode } from '@/lib/toggles';
import { withHardening } from '@/lib/auth/server-auth';
import { IoTTriggerSchema } from '@/lib/validation/schemas';
import type { ValidatedNextRequest } from '@/lib/auth/server-auth';

/**
 * POST /api/iot/trigger
 * IoT Webhook System — fires smart device triggers when a "Grail" item (market_value >= $150)
 * is scanned or acquired. Communicates with Make/Zapier → Govee/Philips Hue + smart speaker.
 *
 * Auth: admin or owner role required
 * Rate: 30 requests per minute
 */
export const POST = withHardening(
  async (req, session) => {
    try {
      const data = (req as ValidatedNextRequest<z.infer<typeof IoTTriggerSchema>>).validatedData;

      if (isDemoMode()) {
        const actionPayload = data.action_payload || {
          light_hex: '#FFD700',
          light_pulse_ms: 3000,
          audio_url: 'https://cdn.guildos.com/assets/sfx/legendary_drop.mp3',
        };

        console.log(
          `%c[IoT DEMO] %cLegendary drop! %c${data.item_name} %c($${data.market_value})`,
          'color: gold; font-size: 16px;',
          'color: white;',
          'color: gold; font-weight: bold;',
          'color: white;'
        );
        console.log(`  → Light: ${actionPayload.light_hex}, Pulse: ${actionPayload.light_pulse_ms}ms`);
        console.log(`  → Audio: ${actionPayload.audio_url}`);

        return NextResponse.json({
          success: true,
          source: 'mock-iot',
          message: `IoT trigger fired: ${data.event}`,
          action: {
            light: `Pulsing ${actionPayload.light_hex} for ${actionPayload.light_pulse_ms}ms`,
            audio: actionPayload.audio_url,
          },
        });
      }

      // Production: POST to tenant's configured IoT webhook URL
      // Include organization_id in the payload for tenant-scoped routing
      const iotWebhookUrl = process.env.IOT_WEBHOOK_URL;
      if (iotWebhookUrl) {
        try {
          const res = await fetch(iotWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              organization_id: session.dbUser.organization_id,
            }),
          });
          const status = res.ok ? 'delivered' : 'failed';
          return NextResponse.json({ success: res.ok, status, source: 'live-iot' });
        } catch (err) {
          console.error('[IoT] Webhook error:', err);
          return NextResponse.json(
            { success: false, error: 'Unable to process request' },
            { status: 502 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        source: 'live-iot',
        message: 'IoT trigger processed (no webhook URL configured)',
      });
    } catch (error) {
      console.error('[IoT] Trigger error:', error);
      return NextResponse.json(
        { success: false, error: 'Unable to process request' },
        { status: 500 }
      );
    }
  },
  {
    roles: ['admin', 'owner'],
    schema: IoTTriggerSchema,
    rateLimit: { key: 'iot-trigger', maxRequests: 30, windowMs: 60_000 },
  }
);
