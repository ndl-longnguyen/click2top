'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/lib/state/gameStore';
import { Header } from '@/components/header/Header';
import { GameArena } from '@/components/arena/GameArena';
import { ShopView } from '@/components/shop/ShopView';
import { LeaderboardView } from '@/components/leaderboard/LeaderboardView';
import { ProfileView } from '@/components/profile/ProfileView';
import { OfflineEarningsModal } from '@/components/offline/OfflineEarningsModal';
import { ClaimAccountModal } from '@/components/profile/ClaimAccountModal';
import { PwaInstallPrompt } from '@/components/common/PwaInstallPrompt';
import { calculatePassiveProduction } from '@/lib/config/gameConfig';
import { Gamepad2, ShoppingBag, Trophy, User } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'arena' | 'shop' | 'leaderboard' | 'profile'>('arena');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const {
    isInitialized,
    isGuest,
    stats,
    arenaObjects,
    floatingTexts,
    offlineModalOpen,
    offlineEarned,
    offlineElapsedSec,
    handleCoinClick,
    handleBoomClick,
    buyShopItem,
    collectOfflineEarnings,
    updateProfile,
    mergeIntoAccount,
    resetGameData,
  } = useGameStore();

  const passivePerSec = calculatePassiveProduction(stats.items);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070a12] text-amber-400">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse mb-4 bg-black/60">
          <Image
            src="/logo.png"
            alt="Click 2 Top Logo"
            fill
            sizes="80px"
            className="object-contain p-1"
            priority
          />
        </div>
        <div className="text-sm font-black tracking-widest uppercase bg-gradient-to-r from-amber-300 to-yellow-100 bg-clip-text text-transparent">
          Loading Click 2 Top...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col max-w-5xl mx-auto px-3 sm:px-6 pt-3 pb-24 sm:pb-8 w-full">
      {/* Top Header HUD */}
      <Header
        currentEnergy={stats.currentEnergy}
        passivePerSec={passivePerSec}
        isGuest={isGuest}
        username={stats.username}
        country={stats.country}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenClaimModal={() => setIsClaimModalOpen(true)}
      />

      {/* Desktop Navigation Tabs */}
      <nav
        aria-label="Main Navigation"
        className="hidden sm:flex items-center gap-2 mb-4 glass-panel p-1.5 rounded-2xl border border-white/10 w-fit self-center"
      >
        <button
          id="nav-tab-arena"
          onClick={() => setActiveTab('arena')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'arena'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          aria-label="Open Arena"
          aria-current={activeTab === 'arena' ? 'page' : undefined}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Arena</span>
        </button>

        <button
          id="nav-tab-shop"
          onClick={() => setActiveTab('shop')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'shop'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          aria-label="Open Shop & Upgrades"
          aria-current={activeTab === 'shop' ? 'page' : undefined}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop & Upgrades</span>
        </button>

        <button
          id="nav-tab-leaderboard"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          aria-label="Open Leaderboard"
          aria-current={activeTab === 'leaderboard' ? 'page' : undefined}
        >
          <Trophy className="w-4 h-4" />
          <span>Leaderboard</span>
        </button>

        <button
          id="nav-tab-profile"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          aria-label="Open Profile"
          aria-current={activeTab === 'profile' ? 'page' : undefined}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </nav>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col items-center w-full">
        {activeTab === 'arena' && (
          <GameArena
            objects={arenaObjects}
            floatingTexts={floatingTexts}
            currentCombo={stats.currentCombo}
            bestCombo={stats.bestCombo}
            onCoinClick={handleCoinClick}
            onBoomClick={handleBoomClick}
          />
        )}

        {activeTab === 'shop' && (
          <ShopView
            currentEnergy={stats.currentEnergy}
            totalEarnedEnergy={stats.totalEarnedEnergy}
            items={stats.items}
            onBuyItem={buyShopItem}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            currentUserId={stats.userId}
            currentUserScore={stats.currentEnergy}
            currentCountry={stats.country}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            stats={stats}
            isGuest={isGuest}
            onUpdateProfile={updateProfile}
            onOpenClaimModal={() => setIsClaimModalOpen(true)}
            onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
            onResetData={resetGameData}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-4 py-2.5 flex items-center justify-around backdrop-blur-xl bg-slate-950/85"
      >
        <button
          id="mobile-nav-arena"
          onClick={() => setActiveTab('arena')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'arena' ? 'text-amber-400 font-extrabold' : 'text-slate-400'
          }`}
          aria-label="Open Arena"
          aria-current={activeTab === 'arena' ? 'page' : undefined}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px] tracking-wide uppercase">Arena</span>
        </button>

        <button
          id="mobile-nav-shop"
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'shop' ? 'text-amber-400 font-extrabold' : 'text-slate-400'
          }`}
          aria-label="Open Shop"
          aria-current={activeTab === 'shop' ? 'page' : undefined}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] tracking-wide uppercase">Shop</span>
        </button>

        <button
          id="mobile-nav-leaderboard"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'leaderboard' ? 'text-amber-400 font-extrabold' : 'text-slate-400'
          }`}
          aria-label="Open Leaderboard"
          aria-current={activeTab === 'leaderboard' ? 'page' : undefined}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] tracking-wide uppercase">Rank</span>
        </button>

        <button
          id="mobile-nav-profile"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-amber-400 font-extrabold' : 'text-slate-400'
          }`}
          aria-label="Open Profile"
          aria-current={activeTab === 'profile' ? 'page' : undefined}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] tracking-wide uppercase">Profile</span>
        </button>
      </nav>

      {/* Offline Earnings Welcome Back Modal */}
      <OfflineEarningsModal
        isOpen={offlineModalOpen}
        earnedEnergy={offlineEarned}
        elapsedSeconds={offlineElapsedSec}
        onCollect={collectOfflineEarnings}
      />

      {/* Claim / Merge Guest Account Modal */}
      <ClaimAccountModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSuccess={(newId, newName) => {
          mergeIntoAccount(newId, newName);
          setIsClaimModalOpen(false);
        }}
      />

      {/* PWA Install Banner */}
      <PwaInstallPrompt />
    </main>
  );
}
