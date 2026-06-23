import { NextRequest } from 'next/server';
import { isDemoMode } from '@/lib/toggles';

/**
 * POST /api/iot/trigger
 * IoT Webhook System — fires smart device triggers when a "Grail" item (market_value >= $150)
 * is scanned or acquired. Communicates with Make/Zapier → Govee/Philips Hue + smart speaker.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const required = ['event', 'tenant_id', 'item_name', 'market_value'];
    for (const field of required) {
      if (!payload[field]) {
        return Response.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (isDemoMode()) {
      const actionPayload = payload.action_payload || {
        light_hex: '#FFD700',
        light_pulse_ms: 3000,
        audio_url: 'https://cdn.guildos.com/assets/sfx/legendary_drop.mp3',
      };

      console.log(
        `%c[IoT DEMO] %cLegendary drop! %c${payload.item_name} %c($${payload.market_value})`,
        'color: gold; font-size: 16px;',
        'color: white;',
        'color: gold; font-weight: bold;',
        'color: white;'
      );
      console.log(`  → Light: ${actionPayload.light_hex}, Pulse: ${actionPayload.light_pulse_ms}ms`);
      console.log(`  → Audio: ${actionPayload.audio_url}`);

      return Response.json({
        success: true,
        source: 'mock-iot',
        message: `IoT trigger fired: ${payload.event}`,
        action: {
          light: `Pulsing ${actionPayload.light_hex} for ${actionPayload.light_pulse_ms}ms`,
          audio: actionPayload.audio_url,
        },
      });
    }

    // Production: POST to tenant's configured IoT webhook URL
    const iotWebhookUrl = process.env.IOT_WEBHOOK_URL;
    if (iotWebhookUrl) {
      try {
        const res = await fetch(iotWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const status = res.ok ? 'delivered' : 'failed';
        return Response.json({ success: res.ok, status, source: 'live-iot' });
      } catch (err) {
        console.error('[IoT] Webhook error:', err);
        return Response.json(
          { success: false, error: 'Unable to process request' },
          { status: 502 }
        );
      }
    }

    return Response.json({
      success: true,
      source: 'live-iot',
      message: 'IoT trigger processed (no webhook URL configured)',
    });
  } catch (error) {
    console.error('[IoT] Trigger error:', error);
    return Response.json(
      { success: false, error: 'Unable to process request' },
      { status: 500 }
    );
  }
}
