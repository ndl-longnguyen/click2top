'use client';

import React, { useState, useMemo } from 'react';
import { PlayerStats, PlayerRankHistory } from '@/lib/types/game';
import { NotificationService, NotificationPreferences } from '@/lib/notifications/notificationService';
import { COUNTRIES, POPULAR_COUNTRIES, getCountryFlag, getCountryName, searchCountries } from '@/lib/config/countries';
import { User, Bell, History, TrendingUp, TrendingDown, Minus, Save, Globe, Sparkles, Search, Check } from 'lucide-react';

interface ProfileViewProps {
  stats: PlayerStats;
  isGuest: boolean;
  onUpdateProfile: (username: string, shortDescription: string, country?: string) => void;
  onOpenClaimModal: () => void;
  onNavigateToLeaderboard?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  stats,
  isGuest,
  onUpdateProfile,
  onOpenClaimModal,
  onNavigateToLeaderboard,
}) => {
  const [username, setUsername] = useState(stats.username);
  const [shortDesc, setShortDesc] = useState(stats.shortDescription);
  const [country, setCountry] = useState((stats.country || 'VN').toUpperCase());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() =>
    NotificationService.getPreferences()
  );
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    NotificationService.getPermissionState()
  );

  // Filtered countries based on user search
  const filteredCountries = useMemo(() => {
    return searchCountries(countrySearch);
  }, [countrySearch]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(username, shortDesc, country);

    // Also persist to Supabase if authenticated
    try {
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: stats.userId,
          username,
          shortDescription: shortDesc,
          country,
        }),
      });
    } catch {
      // Ignored for guest/offline
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
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
    <div className="w-full space-y-6 max-w-4xl mx-auto pb-8">
      {/* Guest Warning / Claim Banner */}
      {isGuest && (
        <div className="glass-panel-gold rounded-3xl p-5 border border-amber-500/40 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl shadow-inner">
              🛡️
            </div>
            <div>
              <h3 className="font-black text-white text-base">Guest Play Mode Active</h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Your progress is stored locally. Claim a permanent account to secure your upgrades and claim your rank on the world leaderboard!
              </p>
            </div>
          </div>
          <button
            onClick={onOpenClaimModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 transition-all cursor-pointer"
          >
            Claim Permanent Account
          </button>
        </div>
      )}

      {/* National Pride Combat Pass Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-6 -translate-x-6 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/60 border-2 border-amber-400/50 flex items-center justify-center text-4xl sm:text-5xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              {getCountryFlag(country)}
              <span className="absolute -bottom-2 -right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                {country}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  REPRESENTING NATION
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {getCountryName(country)}
              </h2>
              <p className="text-xs text-amber-200/80 mt-1 max-w-lg leading-relaxed">
                ⚔️ Every Energy point you generate in the Arena contributes directly to <strong className="text-amber-300">{getCountryName(country)}</strong> on the global <strong>Nations Cup</strong> leaderboard!
              </p>
            </div>
          </div>

          {onNavigateToLeaderboard && (
            <button
              onClick={onNavigateToLeaderboard}
              className="px-4 py-2.5 rounded-xl glass-panel border border-amber-400/30 hover:border-amber-400 text-amber-300 font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer"
            >
              View Nations Cup Standings ➔
            </button>
          )}
        </div>
      </div>

      {/* Profile Customization Form */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>Player Profile & National Flag</span>
              <span className="text-xl">{getCountryFlag(country)}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select your national representative flag to compete with millions of clickers worldwide!
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Quick-Pick Popular Flags */}
          <div>
            <label className="block text-xs uppercase font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Quick-Pick Popular Flags</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_COUNTRIES.map((c) => {
                const isSelected = country === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCountry(c.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span>{c.code}</span>
                    {isSelected && <Check className="w-3 h-3 text-slate-950" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username Input */}
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

            {/* Complete World Country Selector with Search */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>All Countries Worldwide ({COUNTRIES.length} Nations)</span>
                </span>
                <span className="text-amber-400 font-mono font-bold">
                  {getCountryFlag(country)} {country}
                </span>
              </label>

              {/* Country search filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search by name or code (e.g. Viet, US, JP...)"
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white font-bold focus:outline-none focus:border-amber-400 text-sm cursor-pointer"
                  >
                    {filteredCountries.map((c) => (
                      <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Bio / Motto Input */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
              Player Bio / Battle Cry (Max 100 characters)
            </label>
            <textarea
              value={shortDesc}
              maxLength={100}
              rows={2}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400 text-sm resize-none"
              placeholder="e.g. Clicking for national glory and claiming #1! ⚡"
            />
            <div className="text-right text-[11px] text-slate-500 font-mono mt-1">
              {shortDesc.length}/100
            </div>
          </div>

          {/* Submit Button & Confirmation */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 animate-pulse">
                  <Check className="w-4 h-4" />
                  Profile and representing country saved successfully!
                </span>
              )}
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
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
              Track your standings and progression across competitive seasons.
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

      {/* Notifications Section */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Notification Preferences</h3>
              <p className="text-xs text-slate-400">
                Receive instant alerts when outranked or when the weekly season is concluding.
              </p>
            </div>
          </div>

          {notifPermission !== 'granted' && (
            <button
              onClick={handleRequestPush}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 font-bold text-xs transition-all cursor-pointer"
            >
              Enable Push Notifications
            </button>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors cursor-pointer">
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">Outranked Alert</div>
              <div className="text-[11px] text-slate-400">
                Notify immediately when another player overtakes your rank
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.someonePassedMe}
              onChange={() => handleTogglePref('someonePassedMe')}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors cursor-pointer">
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">Rank & Season Updates</div>
              <div className="text-[11px] text-slate-400">
                Get notified when your rank or representing country standing shifts
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.rankUpdates}
              onChange={() => handleTogglePref('rankUpdates')}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors cursor-pointer">
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">Offline Energy Full</div>
              <div className="text-[11px] text-slate-400">
                Notify when offline automated generators reach maximum capacity
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.offlineEarnings}
              onChange={() => handleTogglePref('offlineEarnings')}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
