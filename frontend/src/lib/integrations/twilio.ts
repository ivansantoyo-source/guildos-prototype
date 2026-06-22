// ============================================================================
// GUILDOS — Twilio SMS Integration
// Wandering Merchant alerts, Score Dethroned notifications, Oracle matches
// ============================================================================

import { shouldUseMock } from '@/lib/toggles';

interface SMSResult {
  sid: string;
  status: string;
  to: string;
}

/**
 * Send a single SMS message.
 * In demo mode, logs to console with [DEMO SMS] prefix.
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<SMSResult> {
  if (shouldUseMock('sms')) {
    return mockSendSMS(to, message);
  }

  // Production: use Twilio API
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.warn('Twilio not configured — falling back to mock');
      return mockSendSMS(to, message);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: message }),
      }
    );

    const data = await response.json();

    return {
      sid: data.sid ?? `sms-${Date.now()}`,
      status: data.status ?? 'sent',
      to,
    };
  } catch (error) {
    console.error('Twilio error:', error);
    return mockSendSMS(to, message);
  }
}

/**
 * Wandering Merchant: send alerts to users within a 25-mile radius
 * containing active coordinates and a "Secret Password" validation string.
 */
export async function sendWanderingMerchantAlert(
  phoneNumbers: string[],
  location: { lat: number; lng: number; name: string }
): Promise<SMSResult[]> {
  const secretPassword = generateSecretPassword();
  const message =
    `[GUILDOS] A Wandering Merchant has appeared at ${location.name}!\n` +
    `Coordinates: ${location.lat}, ${location.lng}\n` +
    `Secret Password: ${secretPassword}\n` +
    `Reply with the password within the next 2 hours to claim your prize.`;

  if (shouldUseMock('sms')) {
    console.log(`%c[DEMO SMS] Wandering Merchant broadcast to ${phoneNumbers.length} users:`, 'color: orange;');
    console.log(`  Location: ${location.name} (${location.lat}, ${location.lng})`);
    console.log(`  Password: ${secretPassword}`);
    console.log(`  Message: ${message}`);
  }

  return Promise.all(phoneNumbers.map((to) => sendSMS(to, message)));
}

/**
 * Score Dethroned: notify a player their high score was beaten.
 */
export async function sendScoreDethronedAlert(
  phone: string,
  playerTag: string,
  game: string,
  newScore: number
): Promise<SMSResult> {
  const message =
    `[GUILDOS] Outclassed! Your #1 spot on ${game} has been stolen!\n` +
    `New reigning champion score: ${newScore.toLocaleString()}\n` +
    `Return to the Nexus to reclaim your title.`;

  return sendSMS(phone, message);
}

/**
 * Oracle Match: notify a user about a potential item match.
 */
export async function sendOracleAlert(
  phone: string,
  itemName: string,
  storeName: string
): Promise<SMSResult> {
  const message =
    `[THE ORACLE] A traveler has just sold a pristine copy of ${itemName} ` +
    `at ${storeName}. The patterns indicate this belongs in your collection.\n` +
    `Reply YES within 2 hours to hold this item at the counter.`;

  return sendSMS(phone, message);
}

// --- Helpers ---

function mockSendSMS(to: string, message: string): SMSResult {
  console.log(`%c[DEMO SMS] %cTo: ${to} %c— ${message.slice(0, 60)}...`,
    'color: orange; font-weight: bold;',
    'color: cyan;',
    'color: white;'
  );

  return {
    sid: `DEMO-SMS-${Date.now()}`,
    status: 'delivered (mock)',
    to,
  };
}

function generateSecretPassword(): string {
  const adjectives = ['Golden', 'Retro', 'Pixel', 'Neon', 'Crystal', 'Shadow', 'Cosmic', 'Turbo'];
  const nouns = ['Cartridge', 'Console', 'Joystick', 'Token', 'PowerUp', 'SavePoint', 'WarpZone', 'BossKey'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}${digits}`;
}
