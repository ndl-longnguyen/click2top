'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User, LogIn, UserPlus, AlertTriangle } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ConfirmationModal, ConfirmDialogOptions } from '@/components/common/ConfirmationModal';

interface ClaimAccountModalProps {
  isOpen: boolean;
  isGuest: boolean;
  defaultMode?: 'signup' | 'login';
  onClose: () => void;
  onClaimGuestSuccess: (newUserId: string, newUsername: string) => void;
  onLoginSuccess: (userId: string, username: string) => void;
}

export const ClaimAccountModal: React.FC<ClaimAccountModalProps> = ({
  isOpen,
  isGuest,
  defaultMode = 'signup',
  onClose,
  onClaimGuestSuccess,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>(defaultMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean; suggestions?: string[] } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);

  // Sync mode when defaultMode changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setStatusMessage(null);
      setConfirmDialog(null);
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  const doLogin = async () => {
    setLoading(true);
    setStatusMessage(null);
    const supabase = getSupabaseClient();

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const loggedInUserId = data.user?.id;
        const loggedInName = data.user?.user_metadata?.username || email.split('@')[0] || 'Player';

        if (loggedInUserId) {
          setStatusMessage({ text: 'Logged in successfully! Restoring account data...' });
          setTimeout(() => {
            onLoginSuccess(loggedInUserId, loggedInName);
            onClose();
          }, 1000);
        } else {
          throw new Error('User account not found');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
        setStatusMessage({ text: msg, isError: true });
      } finally {
        setLoading(false);
      }
    } else {
      setStatusMessage({ text: 'Database credentials not configured. Local login simulated.' });
      setTimeout(() => {
        onLoginSuccess('user_local_' + Math.random().toString(36).substring(2, 7), email.split('@')[0] || 'Player');
        setLoading(false);
        onClose();
      }, 800);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const supabase = getSupabaseClient();

    if (mode === 'login') {
      if (!email || !password) {
        setStatusMessage({ text: 'Please enter both Email and Password', isError: true });
        setLoading(false);
        return;
      }

      if (isGuest) {
        setLoading(false);
        setConfirmDialog({
          title: 'Discard Guest Progress?',
          message:
            'You are currently playing as a Guest. Logging into an existing account will restore that account’s data and discard your unsaved guest score.',
          confirmText: 'Continue & Log In',
          cancelText: 'Stay As Guest',
          type: 'warning',
          icon: 'warning',
          onConfirm: () => {
            doLogin();
          },
        });
        return;
      }

      doLogin();
      return;
    }

    // --- SIGN UP / CLAIM FLOW ---
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    if (!cleanUsername) {
      setStatusMessage({ text: 'Please enter a username', isError: true });
      setLoading(false);
      return;
    }

    if (!cleanEmail) {
      setStatusMessage({ text: 'Please enter a valid email address', isError: true });
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setStatusMessage({ text: 'Password is required and must be at least 6 characters', isError: true });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setStatusMessage({ text: 'Passwords do not match. Please check again!', isError: true });
      setLoading(false);
      return;
    }

    try {
      const checkRes = await fetch(`/api/profile/check-username?username=${encodeURIComponent(cleanUsername)}`);
      const checkData = await checkRes.json();
      if (checkData.available === false) {
        setStatusMessage({
          text: checkData.message || `Username "${cleanUsername}" is already taken. Please choose another!`,
          isError: true,
          suggestions: checkData.suggestions,
        });
        setLoading(false);
        return;
      }
    } catch {
      // Offline fallback
    }

    if (supabase && isSupabaseConfigured && email && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: cleanUsername },
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already exists')) {
            setStatusMessage({
              text: 'This email is already registered! Please switch to the "Log In" tab to access your account.',
              isError: true,
            });
            setLoading(false);
            return;
          }
          throw error;
        }

        // In Supabase, if email confirmation is enabled and user already exists,
        // signUp returns user with identities: [] without throwing an error.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setStatusMessage({
            text: 'This email is already registered! Please switch to the "Log In" tab to access your account.',
            isError: true,
          });
          setLoading(false);
          return;
        }

        const userId = data.user?.id || 'user_' + Math.random().toString(36).substring(2, 9);
        setStatusMessage({ text: 'Account registered! Merging progress...' });
        setTimeout(() => {
          onClaimGuestSuccess(userId, cleanUsername);
          onClose();
        }, 1200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Registration failed';
        setStatusMessage({ text: msg, isError: true });
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        const localUserId = 'user_' + Math.random().toString(36).substring(2, 9);
        onClaimGuestSuccess(localUserId, cleanUsername);
        setLoading(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-7 border border-amber-500/40 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            {mode === 'signup' ? <ShieldCheck className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              {mode === 'signup' ? 'Save & Create Account' : 'Log In Existing Account'}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'signup'
                ? 'Save your progress and lock your spot on the Global Leaderboard.'
                : 'Log in to restore your save game and climb the ranks on any device.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/40 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setStatusMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${mode === 'signup'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create / Claim</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setStatusMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${mode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
        </div>

        {/* Warning Banner for Guest Logging into Existing Account */}
        {mode === 'login' && isGuest && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <div>
              <span className="font-bold block text-white mb-0.5">⚠️ Data Override Notice:</span>
              Logging into an existing account will restore that account&apos;s saved data. Your unsaved Guest progress will be replaced.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
                Username *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose unique username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white font-bold focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 characters)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>
            </div>
          )}

          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold text-center space-y-2 ${statusMessage.isError
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
            >
              <div>{statusMessage.text}</div>
              {statusMessage.suggestions && statusMessage.suggestions.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {statusMessage.suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setUsername(sug);
                        setStatusMessage(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-amber-500/20 hover:text-amber-300 text-white font-mono text-[11px] border border-red-500/40 cursor-pointer active:scale-95 transition-all"
                    >
                      +{sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm tracking-wide shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading
                ? mode === 'signup'
                  ? 'Securing Account...'
                  : 'Logging In...'
                : mode === 'signup'
                  ? 'Convert & Merge Progress'
                  : 'Log In To Account'}
            </button>
          </div>
        </form>
      </div>

      {/* Custom Confirmation Popup */}
      <ConfirmationModal
        isOpen={!!confirmDialog}
        options={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
};
