'use client';

export interface NotificationPreferences {
  someonePassedMe: boolean;
  rankUpdates: boolean;
  offlineEarnings: boolean;
  dailyReminder: boolean;
}

const PREFERENCES_KEY = 'coin_clicker_notif_prefs';

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
    const saved = localStorage.getItem(PREFERENCES_KEY);
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

  public static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register service worker push subscription if supported
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.ready;
          return true;
        }
        return true;
      }
      return false;
    } catch {
      return false;
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
        });
      } catch {}
    }
  }
}
