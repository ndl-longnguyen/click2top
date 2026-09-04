import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient() || createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 });
    }

    // 1. Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, short_description, avatar_url, country')
      .eq('id', userId)
      .maybeSingle();

    // 2. Fetch Player Stats
    const { data: stats } = await supabase
      .from('player_stats')
      .select('current_energy, total_earned_energy, leaderboard_score, best_combo, current_combo, last_active_at')
      .eq('user_id', userId)
      .maybeSingle();

    // 3. Fetch Player Items
    const { data: itemsData } = await supabase
      .from('player_items')
      .select('item_id, level')
      .eq('user_id', userId);

    const itemsMap: Record<string, number> = {};
    if (itemsData && Array.isArray(itemsData)) {
      itemsData.forEach((row) => {
        // Strip 'item_' prefix if stored as 'item_click_power'
        const slug = row.item_id.replace(/^item_/, '');
        itemsMap[slug] = Number(row.level || 0);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        username: profile?.username || 'Player',
        shortDescription: profile?.short_description || 'Clicker Champion',
        country: (profile?.country || 'VN').toUpperCase(),
        currentEnergy: Number(stats?.current_energy ?? stats?.leaderboard_score ?? 0),
        totalEarnedEnergy: Number(stats?.total_earned_energy ?? 0),
        leaderboardScore: Number(stats?.leaderboard_score ?? stats?.current_energy ?? 0),
        bestCombo: Number(stats?.best_combo ?? 0),
        currentCombo: Number(stats?.current_combo ?? 0),
        lastActiveAt: stats?.last_active_at ? new Date(stats.last_active_at).getTime() : Date.now(),
        items: itemsMap,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
