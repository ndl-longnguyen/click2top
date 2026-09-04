import { NextRequest, NextResponse } from 'next/server';
import { validateBatch } from '@/lib/security/antiCheat';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, username, country, clickBatch, currentEnergy, totalEarnedEnergy, leaderboardScore, clientTimestamp } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Anti-cheat verification
    const validation = validateBatch({
      claimedEnergyDelta: Math.max(0, currentEnergy),
      clickBatch: clickBatch || { coins: 0, booms: 0, comboMax: 0, durationMs: 8000 },
      items: {},
      elapsedSeconds: 8,
    });

    if (!validation.isValid) {
      console.warn(`[AntiCheat Warning] User ${userId}: ${validation.reason}`);
    }

    // Persist to Supabase DB so player score immediately ranks on Global & Nations Cup
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const supabase = createServerSupabaseClient(authHeader);

    if (supabase) {
      // 1. Ensure profile exists so foreign key is guaranteed
      await supabase.from('profiles').upsert(
        {
          id: userId,
          username: username?.trim().slice(0, 20) || 'Player_' + userId.slice(-4),
          country: (country || 'VN').toUpperCase(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      // 2. Persist real-time player stats
      const { error } = await supabase.from('player_stats').upsert({
        user_id: userId,
        current_energy: currentEnergy,
        total_earned_energy: totalEarnedEnergy,
        leaderboard_score: leaderboardScore,
        last_active_at: new Date(clientTimestamp || Date.now()).toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Supabase sync error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      currentEnergy,
      totalEarnedEnergy,
      leaderboardScore,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
