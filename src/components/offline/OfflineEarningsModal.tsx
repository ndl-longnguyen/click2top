'use client';

import React from 'react';
import { Zap, Sparkles } from 'lucide-react';

interface OfflineEarningsModalProps {
  isOpen: boolean;
  earnedEnergy: number;
  elapsedSeconds: number;
  onCollect: () => void;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  isOpen,
  earnedEnergy,
  elapsedSeconds,
  onCollect,
}) => {
  if (!isOpen || earnedEnergy <= 0) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-panel-gold rounded-3xl p-6 sm:p-8 border border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-center space-y-5">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-[0_0_30px_rgba(245,158,11,0.6)]">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-4xl">
            ⚡
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1 text-xs uppercase font-extrabold tracking-widest text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WELCOME BACK!</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Generators Were Busy!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            While you were away for {hours > 0 ? `${hours}h ` : ''}{minutes}m, your automated power units produced:
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/30 flex items-center justify-center gap-2">
          <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
          <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
            +{Math.floor(earnedEnergy).toLocaleString()} ⚡
          </span>
        </div>

        <button
          onClick={onCollect}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base sm:text-lg tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.6)] active:scale-95 transition-all uppercase"
        >
          Collect Energy
        </button>
      </div>
    </div>
  );
};
