import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { LeaderboardEntry, PeriodWinner, CompetitorStatus, CountryStanding, NationalRivalryInfo } from '@/lib/types/game';

// Realistic initial players across multiple nations calibrated for the rebalanced economy
const DEMO_PLAYERS: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'demo_ndl_king',
    username: 'NDL_KING',
    shortDescription: 'Building awesome things. Reaching for the stars! 👑',
    country: 'VN',
    score: 4850000,
    bestCombo: 127,
  },
  {
    rank: 2,
    userId: 'demo_player_b',
    username: 'CyberClicker',
    shortDescription: 'Factory Lv.12, never sleeping.',
    country: 'US',
    score: 4210000,
    bestCombo: 98,
  },
  {
    rank: 3,
    userId: 'demo_player_c',
    username: 'GoldenTap',
    shortDescription: 'Tapping like lightning! ⚡⚡',
    country: 'JP',
    score: 3690000,
    bestCombo: 110,
  },
  {
    rank: 4,
    userId: 'demo_player_d',
    username: 'SolarPulse',
    shortDescription: 'Chasing the top spot with Solar Plants!',
    country: 'KR',
    score: 2850000,
    bestCombo: 74,
  },
  {
    rank: 5,
    userId: 'demo_player_e',
    username: 'HyperSpeed',
    shortDescription: 'Earth Clicker master.',
    country: 'DE',
    score: 1920000,
    bestCombo: 65,
  },
  {
    rank: 6,
    userId: 'demo_player_f',
    username: 'NeonStrike',
    shortDescription: 'No boom can stop me 💣🚫',
    country: 'FR',
    score: 1350000,
    bestCombo: 82,
  },
  {
    rank: 7,
    userId: 'demo_player_g',
    username: 'VortexZero',
    shortDescription: 'Passive production king',
    country: 'GB',
    score: 920000,
    bestCombo: 45,
  },
  {
    rank: 8,
    userId: 'demo_player_h',
    username: 'PixelWarrior',
    shortDescription: 'One click at a time.',
    country: 'BR',
    score: 680000,
    bestCombo: 52,
  },
  {
    rank: 9,
    userId: 'demo_player_i',
    username: 'LionCity_Apex',
    shortDescription: 'Singapore speedrunner ⚡',
    country: 'SG',
    score: 510000,
    bestCombo: 60,
  },
  {
    rank: 10,
    userId: 'demo_player_j',
    username: 'SiamStrike',
    shortDescription: 'Bangkok click power 🐘',
    country: 'TH',
    score: 430000,
    bestCombo: 48,
  },
  {
    rank: 11,
    userId: 'demo_player_k',
    username: 'MapleClicker',
    shortDescription: 'Ice in my veins 🍁',
    country: 'CA',
    score: 360000,
    bestCombo: 55,
  },
  {
    rank: 12,
    userId: 'demo_player_l',
    username: 'AussieThunder',
    shortDescription: 'Clicking down under 🦘',
    country: 'AU',
    score: 290000,
    bestCombo: 40,
  },
  {
    rank: 13,
    userId: 'demo_player_m',
    username: 'SaigonSpeed',
    shortDescription: 'Pho & Fast Clicks! 🍜🇻🇳',
    country: 'VN',
    score: 240000,
    bestCombo: 58,
  },
  {
    rank: 14,
    userId: 'demo_player_n',
    username: 'TokyoDrift',
    shortDescription: 'Sub-second reactions 🗾',
    country: 'JP',
    score: 195000,
    bestCombo: 62,
  },
  {
    rank: 15,
    userId: 'demo_player_o',
    username: 'LibertyBell',
    shortDescription: 'Clicking for freedom 🗽',
    country: 'US',
    score: 160000,
    bestCombo: 39,
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
    country: 'VN',
    snapshotDescription: 'Building awesome things.',
    finalScore: 4850000,
    createdAt: '2026-08-31T23:59:59Z',
  },
  {
    id: 'hof_2',
    periodType: 'weekly',
    periodStart: '2026-08-18T00:00:00Z',
    periodEnd: '2026-08-24T23:59:59Z',
    userId: 'demo_player_b',
    username: 'CyberClicker',
    country: 'US',
    snapshotDescription: 'First week champion!',
    finalScore: 3740000,
    createdAt: '2026-08-24T23:59:59Z',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'global';
    const userId = searchParams.get('userId');
    const userScore = Number(searchParams.get('userScore')) || 0;
    const userCountry = (searchParams.get('userCountry') || 'VN').toUpperCase();
    const filterCountry = searchParams.get('country')?.toUpperCase();

    const supabase = createServerSupabaseClient();
    let allPlayers: LeaderboardEntry[] = [];
    let hallOfFame: PeriodWinner[] = [];
    let topOneWinner: PeriodWinner | null = null;

    if (supabase) {
      // Query database if connected
      const { data: dbEntries } = await supabase
        .from('player_stats')
        .select('user_id, leaderboard_score, best_combo, profiles(username, short_description, avatar_url, country)')
        .order('leaderboard_score', { ascending: false })
        .limit(100);

      if (dbEntries && dbEntries.length > 0) {
        allPlayers = dbEntries.map((row, idx) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return {
            rank: idx + 1,
            userId: row.user_id,
            username: profile?.username || 'Player',
            shortDescription: profile?.short_description || 'Clicker Champion',
            country: (profile?.country || 'VN').toUpperCase(),
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
          country: (w.country || 'VN').toUpperCase(),
          finalScore: Number(w.final_score),
          createdAt: w.created_at,
        }));
        topOneWinner = hallOfFame[0];
      }
    }

    // Fallback to rich demo data if DB is empty or unconfigured
    if (allPlayers.length === 0) {
      allPlayers = [...DEMO_PLAYERS];
    }
    if (hallOfFame.length === 0) {
      hallOfFame = [...DEMO_HALL_OF_FAME];
      topOneWinner = hallOfFame[0];
    }

    // Integrate or calculate the current user's live score & country representation
    if (userScore > 0) {
      const existingUserIdx = allPlayers.findIndex((e) => e.userId === userId);
      if (existingUserIdx !== -1) {
        allPlayers[existingUserIdx].score = Math.max(allPlayers[existingUserIdx].score, userScore);
        allPlayers[existingUserIdx].isCurrentUser = true;
        allPlayers[existingUserIdx].country = userCountry;
      } else {
        allPlayers.push({
          rank: 0,
          userId: userId || 'guest_current',
          username: 'You',
          shortDescription: 'Climbing the leaderboard!',
          country: userCountry,
          score: userScore,
          bestCombo: 1,
          isCurrentUser: true,
        });
      }
    }

    // Re-sort global players by score
    allPlayers.sort((a, b) => b.score - a.score);
    allPlayers.forEach((e, i) => (e.rank = i + 1));

    // 1. Calculate Country Standings (Nations Cup World Championship)
    const countryMap = new Map<string, { totalScore: number; playerCount: number; topPlayer: { username: string; score: number } }>();

    for (const player of allPlayers) {
      const c = player.country || 'VN';
      const existing = countryMap.get(c);
      if (!existing) {
        countryMap.set(c, {
          totalScore: player.score,
          playerCount: 1,
          topPlayer: {
            username: player.username,
            score: player.score,
          },
        });
      } else {
        existing.totalScore += player.score;
        existing.playerCount += 1;
        if (player.score > existing.topPlayer.score) {
          existing.topPlayer = {
            username: player.username,
            score: player.score,
          };
        }
      }
    }

    // Convert map to sorted array
    const countryStandings: CountryStanding[] = Array.from(countryMap.entries())
      .map(([country, data]) => ({
        rank: 0,
        country,
        totalScore: data.totalScore,
        playerCount: data.playerCount,
        topPlayer: data.topPlayer,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    // 2. Calculate National Rivalry Info for User's Country
    const userCountryIdx = countryStandings.findIndex((cs) => cs.country === userCountry);
    let nationalRivalry: NationalRivalryInfo | undefined = undefined;

    if (userCountryIdx !== -1) {
      const userCS = countryStandings[userCountryIdx];
      const aheadCS = userCountryIdx > 0 ? countryStandings[userCountryIdx - 1] : undefined;
      const behindCS = userCountryIdx < countryStandings.length - 1 ? countryStandings[userCountryIdx + 1] : undefined;

      nationalRivalry = {
        userCountry,
        userCountryRank: userCS.rank,
        userCountryScore: userCS.totalScore,
        aheadCountry: aheadCS
          ? {
              country: aheadCS.country,
              rank: aheadCS.rank,
              scoreDiff: Math.max(0, aheadCS.totalScore - userCS.totalScore),
            }
          : undefined,
        behindCountry: behindCS
          ? {
              country: behindCS.country,
              rank: behindCS.rank,
              leadDiff: Math.max(0, userCS.totalScore - behindCS.totalScore),
            }
          : undefined,
      };
    }

    // 3. Filter individual players if a specific country is requested
    let filteredEntries = allPlayers;
    if (filterCountry && filterCountry !== 'ALL') {
      filteredEntries = allPlayers.filter((p) => (p.country || 'VN').toUpperCase() === filterCountry);
      // Re-rank within country
      filteredEntries = filteredEntries.map((p, idx) => ({
        ...p,
        rank: idx + 1,
      }));
    }

    // 4. Competitor Tracker: Find the player right above the current user
    let userRank = 999;
    let competitorStatus: CompetitorStatus = {
      userRank: 999,
      userScore,
      userCountry,
      isTopOne: false,
    };

    if (userScore > 0) {
      const userInList = filteredEntries.find((e) => e.isCurrentUser || e.userId === userId);
      if (userInList) {
        userRank = userInList.rank;
      } else {
        const higherCount = filteredEntries.filter((e) => e.score > userScore).length;
        userRank = higherCount + 1;
      }

      const nextPlayer = filteredEntries.slice().reverse().find((e) => e.score > userScore);
      if (nextPlayer) {
        competitorStatus = {
          userRank,
          userScore,
          userCountry,
          nextPlayerRank: nextPlayer.rank,
          nextPlayerUsername: nextPlayer.username,
          nextPlayerCountry: nextPlayer.country,
          nextPlayerScore: nextPlayer.score,
          energyNeeded: Math.max(0, nextPlayer.score - userScore),
          isTopOne: false,
        };
      } else {
        competitorStatus = {
          userRank: 1,
          userScore,
          userCountry,
          isTopOne: true,
        };
      }
    }

    return NextResponse.json({
      period,
      filterCountry: filterCountry || 'ALL',
      entries: filteredEntries.slice(0, 50),
      countryStandings,
      nationalRivalry,
      topOneWinner,
      hallOfFame,
      competitorStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching leaderboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
