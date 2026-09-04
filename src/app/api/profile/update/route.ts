import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, username, shortDescription, country } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const supabase = createServerSupabaseClient(authHeader);

    if (supabase) {
      const sanitizedUsername = username?.trim().slice(0, 20) || 'Player';
      const sanitizedCountry = country?.toUpperCase() || 'VN';

      // 1. Check if another player already owns this username (case-insensitive)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', sanitizedUsername)
        .neq('id', userId)
        .maybeSingle();

      if (existingUser) {
        const rand = Math.floor(10 + Math.random() * 90);
        const suggestions = [
          `${sanitizedUsername}_${sanitizedCountry}`,
          `${sanitizedUsername}${rand}`,
          `${sanitizedUsername}Pro`,
        ];

        return NextResponse.json(
          {
            error: 'USERNAME_TAKEN',
            message: `Tên "${sanitizedUsername}" đã có người sử dụng. Vui lòng chọn tên khác!`,
            suggestions,
          },
          { status: 409 }
        );
      }

      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        username: sanitizedUsername,
        short_description: shortDescription?.trim().slice(0, 100) || '',
        country: sanitizedCountry,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === '23505') {
          const rand = Math.floor(10 + Math.random() * 90);
          return NextResponse.json(
            {
              error: 'USERNAME_TAKEN',
              message: `Tên "${sanitizedUsername}" đã có người sử dụng. Vui lòng chọn tên khác!`,
              suggestions: [
                `${sanitizedUsername}_${sanitizedCountry}`,
                `${sanitizedUsername}${rand}`,
                `${sanitizedUsername}Pro`,
              ],
            },
            { status: 409 }
          );
        }
        console.error('Supabase profile update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Ensure stats record exists so leaderboard & nations cup queries link smoothly
      await supabase.from('player_stats').upsert(
        {
          user_id: userId,
          current_energy: 0,
          total_earned_energy: 0,
          leaderboard_score: 0,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id', ignoreDuplicates: true }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        userId,
        username,
        shortDescription,
        country: country || 'VN',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
