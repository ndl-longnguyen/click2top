import { NextRequest, NextResponse } from 'next/server';
import { sendPushToTokens, sendPushToUser } from '@/lib/notifications/pushSender';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      userId,
      title = 'Click 2 Top ⚡ — Test Alert',
      messageBody = 'Push notification connection is active and working! You are ready to receive tournament updates.',
    } = body;

    const payload = {
      title,
      body: messageBody,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'click-2-top-test',
      data: {
        url: '/',
        timestamp: Date.now().toString(),
      },
    };

    if (token) {
      const result = await sendPushToTokens([token], payload);
      return NextResponse.json({
        success: result.success,
        mode: 'token',
        sentCount: result.sentCount,
        message: result.message,
      });
    }

    if (userId) {
      const result = await sendPushToUser(userId, payload);
      return NextResponse.json({
        success: result.success,
        mode: 'user',
        sentCount: result.sentCount,
        message: result.message,
      });
    }

    return NextResponse.json(
      { error: 'Either token or userId must be provided for test push' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Test send failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
