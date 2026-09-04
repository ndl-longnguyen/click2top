import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { LeaderboardEntry, PeriodWinner, CompetitorStatus } from '@/lib/types/game';

// Realistic initial demo players so the leaderboard is immediately alive & competitive
const DEMO_PLAYERS: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'demo_ndl_king',
    username: 'NDL_KING',
    shortDescription: 'Building awesome things. Reaching for the stars! 👑',
    score: 98291221,
    bestCombo: 127,
  },
  {
    rank: 2,
    userId: 'demo_player_b',
    username: 'CyberClicker',
    shortDescription: 'Factory Lv.35, never sleeping.',
    score: 92381120,
    bestCombo: 98,
  },
  {
    rank: 3,
    userId: 'demo_player_c',
    username: 'GoldenTap',
    shortDescription: 'Tapping like lightning! ⚡⚡',
    score: 87291882,
    bestCombo: 110,
  },
  {
    rank: 4,
    userId: 'demo_player_d',
    username: 'SolarPulse',
    shortDescription: 'Chasing the top spot!',
    score: 54120300,
    bestCombo: 74,
  },
  {
    rank: 5,
    userId: 'demo_player_e',
    username: 'HyperSpeed',
    shortDescription: 'Earth Clicker master.',
    score: 31800500,
    bestCombo: 65,
  },
  {
    rank: 6,
    userId: 'demo_player_f',
    username: 'NeonStrike',
    shortDescription: 'No boom can stop me 💣🚫',
    score: 18450000,
    bestCombo: 82,
  },
  {
    rank: 7,
    userId: 'demo_player_g',
    username: 'VortexZero',
    shortDescription: 'Passive production king',
    score: 9540000,
    bestCombo: 45,
  },
  {
    rank: 8,
    userId: 'demo_player_h',
    username: 'PixelWarrior',
    shortDescription: 'One click at a time.',
    score: 4200000,
    bestCombo: 52,
  },
];

const DEMO_HALL_OF_FAME: PeriodWinner[] = [
  {
    id: 'hof_1',
    periodType: 'weekly',
    periodStart: '2026-08-25T00:00:00Z',
    periodEnd: '2026-08-31T23:59:59Z',
    userId: 'demo_ndl_king',
    username: 'NDL_KING',
    snapshotDescription: 'Building awesome things.',
    finalScore: 98291221,
    createdAt: '2026-08-31T23:59:59Z',
  },
  {
    id: 'hof_2',
    periodType: 'weekly',
    periodStart: '2026-08-18T00:00:00Z',
    periodEnd: '2026-08-24T23:59:59Z',
    userId: 'demo_player_b',
    username: 'CyberClicker',
    snapshotDescription: 'First week champion!',
    finalScore: 74150200,
    createdAt: '2026-08-24T23:59:59Z',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'global';
    const userId = searchParams.get('userId');
    const userScore = Number(searchParams.get('userScore')) || 0;

    const supabase = createServerSupabaseClient();
    let entries: LeaderboardEntry[] = [];
    let hallOfFame: PeriodWinner[] = [];
    let topOneWinner: PeriodWinner | null = null;

    if (supabase) {
      // Query database if connected
      const { data: dbEntries } = await supabase
        .from('player_stats')
        .select('user_id, leaderboard_score, best_combo, profiles(username, short_description, avatar_url)')
        .order('leaderboard_score', { ascending: false })
        .limit(50);

      if (dbEntries && dbEntries.length > 0) {
        entries = dbEntries.map((row, idx) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return {
            rank: idx + 1,
            userId: row.user_id,
            username: profile?.username || 'Player',
            shortDescription: profile?.short_description || 'Clicker Champion',
            avatarUrl: profile?.avatar_url,
            score: Number(row.leaderboard_score),
            bestCombo: row.best_combo,
            isCurrentUser: row.user_id === userId,
          };
        });
      }

      // Query Hall of Fame (period_winners)
      const { data: dbHof } = await supabase
        .from('period_winners')
        .select('*')
        .order('period_start', { ascending: false })
        .limit(20);

      if (dbHof && dbHof.length > 0) {
        hallOfFame = dbHof.map((w) => ({
          id: w.id,
          periodType: w.period_type,
          periodStart: w.period_start,
          periodEnd: w.period_end,
          userId: w.user_id,
          username: w.snapshot_username,
          snapshotDescription: w.snapshot_description,
          finalScore: Number(w.final_score),
          createdAt: w.created_at,
        }));
        topOneWinner = hallOfFame[0];
      }
    }

    // Fallback to rich demo data if DB is empty or unconfigured
    if (entries.length === 0) {
      entries = [...DEMO_PLAYERS];
    }
    if (hallOfFame.length === 0) {
      hallOfFame = [...DEMO_HALL_OF_FAME];
      topOneWinner = hallOfFame[0];
    }

    // Integrate or calculate the current user's relative ranking & immediate competitor
    let userRank = 999;
    let competitorStatus: CompetitorStatus = {
      userRank: 999,
      userScore,
      isTopOne: false,
    };

    if (userScore > 0) {
      // Find where user sits in the list
      const existingUserIdx = entries.findIndex((e) => e.userId === userId);
      if (existingUserIdx !== -1) {
        entries[existingUserIdx].score = Math.max(entries[existingUserIdx].score, userScore);
        entries[existingUserIdx].isCurrentUser = true;
        entries.sort((a, b) => b.score - a.score);
        entries.forEach((e, i) => (e.rank = i + 1));
        userRank = entries.findIndex((e) => e.userId === userId) + 1;
      } else {
        // Calculate simulated rank
        const higherCount = entries.filter((e) => e.score > userScore).length;
        userRank = higherCount + 1;
      }

      // Competitor Tracker: Find the player right above the current user
      const nextPlayer = entries.slice().reverse().find((e) => e.score > userScore);
      if (nextPlayer) {
        competitorStatus = {
          userRank,
          userScore,
          nextPlayerRank: nextPlayer.rank,
          nextPlayerUsername: nextPlayer.username,
          nextPlayerScore: nextPlayer.score,
          energyNeeded: Math.max(0, nextPlayer.score - userScore),
          isTopOne: false,
        };
      } else {
        competitorStatus = {
          userRank: 1,
          userScore,
          isTopOne: true,
        };
      }
    }

    return NextResponse.json({
      period,
      entries: entries.slice(0, 50),
      topOneWinner,
      hallOfFame,
      competitorStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching leaderboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
