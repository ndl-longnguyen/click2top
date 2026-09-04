import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
}

let firebaseAdminApp: App | null = null;
let messagingInstance: Messaging | null = null;

function getFirebaseMessagingInstance(): Messaging | null {
  if (messagingInstance) {
    return messagingInstance;
  }

  try {
    if (getApps().length > 0) {
      firebaseAdminApp = getApps()[0];
      messagingInstance = getMessaging(firebaseAdminApp);
      return messagingInstance;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (serviceAccountJson) {
      const parsed = JSON.parse(serviceAccountJson);
      firebaseAdminApp = initializeApp({
        credential: cert(parsed),
      });
      messagingInstance = getMessaging(firebaseAdminApp);
      return messagingInstance;
    }

    if (clientEmail && privateKey && projectId) {
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      messagingInstance = getMessaging(firebaseAdminApp);
      return messagingInstance;
    }

    return null;
  } catch (err) {
    console.warn('[PushSender] Firebase Admin initialization skipped:', err);
    return null;
  }
}

/**
 * Send push notification to a specific list of FCM tokens
 */
export async function sendPushToTokens(
  tokens: string[],
  payload: PushNotificationPayload
): Promise<{ success: boolean; sentCount: number; failedCount: number; message: string }> {
  if (!tokens || tokens.length === 0) {
    return { success: true, sentCount: 0, failedCount: 0, message: 'No tokens provided' };
  }

  const messaging = getFirebaseMessagingInstance();
  if (!messaging) {
    console.info(
      `[PushSender Simulation] Notification '${payload.title}' queued for ${tokens.length} token(s). (Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to .env.local to enable live delivery)`
    );
    return {
      success: true,
      sentCount: tokens.length,
      failedCount: 0,
      message: 'Simulated delivery (Firebase Admin credentials not configured)',
    };
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.icon || '/icon-192.png',
      },
      webpush: {
        notification: {
          icon: payload.icon || '/icon-192.png',
          badge: payload.badge || '/icon-192.png',
          tag: payload.tag || 'click-2-top-alert',
        },
        fcmOptions: {
          link: payload.data?.url || '/',
        },
      },
      data: payload.data || { url: '/' },
    });

    // Clean up stale or invalid tokens
    const staleTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errCode = resp.error.code;
        if (
          errCode === 'messaging/invalid-registration-token' ||
          errCode === 'messaging/registration-token-not-registered'
        ) {
          staleTokens.push(tokens[idx]);
        }
      }
    });

    if (staleTokens.length > 0) {
      const supabase = createAdminSupabaseClient() || createServerSupabaseClient();
      if (supabase) {
        await supabase.from('fcm_tokens').delete().in('token', staleTokens);
      }
    }

    return {
      success: true,
      sentCount: response.successCount,
      failedCount: response.failureCount,
      message: `Delivered to ${response.successCount}/${tokens.length} devices`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'FCM send failed';
    console.error('[PushSender Error]', errorMsg);
    return { success: false, sentCount: 0, failedCount: tokens.length, message: errorMsg };
  }
}

/**
 * Send push notification to a specific user by user_id
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sentCount: number; message: string }> {
  const supabase = createAdminSupabaseClient() || createServerSupabaseClient();
  if (!supabase) {
    return { success: true, sentCount: 0, message: 'Supabase unavailable' };
  }

  const { data: tokenRows, error } = await supabase
    .from('fcm_tokens')
    .select('token')
    .eq('user_id', userId);

  if (error || !tokenRows || tokenRows.length === 0) {
    return { success: true, sentCount: 0, message: 'No registered device tokens for user' };
  }

  const tokens = tokenRows.map((r: { token: string }) => r.token);
  const result = await sendPushToTokens(tokens, payload);
  return { success: result.success, sentCount: result.sentCount, message: result.message };
}

/**
 * Broadcast push notification to all registered devices
 */
export async function broadcastPush(
  payload: PushNotificationPayload,
  limit = 500
): Promise<{ success: boolean; sentCount: number; message: string }> {
  const supabase = createAdminSupabaseClient() || createServerSupabaseClient();
  if (!supabase) {
    return { success: true, sentCount: 0, message: 'Supabase unavailable' };
  }

  const { data: tokenRows, error } = await supabase
    .from('fcm_tokens')
    .select('token')
    .limit(limit);

  if (error || !tokenRows || tokenRows.length === 0) {
    return { success: true, sentCount: 0, message: 'No registered device tokens found' };
  }

  const tokens = tokenRows.map((r: { token: string }) => r.token);
  const result = await sendPushToTokens(tokens, payload);
  return { success: result.success, sentCount: result.sentCount, message: result.message };
}
