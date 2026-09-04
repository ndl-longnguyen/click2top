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

    if (supabase && !userId.startsWith('guest_')) {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        username: username?.trim().slice(0, 20) || 'Player',
        short_description: shortDescription?.trim().slice(0, 100) || '',
        country: country?.toUpperCase() || 'VN',
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Supabase profile update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
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
