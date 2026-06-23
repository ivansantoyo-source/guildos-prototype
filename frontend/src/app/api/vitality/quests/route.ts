// ============================================================================
// GET /api/vitality/quests — Available vitality quests
// POST /api/vitality/quests — Complete a vitality quest (validate QR hash)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import { getDemoQuests, validateQuestQR, getCooldownEnd } from '@/lib/vitality/quests';
import { calculateXPReward } from '@/lib/vitality/xp-engine';
import { standardError, handleApiError } from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return standardError(401, 'Auth required');

  const demo = await isDemoModeServer(searchParams);
  if (demo) return NextResponse.json({ quests: getDemoQuests() });

  try {
    const supabase = await createClient();
    const { data } = await supabase.from('vitality_quests').select('*').eq('organization_id', session.organization_id).eq('is_active', true);
    return NextResponse.json({ quests: data || [] });
  } catch (err) {
    return handleApiError(err, '[Vitality:GET]');
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return standardError(401, 'Auth required');

  const body = await request.json().catch(() => ({}));
  const { quest_id, qr_hash } = body;
  if (!quest_id) return standardError(400, 'quest_id is required');

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    const quest = getDemoQuests().find((q) => q.id === quest_id);
    if (!quest) return standardError(404, 'Quest not found');
    if (qr_hash && !validateQuestQR(quest, qr_hash)) {
      return standardError(400, 'Invalid QR code');
    }
    const xp = quest.xp_reward;
    const stamina = quest.stamina_restore;
    return NextResponse.json({
      success: true,
      xp_earned: xp,
      stamina_restored: stamina,
      cooldown_ends: getCooldownEnd(quest),
    });
  }

  try {
    const supabase = await createClient();

    // Validate quest exists and is active
    const { data: quest } = await supabase.from('vitality_quests').select('*').eq('id', quest_id).eq('is_active', true).single();
    if (!quest) return standardError(404, 'Quest not found or inactive');

    // Validate QR hash if provided
    if (qr_hash && quest.qr_code_hash && qr_hash !== quest.qr_code_hash) {
      return standardError(400, 'Invalid QR code');
    }

    // Check cooldown — last completion must be > cooldown_minutes ago
    const cooldownAgo = new Date(Date.now() - quest.cooldown_minutes * 60 * 1000).toISOString();
    const { data: recent } = await supabase.from('vitality_completions').select('id').eq('profile_id', session.id).eq('quest_id', quest_id).gt('completed_at', cooldownAgo).limit(1);
    if (recent && recent.length > 0) {
      return standardError(429, 'Quest still on cooldown');
    }

    // Record completion
    const xp = quest.xp_reward || 50;
    const stamina = quest.stamina_restore || 20;
    await supabase.from('vitality_completions').insert({ profile_id: session.id, quest_id, xp_earned: xp, stamina_restored: stamina });
    await supabase.from('xp_transactions').insert({ profile_id: session.id, amount: xp, source: 'VITALITY_QUEST', reference_type: 'vitality_quest', reference_id: quest_id });

    return NextResponse.json({
      success: true,
      xp_earned: xp,
      stamina_restored: stamina,
      cooldown_ends: new Date(Date.now() + quest.cooldown_minutes * 60 * 1000).toISOString(),
    });
  } catch (err) {
    return handleApiError(err, '[Vitality:POST]');
  }
}
