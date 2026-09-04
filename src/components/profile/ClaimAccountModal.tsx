'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface ClaimAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUserId: string, newUsername: string) => void;
}

export const ClaimAccountModal: React.FC<ClaimAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setStatusMessage({ text: 'Please enter a username', isError: true });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const supabase = getSupabaseClient();

    if (supabase && isSupabaseConfigured && email && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });

        if (error) {
          throw error;
        }

        const userId = data.user?.id || 'user_' + Math.random().toString(36).substring(2, 9);
        setStatusMessage({ text: 'Account registered! Merging progress...' });
        setTimeout(() => {
          onSuccess(userId, username);
          onClose();
        }, 1200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Registration failed';
        setStatusMessage({ text: msg, isError: true });
      } finally {
        setLoading(false);
      }
    } else {
      // Local conversion when Supabase env vars are not yet configured
      setTimeout(() => {
        const localUserId = 'user_' + Math.random().toString(36).substring(2, 9);
        onSuccess(localUserId, username);
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
          className="absolute top-5 right-5 p-1 rounded-xl glass-panel text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Save Progress & Claim Rank</h3>
            <p className="text-xs text-slate-400">
              Never lose your upgrades and display your name on the Leaderboard.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
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

          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
              Email Address (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
              Password (Optional)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                statusMessage.isError
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm tracking-wide shadow-lg active:scale-95 transition-all"
            >
              {loading ? 'Securing Account...' : 'Convert & Merge Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
