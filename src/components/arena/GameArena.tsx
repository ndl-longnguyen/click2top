'use client';

import React, { useState } from 'react';
import { ArenaObject, FloatingTextItem } from '@/lib/types/game';
import { FloatingText } from './FloatingText';
import { Flame } from 'lucide-react';
import { GAME_CONFIG } from '@/lib/config/gameConfig';

interface GameArenaProps {
  objects: ArenaObject[];
  floatingTexts: FloatingTextItem[];
  currentCombo: number;
  bestCombo: number;
  onCoinClick: (id: string, x: number, y: number) => void;
  onBoomClick: (id: string, x: number, y: number) => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  objects,
  floatingTexts,
  currentCombo,
  bestCombo,
  onCoinClick,
  onBoomClick,
}) => {
  const [shaking, setShaking] = useState(false);

  const handleBoomInteract = (id: string, x: number, y: number) => {
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
    onBoomClick(id, x, y);
  };

  // Combo multiplier lookup
  let comboMult = 1.0;
  for (const t of GAME_CONFIG.combo.thresholds) {
    if (currentCombo >= t.clicks) {
      comboMult = t.multiplier;
      break;
    }
  }

  return (
    <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[460px] md:min-h-[520px] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] flex flex-col justify-between">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Arena Top Info Bar (Combo & Best Combo) */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all duration-300 ${
              currentCombo > 0
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 neon-glow-gold'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <Flame
              className={`w-4 h-4 ${
                currentCombo >= 10 ? 'text-orange-500 animate-flame' : 'text-amber-400'
              }`}
            />
            <span className="font-extrabold tracking-wide text-sm sm:text-base">
              COMBO ×{comboMult.toFixed(1)}
            </span>
            <span className="text-xs text-white/60 font-mono ml-1">({currentCombo})</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 tracking-wider uppercase font-semibold">
            Best Combo:{' '}
          </span>
          <span className="text-xs font-bold text-amber-400 font-mono">×{bestCombo}</span>
        </div>
      </div>

      {/* Playable Arena Field */}
      <div
        id="playable-arena-field"
        className={`relative flex-1 w-full h-full cursor-crosshair ${
          shaking ? 'animate-screen-shake' : ''
        }`}
      >
        <FloatingText items={floatingTexts} />

        {/* Stationary Arena Objects */}
        {objects.map((obj) => {
          const isCoin = obj.type === 'coin';

          return (
            <button
              key={obj.id}
              onClick={(e) => {
                e.stopPropagation();
                if (isCoin) {
                  onCoinClick(obj.id, obj.x, obj.y);
                } else {
                  handleBoomInteract(obj.id, obj.x, obj.y);
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              style={{
                left: `${obj.x}%`,
                top: `${obj.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              aria-label={isCoin ? 'Collect Coin' : 'Avoid Boom'}
              className={`absolute group cursor-pointer focus:outline-none transition-transform duration-100 active:scale-90 active:opacity-75 ${
                isCoin ? 'animate-coin-pulse' : 'animate-boom-pulse'
              }`}
            >
              {isCoin ? (
                // 🪙 COIN COMPONENT
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 shadow-[0_4px_25px_rgba(245,158,11,0.5),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(180,83,9,0.9)] border-2 border-amber-300">
                  {/* Subtle Coin Emboss Ring */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-amber-500/50 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl select-none filter drop-shadow">🪙</span>
                  </div>
                  {/* Outer Sparkle Halo */}
                  <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md -z-10 group-hover:scale-125 transition-transform" />
                </div>
              ) : (
                // 💣 BOOM COMPONENT
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-slate-900 via-red-950 to-red-900 border-2 border-red-500/80 shadow-[0_4px_25px_rgba(239,68,68,0.6),inset_0_2px_4px_rgba(255,255,255,0.3)]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-red-500/30 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl select-none filter drop-shadow">💣</span>
                  </div>
                  {/* Warning Glow */}
                  <div className="absolute inset-0 rounded-full bg-red-600/30 blur-md -z-10 animate-ping opacity-60" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Arena Bottom Helper / Status */}
      <div className="relative z-10 px-5 py-2.5 bg-black/25 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Click 🪙 Coin for Energy • Dodge 💣 Boom</span>
        </div>
        <div className="hidden sm:block text-slate-400 font-mono">
          Objects: {objects.length}/{GAME_CONFIG.arena.maxObjects}
        </div>
      </div>
    </div>
  );
};
