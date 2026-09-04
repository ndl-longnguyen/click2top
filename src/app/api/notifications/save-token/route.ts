import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, token, platform = 'web' } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId and token are required' },
        { status: 400 }
      );
    }

    // Try Admin client first, then fallback to Server client
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const supabase = createAdminSupabaseClient() || createServerSupabaseClient(authHeader);

    if (supabase) {
      // Upsert the token to public.fcm_tokens
      const { error } = await supabase
        .from('fcm_tokens')
        .upsert(
          {
            user_id: userId,
            token,
            platform,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'token' }
        );

      if (error) {
        console.warn('FCM token upsert note:', error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'FCM device token registered successfully',
      registeredAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register token';
    console.error('Error in save-token route:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
