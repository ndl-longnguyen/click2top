import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Check authorization
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Supabase not configured, local cron simulated successfully',
      });
    }

    // 2. Determine current weekly period bounds (UTC+7)
    const now = new Date();
    // Start of current week (Monday 00:00:00)
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() + diffToMonday);
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);

    const periodStartIso = periodStart.toISOString();
    const periodEndIso = periodEnd.toISOString();

    // 3. Check idempotency: Has this period already been archived?
    const { data: existingWinner } = await supabase
      .from('period_winners')
      .select('id')
      .eq('period_type', 'weekly')
      .eq('period_start', periodStartIso)
      .maybeSingle();

    if (existingWinner) {
      return NextResponse.json({
        success: true,
        message: 'Weekly reset already performed for this period',
      });
    }

    // 4. Fetch Top Players for the closing week
    const { data: topPlayers, error: fetchErr } = await supabase
      .from('leaderboard_entries')
      .select('user_id, score, profiles(username, short_description, country)')
      .eq('period_type', 'weekly')
      .order('score', { ascending: false })
      .limit(100);

    if (fetchErr) {
      throw fetchErr;
    }

    if (topPlayers && topPlayers.length > 0) {
      // 5. Crown & Archive #1 Player to period_winners
      const winner = topPlayers[0];
      const profile = Array.isArray(winner.profiles) ? winner.profiles[0] : winner.profiles;

      await supabase.from('period_winners').insert({
        period_type: 'weekly',
        period_start: periodStartIso,
        period_end: periodEndIso,
        user_id: winner.user_id,
        snapshot_username: profile?.username || 'Champion',
        snapshot_description: profile?.short_description || 'Crowned #1 Champion of the Week!',
        country: profile?.country || 'VN',
        final_score: winner.score,
        created_at: new Date().toISOString(),
      });

      // 6. Snapshot active players' rank into player_rank_history
      const historyRows = topPlayers.map((entry, index) => ({
        user_id: entry.user_id,
        period_type: 'weekly',
        period_start: periodStartIso,
        period_end: periodEndIso,
        rank: index + 1,
        score: entry.score,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('player_rank_history').insert(historyRows);

      // 7. Reset weekly scores in leaderboard_entries
      await supabase
        .from('leaderboard_entries')
        .delete()
        .eq('period_type', 'weekly')
        .eq('period_start', periodStartIso);
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly leaderboard archived and rolled over successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reset failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
