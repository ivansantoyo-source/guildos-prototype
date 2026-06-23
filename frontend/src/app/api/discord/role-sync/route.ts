// ============================================================================
// POST /api/discord/role-sync — Sync Discord role based on GuildOS level tier
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';

const LEVEL_TO_DISCORD_ROLE: Record<string, string> = {
  PEASANT: '', // no special role
  RETRO_MAGE: 'retro_mage_role_id',
  TIME_LORD: 'time_lord_role_id',
};

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const demo = await isDemoModeServer(searchParams);
  const body = await request.json().catch(() => ({}));

  if (demo) {
    console.log('[Discord DEMO] Role sync:', body.discord_user_id, '→', body.level_tier || session.level_tier);
    return NextResponse.json({ success: true, action: 'demo_sync' });
  }

  try {
    const discordUserId = body.discord_user_id;
    if (!discordUserId) {
      return NextResponse.json({ error: 'discord_user_id is required' }, { status: 400 });
    }

    const guildId = process.env.DISCORD_GUILD_ID;
    if (!guildId) {
      return NextResponse.json({ error: 'Discord not configured' }, { status: 500 });
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.error('[Discord] DISCORD_BOT_TOKEN not configured');
      return NextResponse.json({ error: 'Discord bot not configured' }, { status: 500 });
    }

    const levelTier = body.level_tier || session.level_tier || 'PEASANT';
    const roleId = LEVEL_TO_DISCORD_ROLE[levelTier];

    if (!roleId) {
      return NextResponse.json({ success: true, action: 'no_role_needed' });
    }

    // Call Discord API to add role to member
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(discordUserId)}/roles/${encodeURIComponent(roleId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok && response.status !== 204) {
      // 204 means the member already has the role — that's fine
      const errorText = await response.text().catch(() => 'Unknown Discord API error');
      console.error(`[Discord] API error (${response.status}):`, errorText);
      return NextResponse.json({
        success: false,
        action: 'api_error',
        discordStatus: response.status,
        discordError: errorText.slice(0, 500),
      }, { status: 502 });
    }

    console.log(`[Discord] Synced role for user ${discordUserId}: ${levelTier} (role ${roleId})`);
    return NextResponse.json({ success: true, action: 'role_added', roleId });
  } catch (err) {
    console.error('[Discord] Role sync failed:', err);
    return NextResponse.json({ error: 'Discord role sync failed' }, { status: 500 });
  }
}
