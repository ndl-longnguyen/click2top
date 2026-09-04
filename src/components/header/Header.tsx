'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
    <header className="w-full glass-panel rounded-2xl p-3 sm:p-4 mb-4 border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
      {/* Brand & Actions on Mobile Row */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.35)] shrink-0 bg-black/60 aspect-square">
            <Image
              src="/logo.png"
              alt="Click 2 Top Logo"
              fill
              sizes="(max-width: 640px) 36px, 44px"
              className="object-contain p-0.5"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-black tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-white bg-clip-text text-transparent leading-tight truncate">
              CLICK 2 TOP
            </h1>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-sky-400 font-semibold tracking-wide">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
              <span className="truncate">COMPETITIVE ARENA</span>
            </div>
          </div>
        </div>

        {/* Mobile-only compact actions */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl glass-panel border border-white/10 text-slate-300 cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl glass-panel border border-white/10 text-white font-bold text-xs cursor-pointer max-w-[110px]"
            title="Open Profile"
          >
            <span className="text-sm shrink-0">{getCountryFlag(country)}</span>
            <span className="truncate text-xs">{username}</span>
          </button>
        </div>
      </div>

      {/* Primary Energy & Production Display */}
      <div className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-3 sm:gap-4 bg-black/40 px-3.5 sm:px-4 py-2 rounded-xl border border-sky-500/20 shadow-inner">
        <div className="text-right">
          <div className="text-[9px] sm:text-xs text-sky-300/80 uppercase font-bold tracking-wider">
            Spendable Energy
          </div>
          <div className="flex items-center gap-1.5 text-lg sm:text-2xl font-black text-sky-400 font-mono drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
            <span>{Math.floor(currentEnergy).toLocaleString()}</span>
          </div>
        </div>

        {passivePerSec > 0 && (
          <div className="pl-3 border-l border-white/10 text-left">
            <div className="text-[9px] sm:text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
              Passive Rate
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
              +{passivePerSec.toLocaleString()} ⚡/s
            </div>
          </div>
        )}
      </div>

      {/* Desktop Actions */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={handleToggleSound}
          className="p-2.5 rounded-xl glass-panel border border-white/10 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Game Sounds' : 'Mute Game Sounds'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>

        <button
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel border border-white/10 hover:border-amber-400/50 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer max-w-[160px]"
          title="Open Profile"
        >
          <span className="text-base shrink-0">{getCountryFlag(country)}</span>
          <span className="truncate">{username}</span>
        </button>

        {isGuest && (
          <button
            onClick={onOpenClaimModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-95 cursor-pointer shrink-0"
            title="Claim Permanent Account"
          >
            <ShieldAlert className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Save</span>
          </button>
        )}
      </div>
    </header>
  );
};
