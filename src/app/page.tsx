'use client';

import { MAIN_SITE_URL } from "@/lib/config/site";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  const [claimModalMode, setClaimModalMode] = useState<'signup' | 'login'>('signup');

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
    loadAccountData,
    logoutCurrentAccount,
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
            liveScore={stats.currentEnergy}
            currentCountry={stats.country}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            stats={stats}
            isGuest={isGuest}
            onUpdateProfile={updateProfile}
            onOpenClaimModal={(mode) => {
              setClaimModalMode(mode || 'signup');
              setIsClaimModalOpen(true);
            }}
            onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
            onResetData={resetGameData}
            onLogout={logoutCurrentAccount}
          />
        )}
      </div>

      {/* Game Guide & Compliance Information Section */}
      <section className="w-full max-w-4xl mt-14 pt-10 border-t border-white/10 text-slate-400 text-xs font-sans space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-sm sm:text-base font-extrabold text-amber-400 uppercase tracking-wider mb-2">
            About Click 2 Top Arcade
          </h2>
          <p className="leading-relaxed text-slate-300">
            Click 2 Top is a fast-paced, competitive coin-clicker web arcade game designed for quick reflex training and international rivalry. Tap appearing golden coins, maintain rapid click combos, and avoid red tactical bombs to maximize your total energy score. Every click counts towards your individual rank and your country&apos;s standing on the global Nations Cup world leaderboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
            <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wide">
              Combo Multipliers
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Tap coins consecutively without missing to build up combo multipliers up to 10x. Beware of exploding bombs that instantly reset your active combo streak!
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
            <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wide">
              Nations Cup
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Represent your country proudly. Scores from all national players accumulate in real time to crown the #1 champion nation on the global leaderboard.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
            <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wide">
              Passive Automation
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Invest your energy points into automated power generators in the Shop to continuously produce energy even while you are away (offline earnings).
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className="w-full pt-8 pb-12 sm:pb-6 text-center border-t border-white/10 text-xs text-slate-500 space-y-3">
          <div className="flex flex-wrap justify-center items-center gap-4 text-[11px]">
            <Link href={MAIN_SITE_URL} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline">
              NDL Portfolio
            </Link>
            <span>•</span>
            <Link href={`${MAIN_SITE_URL}/blog`} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline">
              Engineering Blog
            </Link>
            <span>•</span>
            <Link href={`${MAIN_SITE_URL}/privacy-policy`} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href={`${MAIN_SITE_URL}/terms`} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline">
              Terms of Service
            </Link>
          </div>
          <p className="text-[10px] text-slate-600">
            © {new Date().getFullYear()} Click 2 Top — Part of the <a href={MAIN_SITE_URL} className="text-amber-400 hover:underline">{MAIN_SITE_URL.replace("https://", "")}</a> ecosystem.
          </p>
        </footer>
      </section>

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
        isGuest={isGuest}
        defaultMode={claimModalMode}
        onClose={() => setIsClaimModalOpen(false)}
        onClaimGuestSuccess={(newId, newName) => {
          mergeIntoAccount(newId, newName);
          setIsClaimModalOpen(false);
        }}
        onLoginSuccess={async (userId, username) => {
          await loadAccountData(userId, username);
          setIsClaimModalOpen(false);
        }}
      />

      {/* PWA Install Banner */}
      <PwaInstallPrompt />
    </main>
  );
}
