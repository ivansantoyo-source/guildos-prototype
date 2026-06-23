// ============================================================================
// GET /api/potions/menu — List potion menu items
// POST /api/potions/menu — Create menu item (admin only)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import type { PotionMenuItem } from '@/lib/types';
import { standardError, handleApiError } from '@/lib/api/errors';

const DEMO_ORG_ID = 'demo-time-warp-001';

const phantomMenu: PotionMenuItem[] = [
  { id: 'pm-001', organization_id: DEMO_ORG_ID, name: 'Brain Fuel Smoothie', description: 'Blueberry, banana, and lion\'s mane blend for peak cognitive performance.', category: 'SMOOTHIE', price: 8.99, vitality_boost: { energy: 25, focus: 30 }, is_active: true, created_at: new Date().toISOString() },
  { id: 'pm-002', organization_id: DEMO_ORG_ID, name: 'Zen Tea', description: 'Calming chamomile and lavender — reduces cortisol during intense gaming sessions.', category: 'TEA', price: 4.99, vitality_boost: { calm: 20, relaxation: 15 }, is_active: true, created_at: new Date().toISOString() },
  { id: 'pm-003', organization_id: DEMO_ORG_ID, name: 'Focus Nootropic', description: 'Our signature nootropic blend with L-theanine, alpha-GPC, and caffeine.', category: 'NOOTROPIC', price: 6.99, vitality_boost: { focus: 40, energy: 20 }, is_active: true, created_at: new Date().toISOString() },
  { id: 'pm-004', organization_id: DEMO_ORG_ID, name: 'Retro Gamer Meal', description: 'Classic comfort: grass-fed burger with sweet potato fries.', category: 'MEAL', price: 14.99, vitality_boost: { stamina: 35, satiety: 40 }, is_active: true, created_at: new Date().toISOString() },
  { id: 'pm-005', organization_id: DEMO_ORG_ID, name: 'Electrolyte Splash', description: 'Hydration formula with electrolytes and B vitamins.', category: 'HYDRATION', price: 3.99, vitality_boost: { hydration: 50 }, is_active: true, created_at: new Date().toISOString() },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return standardError(401, 'Auth required');

  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    const category = searchParams.get('category');
    let items = [...phantomMenu];
    if (category) {
      items = items.filter((i) => i.category === category);
    }
    return NextResponse.json({ data: items, count: items.length, source: 'demo' });
  }

  try {
    const supabase = await createClient();
    const category = searchParams.get('category');
    let query = supabase
      .from('potions_menu')
      .select('*')
      .eq('organization_id', session.organization_id)
      .order('category', { ascending: true })
      .order('price', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data || [], count: (data || []).length, source: 'production' });
  } catch (err) {
    return handleApiError(err, '[Potions:Menu:GET]');
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return standardError(401, 'Auth required');
  if (!['owner', 'admin'].includes(session.role)) {
    return standardError(403, 'Admin role required');
  }

  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.price) {
    return standardError(400, 'name and price are required');
  }

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    const newItem: PotionMenuItem = {
      id: `pm-${Date.now()}`,
      organization_id: DEMO_ORG_ID,
      name: body.name,
      description: body.description || null,
      category: body.category || 'SNACK',
      price: body.price,
      image_url: body.image_url || undefined,
      vitality_boost: body.vitality_boost || undefined,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    return NextResponse.json({ data: newItem, source: 'demo' }, { status: 201 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('potions_menu')
      .insert({
        organization_id: session.organization_id,
        name: body.name,
        description: body.description || null,
        category: body.category || 'SNACK',
        price: body.price,
        image_url: body.image_url || null,
        vitality_boost: body.vitality_boost || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, source: 'production' }, { status: 201 });
  } catch (err) {
    return handleApiError(err, '[Potions:Menu:POST]');
  }
}
