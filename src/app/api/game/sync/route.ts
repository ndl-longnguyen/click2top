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

      // 2. Persist real-time player stats (Leaderboard is based on current_energy)
      const { error } = await supabase.from('player_stats').upsert({
        user_id: userId,
        current_energy: currentEnergy,
        total_earned_energy: totalEarnedEnergy,
        leaderboard_score: currentEnergy,
        last_active_at: new Date(clientTimestamp || Date.now()).toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Supabase sync error:', error);
      }

      // 3. Keep current weekly tournament entry synchronized
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() + diffToMonday);
      periodStart.setHours(0, 0, 0, 0);
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);

      await supabase.from('leaderboard_entries').upsert(
        {
          user_id: userId,
          score: currentEnergy,
          period_type: 'weekly',
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,period_type,period_start' }
      );
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
