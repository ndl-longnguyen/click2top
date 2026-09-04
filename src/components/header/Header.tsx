'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Zap, Sparkles, ShieldAlert } from 'lucide-react';
import { soundEffects } from '@/lib/sound/soundEffects';
import { getCountryFlag } from '@/lib/config/countries';

interface HeaderProps {
  currentEnergy: number;
  passivePerSec: number;
  isGuest: boolean;
  username: string;
  country?: string;
  onOpenProfile: () => void;
  onOpenClaimModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentEnergy,
  passivePerSec,
  isGuest,
  username,
  country,
  onOpenProfile,
  onOpenClaimModal,
}) => {
  const [isMuted, setIsMuted] = useState(() => soundEffects.getIsMuted());

  const handleToggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="w-full glass-panel rounded-2xl p-3 sm:p-4 mb-4 border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-3">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">
          🪙
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-black tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-white bg-clip-text text-transparent">
            COIN CLICKER
          </h1>
          <div className="flex items-center gap-1 text-[11px] text-sky-400 font-semibold tracking-wide">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>COMPETITIVE ARENA</span>
          </div>
        </div>
      </div>

      {/* Primary Energy & Production Display */}
      <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl border border-sky-500/20 shadow-inner">
        <div className="text-right">
          <div className="text-[10px] sm:text-xs text-sky-300/80 uppercase font-bold tracking-wider">
            Spendable Energy
          </div>
          <div className="flex items-center gap-1.5 text-lg sm:text-2xl font-black text-sky-400 font-mono drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>{Math.floor(currentEnergy).toLocaleString()}</span>
          </div>
        </div>

        {passivePerSec > 0 && (
          <div className="hidden xs:block pl-3 border-l border-white/10 text-left">
            <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
              Passive Rate
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
              +{passivePerSec.toLocaleString()} ⚡/s
            </div>
          </div>
        )}
      </div>

      {/* Actions: Sound toggle & Profile / Guest CTA */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <button
          onClick={handleToggleSound}
          className="p-2.5 rounded-xl glass-panel border border-white/10 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Game Sounds' : 'Mute Game Sounds'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>

        {/* Profile Button with Country Flag */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel border border-white/10 hover:border-amber-400/50 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
          title="Open Profile"
        >
          <span className="text-base">{getCountryFlag(country)}</span>
          <span className="max-w-[80px] sm:max-w-[120px] truncate">{username}</span>
        </button>

        {/* Guest Save Progress CTA */}
        {isGuest && (
          <button
            onClick={onOpenClaimModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-95 cursor-pointer"
            title="Claim Permanent Account"
          >
            <ShieldAlert className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">Save</span>
          </button>
        )}
      </div>
    </header>
  );
};
