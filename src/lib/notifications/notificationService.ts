'use client';

import { requestFcmToken } from './firebase';

export interface NotificationPreferences {
  someonePassedMe: boolean;
  rankUpdates: boolean;
  offlineEarnings: boolean;
  dailyReminder: boolean;
}

const PREFERENCES_KEY = 'click_2_top_notif_prefs';
const FCM_TOKEN_KEY = 'click_2_top_fcm_token';

export class NotificationService {
  public static getPreferences(): NotificationPreferences {
    if (typeof window === 'undefined') {
      return {
        someonePassedMe: true,
        rankUpdates: true,
        offlineEarnings: true,
        dailyReminder: false,
      };
    }
    const saved = localStorage.getItem(PREFERENCES_KEY) || localStorage.getItem('coin_clicker_notif_prefs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      someonePassedMe: true,
      rankUpdates: true,
      offlineEarnings: true,
      dailyReminder: false,
    };
  }

  public static savePreferences(prefs: NotificationPreferences) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  }

  public static getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(FCM_TOKEN_KEY);
  }

  public static async registerDeviceToken(userId: string, token: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(FCM_TOKEN_KEY, token);
      }
      const response = await fetch('/api/notifications/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token, platform: 'web' }),
      });
      return response.ok;
    } catch (err) {
      console.warn('Could not register FCM token with server:', err);
      return false;
    }
  }

  public static async requestPermission(userId?: string): Promise<{ granted: boolean; token: string | null }> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { granted: false, token: null };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { granted: false, token: null };
      }

      // Ensure service worker is running
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.ready;
        } catch {
          await navigator.serviceWorker.register('/sw.js');
        }
      }

      // Request FCM Device Token
      let fcmToken: string | null = null;
      try {
        fcmToken = await requestFcmToken();
        if (fcmToken && userId) {
          await this.registerDeviceToken(userId, fcmToken);
        }
      } catch (err) {
        console.warn('FCM token retrieval skipped or not configured:', err);
      }

      // Fire welcoming local notification
      this.sendLocalNotification(
        'Click 2 Top ⚡',
        'Push notifications enabled! You will be alerted when outranked or when tournaments conclude.'
      );

      return { granted: true, token: fcmToken };
    } catch (err) {
      console.warn('Error requesting push permission:', err);
      return { granted: false, token: null };
    }
  }

  public static getPermissionState(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  public static sendLocalNotification(title: string, body: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        });
      } catch {
        // Fallback for mobile browsers where new Notification() requires Service Worker showNotification
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
            });
          }).catch(() => {});
        }
      }
    }
  }

  public static async sendTestNotification(userId?: string): Promise<{ success: boolean; message: string }> {
    // 1. Immediate local notification for visual confirmation
    this.sendLocalNotification(
      'Click 2 Top ⚡ — Test Alert',
      'Push notification connection is active and working! You are ready to compete.'
    );

    // 2. Server test call
    const storedToken = this.getStoredToken();
    if (storedToken || userId) {
      try {
        const res = await fetch('/api/notifications/test-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: storedToken || undefined,
            userId: userId || undefined,
            title: 'Click 2 Top ⚡ — Test Alert',
            messageBody: 'Backend-to-device push notification test completed successfully!',
          }),
        });
        const data = await res.json();
        return { success: res.ok, message: data.message || 'Test alert triggered' };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Server test error';
        return { success: true, message: `Local alert shown (${msg})` };
      }
    }

    return { success: true, message: 'Local test alert dispatched' };
  }
}

