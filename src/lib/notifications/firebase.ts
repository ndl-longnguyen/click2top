import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import { getMessaging, getToken, Messaging, isSupported as isMessagingSupported } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;

  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export async function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  const currentApp = getFirebaseApp();
  if (!currentApp) return null;

  if (!analytics && (await isAnalyticsSupported())) {
    analytics = getAnalytics(currentApp);
  }
  return analytics;
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  const currentApp = getFirebaseApp();
  if (!currentApp) return null;

  if (!messaging && (await isMessagingSupported())) {
    messaging = getMessaging(currentApp);
  }
  return messaging;
}

export async function requestFcmToken(): Promise<string | null> {
  try {
    const fcm = await getFirebaseMessaging();
    if (!fcm) return null;

    const token = await getToken(fcm, {
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });
    return token;
  } catch (err) {
    console.warn('FCM token registration unavailable or permission denied:', err);
    return null;
  }
}
