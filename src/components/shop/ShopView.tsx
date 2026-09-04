'use client';

import React, { useState } from 'react';
import { GAME_CONFIG, calculateItemPrice, calculatePassiveProduction } from '@/lib/config/gameConfig';
import { ShopItem } from '@/lib/types/game';
import { Lock, ArrowUpCircle } from 'lucide-react';

interface ShopViewProps {
  currentEnergy: number;
  totalEarnedEnergy: number;
  items: Record<string, number>;
  onBuyItem: (item: ShopItem) => { success: boolean; message?: string };
}

export const ShopView: React.FC<ShopViewProps> = ({
  currentEnergy,
  totalEarnedEnergy,
  items,
  onBuyItem,
}) => {
  const [feedback, setFeedback] = useState<{ id: string; msg: string; isError?: boolean } | null>(null);

  const totalPassiveRate = calculatePassiveProduction(items);
  const earthClickerLevel = items['earth_clicker'] || 0;
  const currentClickMultiplier = earthClickerLevel > 0 ? earthClickerLevel + 1 : 1;

  const handlePurchase = (item: ShopItem) => {
    const res = onBuyItem(item);
    if (!res.success) {
      setFeedback({ id: item.id, msg: res.message || 'Purchase failed', isError: true });
    } else {
      setFeedback({ id: item.id, msg: 'Upgraded!' });
    }
    setTimeout(() => setFeedback(null), 1500);
  };

  const clickPowerItems = GAME_CONFIG.shopItems.filter((i) => i.type === 'click_power');
  const passiveItems = GAME_CONFIG.shopItems.filter((i) => i.type === 'passive');

  return (
    <div className="w-full space-y-6">
      {/* Shop Summary Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-sky-500/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>🛒</span>
            <span className="bg-gradient-to-r from-amber-300 to-yellow-100 bg-clip-text text-transparent">
              POWER & GENERATOR SHOP
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reinvest your Energy to multiply click rewards and generate automatic passive power.
          </p>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-4 bg-black/40 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/5">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Total Passive Output</div>
            <div className="text-sm sm:text-lg font-black text-emerald-400 font-mono">
              +{totalPassiveRate.toLocaleString()} ⚡/sec
            </div>
          </div>
          <div className="pl-3 sm:pl-4 border-l border-white/10 text-right sm:text-left">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Click Power</div>
            <div className="text-sm sm:text-lg font-black text-amber-400 font-mono">
              ×{currentClickMultiplier}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: CLICK POWER */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚡</span>
          <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-amber-400">
            Active Click Power
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clickPowerItems.map((item) => {
            const level = items[item.slug] || 0;
            const price = calculateItemPrice(item.basePrice, item.priceGrowth, level);
            const canAfford = currentEnergy >= price;
            const isLocked = totalEarnedEnergy < item.unlockRequirement;
            const currentMult = level > 0 ? level + 1 : 1;
            const nextMult = level + 2;

            return (
              <div
                key={item.id}
                className="relative glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between transition-all hover:border-amber-500/40"
              >
                {isLocked && (
                  <div className="absolute inset-0 z-20 backdrop-blur-sm bg-black/75 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                    <Lock className="w-8 h-8 text-amber-400 mb-2" />
                    <div className="font-black text-sm text-white">LOCKED</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Requires {item.unlockRequirement.toLocaleString()} ⚡ total energy earned
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-base text-white tracking-wide">{item.name}</h4>
                        <div className="text-xs font-mono font-bold text-amber-400">
                          Level {level}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">{item.description}</p>

                  <div className="mt-4 p-3 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Effect:</span>
                    <div className="font-mono font-bold text-white">
                      <span className="text-amber-400">×{currentMult} Click Power</span>
                      <span className="text-slate-500 mx-1.5">→</span>
                      <span className="text-emerald-400">×{nextMult}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Cost</div>
                    <div className="text-sm sm:text-base font-black text-sky-400 font-mono">
                      {price.toLocaleString()} ⚡
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford || isLocked}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 transition-all ${
                      canAfford && !isLocked
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>{level === 0 ? 'UNLOCK' : 'UPGRADE'}</span>
                  </button>
                </div>

                {feedback?.id === item.id && (
                  <div
                    className={`mt-2 text-center text-xs font-bold ${
                      feedback.isError ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {feedback.msg}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PASSIVE GENERATORS */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🏭</span>
          <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-emerald-400">
            Passive Energy Generators
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {passiveItems.map((item) => {
            const level = items[item.slug] || 0;
            const price = calculateItemPrice(item.basePrice, item.priceGrowth, level);
            const canAfford = currentEnergy >= price;
            const isLocked = totalEarnedEnergy < item.unlockRequirement;
            const currentProd = item.baseProduction * level;
            const nextProd = item.baseProduction * (level + 1);

            return (
              <div
                key={item.id}
                className="relative glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between transition-all hover:border-emerald-500/40"
              >
                {isLocked && (
                  <div className="absolute inset-0 z-20 backdrop-blur-sm bg-black/75 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                    <Lock className="w-8 h-8 text-amber-400 mb-2" />
                    <div className="font-black text-sm text-white">🔒 {item.name}</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Required: {item.unlockRequirement.toLocaleString()} ⚡
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-white tracking-wide">
                        {item.name}
                      </h4>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        Level {level}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">{item.description}</p>

                  <div className="mt-4 p-2.5 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Output:</span>
                    <div>
                      <span className="text-emerald-400">+{currentProd.toLocaleString()}</span>
                      <span className="text-slate-500 mx-1">→</span>
                      <span className="text-sky-300 font-bold">+{nextProd.toLocaleString()} ⚡/s</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Cost</div>
                    <div className="text-xs sm:text-sm font-black text-sky-400 font-mono">
                      {price.toLocaleString()} ⚡
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford || isLocked}
                    className={`px-4 py-2 rounded-xl font-extrabold text-xs tracking-wide flex items-center gap-1 transition-all ${
                      canAfford && !isLocked
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>{level === 0 ? 'BUY' : 'UPGRADE'}</span>
                  </button>
                </div>

                {feedback?.id === item.id && (
                  <div
                    className={`mt-2 text-center text-xs font-bold ${
                      feedback.isError ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {feedback.msg}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
