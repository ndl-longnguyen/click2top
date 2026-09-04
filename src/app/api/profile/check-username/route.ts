import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.trim().slice(0, 20);
    const excludeUserId = searchParams.get('excludeUserId');

    if (!username) {
      return NextResponse.json({ available: false, error: 'Username required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ available: true });
    }

    let query = supabase.from('profiles').select('id').ilike('username', username);
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data } = await query.maybeSingle();

    if (data) {
      const rand = Math.floor(10 + Math.random() * 90);
      return NextResponse.json({
        available: false,
        message: `Tên "${username}" đã có người sử dụng. Vui lòng chọn tên khác!`,
        suggestions: [
          `${username}_VN`,
          `${username}${rand}`,
          `${username}Pro`,
        ],
      });
    }

    return NextResponse.json({ available: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error checking username';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
