'use client';

import React, { useState, useMemo } from 'react';
import { PlayerStats, PlayerRankHistory } from '@/lib/types/game';
import { NotificationService, NotificationPreferences } from '@/lib/notifications/notificationService';
import { COUNTRIES, getCountryFlag, getCountryName, searchCountries } from '@/lib/config/countries';
import { User, Bell, History, TrendingUp, TrendingDown, Minus, Save, Globe, Sparkles, Search, Check, AlertCircle, LogIn, UserPlus, LogOut } from 'lucide-react';
import { ConfirmationModal, ConfirmDialogOptions } from '@/components/common/ConfirmationModal';

interface ProfileViewProps {
  stats: PlayerStats;
  isGuest: boolean;
  onUpdateProfile: (username: string, shortDescription: string, country?: string) => void;
  onOpenClaimModal: (mode?: 'signup' | 'login') => void;
  onNavigateToLeaderboard?: () => void;
  onResetData?: () => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  stats,
  isGuest,
  onUpdateProfile,
  onOpenClaimModal,
  onNavigateToLeaderboard,
  onResetData,
  onLogout,
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
    if (!countrySearch.trim()) return COUNTRIES;
    return searchCountries(countrySearch);
  }, [countrySearch]);

  // Personal rank history display (real season records)
  const [rankHistory] = useState<PlayerRankHistory[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [testNotifMessage, setTestNotifMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMessage('Username cannot be empty');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setUsernameSuggestions([]);

    // Check unique username if username was changed
    if (cleanUsername.toLowerCase() !== stats.username.toLowerCase()) {
      try {
        const checkRes = await fetch(
          `/api/profile/check-username?username=${encodeURIComponent(cleanUsername)}&currentUserId=${encodeURIComponent(stats.userId)}`
        );
        const checkData = await checkRes.json();
        if (checkData.available === false) {
          setErrorMessage(checkData.message || `Username "${cleanUsername}" is already taken!`);
          if (checkData.suggestions) {
            setUsernameSuggestions(checkData.suggestions);
          }
          setIsSaving(false);
          return;
        }
      } catch {
        // Fallback on network issue
      }
    }

    // Call update API
    try {
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: stats.userId,
          username: cleanUsername,
          shortDescription: shortDesc,
          country: country,
        }),
      });
    } catch (err) {
      console.warn('Profile update sync warning:', err);
    }

    onUpdateProfile(cleanUsername, shortDesc, country);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    NotificationService.savePreferences(updated);
  };

  const handleRequestPush = async () => {
    setIsRegisteringPush(true);
    const res = await NotificationService.requestPermission(stats.userId);
    setNotifPermission(res.granted ? 'granted' : 'denied');
    setIsRegisteringPush(false);
    if (res.granted) {
      setTestNotifMessage('Push notifications enabled & device token registered!');
      setTimeout(() => setTestNotifMessage(null), 4000);
    }
  };

  const handleSendTestAlert = async () => {
    setTestNotifMessage('Sending test notification...');
    const res = await NotificationService.sendTestNotification(stats.userId);
    setTestNotifMessage(res.message);
    setTimeout(() => setTestNotifMessage(null), 4500);
  };

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto pb-8">
      {/* Account Status / Auth Action Banner */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl bg-gradient-to-br from-slate-900/90 via-slate-950/80 to-slate-900/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
              isGuest
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}>
              {isGuest ? '🎮' : '👑'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base sm:text-lg truncate">
                  {isGuest ? 'Guest Mode' : stats.username}
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  isGuest
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {isGuest ? 'Playing Locally' : 'Cloud Synchronized'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isGuest
                  ? 'Sign up to lock in your score on the global leaderboard, or log into an existing account.'
                  : 'Your account and progress are safe. You can log out anytime to play on another account.'}
              </p>
            </div>
          </div>

          {/* Action Buttons: If guest -> Login & Sign Up. If logged in -> Only Logout */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isGuest ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenClaimModal('login')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                >
                  <LogIn className="w-4 h-4 text-sky-400" />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenClaimModal('signup')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-slate-950" />
                  <span>Register</span>
                </button>
              </>
            ) : (
              onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      title: 'Log Out Account?',
                      message: 'Are you sure you want to log out? You will be returned to Guest Mode, and your online score remains safe on the cloud.',
                      confirmText: 'Log Out',
                      cancelText: 'Cancel',
                      type: 'danger',
                      icon: 'logout',
                      onConfirm: () => onLogout(),
                    });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 font-bold text-xs sm:text-sm border border-red-500/30 transition-all cursor-pointer active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              )
            )}
          </div>
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
          <div className="mb-1">
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Player Bio & Brand Showcase</span>
            </label>
            <textarea
              value={shortDesc}
              maxLength={250}
              rows={4}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400 text-sm resize-none"
              placeholder="e.g. 👑 #1 Champion | Follow @mybrand on X | Visit click2top.app for special events! ⚡"
            />
            <div className="text-right text-[11px] text-slate-500 font-mono mt-1">
              {shortDesc.length}/250
            </div>
          </div>

          {/* Error Banner with Smart Suggestions */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm space-y-2.5 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {usernameSuggestions.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-red-500/20">
                  <p className="text-[11px] text-slate-300 font-semibold">
                    💡 Available suggestions (click to auto-fill):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {usernameSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setUsername(sug);
                          setErrorMessage(null);
                          setUsernameSuggestions([]);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-amber-500/20 hover:text-amber-300 border border-red-500/40 text-red-200 font-mono font-bold text-xs transition-all cursor-pointer active:scale-95"
                      >
                        +{sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Checking & Saving...' : 'Save Profile Changes'}</span>
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
          {rankHistory.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs sm:text-sm">
              No historical season ranks recorded yet. Play actively in weekly tournaments to earn your permanent badge!
            </div>
          ) : (
            rankHistory.map((item) => (
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
            ))
          )}
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

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {notifPermission === 'granted' ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl">
                  <Check className="w-3.5 h-3.5" />
                  <span>Active</span>
                </span>
                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                  title="Dispatch instant test notification"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Test Push</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestPush}
                disabled={isRegisteringPush}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isRegisteringPush ? 'Connecting...' : 'Enable Push Notifications'}
              </button>
            )}
          </div>
        </div>

        {testNotifMessage && (
          <div className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{testNotifMessage}</span>
          </div>
        )}

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

      {/* DANGER ZONE: Reset Progress */}
      {onResetData && (
        <div className="glass-panel rounded-2xl p-5 border border-red-500/20 bg-red-950/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-extrabold text-red-400 uppercase tracking-wide">
              Reset Game Progress
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Wipe saved energy, combo, and shop items to experience the hardcore progression from scratch.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmDialog({
                title: 'Reset All Progress?',
                message: 'Are you sure you want to reset your local progress and restart from 0 Energy? This action cannot be undone.',
                confirmText: 'Reset To 0',
                cancelText: 'Cancel',
                type: 'danger',
                icon: 'delete',
                onConfirm: () => onResetData(),
              });
            }}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Reset Progress
          </button>
        </div>
      )}

      {/* Custom Confirmation Popup Modal */}
      <ConfirmationModal
        isOpen={!!confirmDialog}
        options={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
};
