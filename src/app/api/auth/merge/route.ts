import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestStats, targetUserId, targetUsername } = body;

    if (!targetUserId || !guestStats) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient() || createServerSupabaseClient();
    if (supabase) {
      // Ensure chosen username is unique across all profiles
      let chosenUsername = (targetUsername || guestStats.username || 'Player').trim().slice(0, 20);
      const { data: nameClash } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', chosenUsername)
        .neq('id', targetUserId)
        .maybeSingle();

      if (nameClash) {
        chosenUsername = `${chosenUsername.slice(0, 14)}_${Math.floor(100 + Math.random() * 900)}`;
      }

      // Upsert profile
      await supabase.from('profiles').upsert({
        id: targetUserId,
        username: chosenUsername,
        short_description: guestStats.shortDescription || 'Clicking to the top!',
        country: guestStats.country || 'VN',
        updated_at: new Date().toISOString(),
      });

      // Upsert stats with merged energy
      await supabase.from('player_stats').upsert({
        user_id: targetUserId,
        current_energy: guestStats.currentEnergy || 0,
        total_earned_energy: guestStats.totalEarnedEnergy || 0,
        leaderboard_score: guestStats.leaderboardScore || 0,
        best_combo: guestStats.bestCombo || 0,
        current_combo: guestStats.currentCombo || 0,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Upsert items
      if (guestStats.items && typeof guestStats.items === 'object') {
        const itemRows = Object.entries(guestStats.items).map(([slug, level]) => ({
          user_id: targetUserId,
          item_id: 'item_' + slug,
          level: Number(level),
          updated_at: new Date().toISOString(),
        }));

        if (itemRows.length > 0) {
          await supabase.from('player_items').upsert(itemRows);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Guest progress merged successfully into permanent account',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
