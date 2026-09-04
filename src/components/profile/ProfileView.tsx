'use client';

import React, { useState } from 'react';
import { PlayerStats, PlayerRankHistory } from '@/lib/types/game';
import { NotificationService, NotificationPreferences } from '@/lib/notifications/notificationService';
import { User, Bell, History, TrendingUp, TrendingDown, Minus, Save } from 'lucide-react';

interface ProfileViewProps {
  stats: PlayerStats;
  isGuest: boolean;
  onUpdateProfile: (username: string, shortDescription: string) => void;
  onOpenClaimModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  stats,
  isGuest,
  onUpdateProfile,
  onOpenClaimModal,
}) => {
  const [username, setUsername] = useState(stats.username);
  const [shortDesc, setShortDesc] = useState(stats.shortDescription);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() =>
    NotificationService.getPreferences()
  );
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    NotificationService.getPermissionState()
  );

  // Personal rank history display
  const [rankHistory] = useState<PlayerRankHistory[]>([
    {
      id: 'rh_1',
      userId: stats.userId,
      periodType: 'weekly',
      periodStart: '2026-08-18T00:00:00Z',
      periodEnd: '2026-08-24T23:59:59Z',
      rank: 24,
      score: 412000,
      createdAt: '2026-08-24T23:59:59Z',
      rankDelta: 0,
    },
    {
      id: 'rh_2',
      userId: stats.userId,
      periodType: 'weekly',
      periodStart: '2026-08-25T00:00:00Z',
      periodEnd: '2026-08-31T23:59:59Z',
      rank: 14,
      score: 1204000,
      createdAt: '2026-08-31T23:59:59Z',
      rankDelta: 10, // climbed 10 spots
    },
    {
      id: 'rh_3',
      userId: stats.userId,
      periodType: 'weekly',
      periodStart: '2026-09-01T00:00:00Z',
      periodEnd: '2026-09-07T23:59:59Z',
      rank: 8,
      score: 2410200,
      createdAt: '2026-09-07T23:59:59Z',
      rankDelta: 6, // climbed 6 spots
    },
  ]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(username, shortDesc);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    NotificationService.savePreferences(updated);
  };

  const handleRequestPush = async () => {
    const granted = await NotificationService.requestPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
  };

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto">
      {/* Guest Warning / Claim Banner */}
      {isGuest && (
        <div className="glass-panel-gold rounded-3xl p-5 border border-amber-500/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl">
              🛡️
            </div>
            <div>
              <h3 className="font-black text-white text-base">Guest Play Mode Active</h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Your progress is stored locally. Claim a permanent account to keep your upgrades safe and claim your spot on the leaderboard!
              </p>
            </div>
          </div>
          <button
            onClick={onOpenClaimModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 transition-all"
          >
            Claim Permanent Account
          </button>
        </div>
      )}

      {/* Profile & Custom Bio Section */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Player Profile & Custom Branding</h3>
            <p className="text-xs text-slate-400">
              Your bio is displayed on your public profile and on the Top 1 showcase banner if you reach #1!
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
              Player Display Name
            </label>
            <input
              type="text"
              value={username}
              maxLength={20}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-bold focus:outline-none focus:border-amber-400 text-sm"
              placeholder="e.g. MasterClicker"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
              Short Description / Bio (Max 100 characters)
            </label>
            <textarea
              value={shortDesc}
              maxLength={100}
              rows={2}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400 text-sm resize-none"
              placeholder="e.g. Building awesome things and claiming #1!"
            />
            <div className="text-right text-[11px] text-slate-500 font-mono mt-1">
              {shortDesc.length}/100
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-bold">
              {saveSuccess ? '✓ Profile saved successfully!' : ''}
            </span>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 59: Personal Rank History */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">Your Rank History</h3>
            <p className="text-xs text-slate-400">
              Track your weekly standings and rank progression over time.
            </p>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {rankHistory.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm"
            >
              <div>
                <span className="font-bold text-white">
                  Week of {new Date(item.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-slate-500 ml-2 font-mono text-xs">
                  {item.score.toLocaleString()} ⚡
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-black text-amber-400 font-mono text-sm">
                  #{item.rank}
                </span>

                {item.rankDelta && item.rankDelta > 0 ? (
                  <span className="flex items-center gap-0.5 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+{item.rankDelta}</span>
                  </span>
                ) : item.rankDelta && item.rankDelta < 0 ? (
                  <span className="flex items-center gap-0.5 text-red-400 font-bold text-xs bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{item.rankDelta}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-slate-500 font-bold text-xs">
                    <Minus className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 28: Notification Preferences */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Push Notifications (FCM)</h3>
              <p className="text-xs text-slate-400">
                Receive important alerts without spam.
              </p>
            </div>
          </div>

          {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
            <button
              onClick={handleRequestPush}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 text-xs font-bold transition-all"
            >
              Enable Browser Alerts
            </button>
          )}
        </div>

        <div className="space-y-3 pt-2">
          {[
            { key: 'someonePassedMe', label: 'Someone passed me on the leaderboard', desc: 'Alert when another player overtakes your rank' },
            { key: 'rankUpdates', label: 'Rank updates and milestone alerts', desc: 'Alert when you are close to beating the next player' },
            { key: 'offlineEarnings', label: 'Offline generator earnings reminder', desc: 'Alert when your factories are filled with energy' },
            { key: 'dailyReminder', label: 'Daily login bonus reminder', desc: 'Gentle reminder to keep your daily streak alive' },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            >
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">{item.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(notifPrefs[item.key as keyof NotificationPreferences])}
                onChange={() => handleTogglePref(item.key as keyof NotificationPreferences)}
                className="w-4 h-4 accent-amber-500 cursor-pointer mt-1"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
