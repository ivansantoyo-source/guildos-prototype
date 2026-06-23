"use client";

// ============================================================================
// GUILDOS — Discord Integration
// OAuth login, role sync bot, webhook notifications
// ============================================================================

import { isDemoMode } from '@/lib/toggles';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  email?: string;
  guilds?: DiscordGuild[];
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: number;
}

export interface DiscordRoleSyncConfig {
  guildId: string;
  levelTiers: {
    PEASANT: string | null;
    RETRO_MAGE: string;
    TIME_LORD: string;
  };
  enabled: boolean;
}

/**
 * Generate Discord OAuth2 authorization URL.
 */
export function getDiscordOAuthURL(): string {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/callback`;
  const scope = 'identify email guilds';

  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
}

/**
 * Exchange OAuth code for Discord user profile.
 */
export async function exchangeDiscordCode(code: string): Promise<DiscordUser> {
  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 500));
    return {
      id: 'demo-discord-12345',
      username: 'DemoGamer#9999',
      discriminator: '9999',
      email: 'demo@discord.com',
    };
  }

  const res = await fetch('/api/discord/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) throw new Error('Discord auth failed');
  return res.json();
}

/**
 * Update a user's Discord role based on their GuildOS level tier.
 */
export async function updateDiscordRole(
  discordUserId: string,
  guildId: string,
  roleId: string,
  action: 'add' | 'remove',
): Promise<void> {
  if (isDemoMode()) {
    console.log(`[Discord] ${action} role ${roleId} for user ${discordUserId} in guild ${guildId}`);
    return;
  }

  await fetch('/api/discord/role-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discord_user_id: discordUserId, guild_id: guildId, role_id: roleId, action }),
  });
}

/**
 * Send a notification to a Discord channel via webhook.
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  message: string,
  embed?: Record<string, unknown>,
): Promise<void> {
  if (isDemoMode()) {
    console.log('[Discord Notification]', message);
    return;
  }

  await fetch('/api/discord/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhook_url: webhookUrl, message, embed }),
  });
}

/**
 * Get the Discord role ID for a given GuildOS level tier.
 */
export function getRoleIdForTier(tier: string, config: DiscordRoleSyncConfig): string | null {
  switch (tier) {
    case 'TIME_LORD':
      return config.levelTiers.TIME_LORD;
    case 'RETRO_MAGE':
      return config.levelTiers.RETRO_MAGE;
    default:
      return config.levelTiers.PEASANT;
  }
}

/**
 * Default role sync configuration.
 */
export function getDefaultRoleSyncConfig(guildId: string): DiscordRoleSyncConfig {
  return {
    guildId,
    levelTiers: {
      PEASANT: null, // no special role
      RETRO_MAGE: '', // merchant sets this
      TIME_LORD: '', // merchant sets this
    },
    enabled: false,
  };
}
