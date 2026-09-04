'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Flame, ChevronUp, Crown, ExternalLink, RefreshCw, Globe, Swords, Filter, Sparkles, Megaphone } from 'lucide-react';
import { LeaderboardEntry, PeriodWinner, CompetitorStatus, CountryStanding, NationalRivalryInfo } from '@/lib/types/game';
import { COUNTRIES, getCountryFlag, getCountryName } from '@/lib/config/countries';
import Link from 'next/link';

interface LeaderboardViewProps {
  currentUserId: string;
  currentUserScore: number;
  currentCountry?: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentUserId,
  currentUserScore,
  currentCountry = 'VN',
}) => {
  const [activeTab, setActiveTab] = useState<'global' | 'daily' | 'weekly' | 'nations' | 'hof'>('global');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [countryStandings, setCountryStandings] = useState<CountryStanding[]>([]);
  const [nationalRivalry, setNationalRivalry] = useState<NationalRivalryInfo | undefined>(undefined);
  const [topOneWinner, setTopOneWinner] = useState<PeriodWinner | null>(null);
  const [hallOfFame, setHallOfFame] = useState<PeriodWinner[]>([]);
  const [competitor, setCompetitor] = useState<CompetitorStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/leaderboard?period=${activeTab === 'nations' ? 'global' : activeTab}&userId=${currentUserId}&userScore=${currentUserScore}&userCountry=${currentCountry}&country=${countryFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setCountryStandings(data.countryStandings || []);
        setNationalRivalry(data.nationalRivalry || undefined);
        setTopOneWinner(data.topOneWinner || null);
        setHallOfFame(data.hallOfFame || []);
        setCompetitor(data.competitorStatus || null);
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, countryFilter, currentUserId, currentUserScore, currentCountry]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const url = `/api/leaderboard?period=${activeTab === 'nations' ? 'global' : activeTab}&userId=${currentUserId}&userScore=${currentUserScore}&userCountry=${currentCountry}&country=${countryFilter}`;
        const res = await fetch(url);
        if (res.ok && !ignore) {
          const data = await res.json();
          setEntries(data.entries || []);
          setCountryStandings(data.countryStandings || []);
          setNationalRivalry(data.nationalRivalry || undefined);
          setTopOneWinner(data.topOneWinner || null);
          setHallOfFame(data.hallOfFame || []);
          setCompetitor(data.competitorStatus || null);
        }
      } catch (e) {
        console.error('Failed to load leaderboard', e);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [activeTab, countryFilter, currentUserId, currentUserScore, currentCountry]);

  // Top 3 countries for Nations Cup Podium
  const topThreeNations = countryStandings.slice(0, 3);

  return (
    <div className="w-full space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-8">
      {/* Tab Navigation (Single-line responsive on mobile) */}
      <div className="flex items-center gap-1 sm:gap-2 glass-panel p-1.5 sm:p-2 rounded-2xl border border-white/10 w-full overflow-hidden">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
          {(['global', 'daily', 'weekly', 'nations', 'hof'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-0 flex items-center justify-center gap-0.5 sm:gap-1.5 px-1 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? tab === 'nations'
                    ? 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black'
                    : 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              } ${tab === 'hof' ? 'hidden sm:flex flex-initial' : ''}`}
            >
              {tab === 'global' && (
                <>
                  <span className="shrink-0">🏆</span>
                  <span className="truncate">Global</span>
                </>
              )}
              {tab === 'daily' && (
                <>
                  <span className="shrink-0">⚡</span>
                  <span className="truncate">Today</span>
                </>
              )}
              {tab === 'weekly' && (
                <>
                  <span className="shrink-0">🔥</span>
                  <span className="truncate">Weekly</span>
                </>
              )}
              {tab === 'nations' && (
                <>
                  <span className="shrink-0">🌐</span>
                  <span className="truncate sm:hidden">Nations</span>
                  <span className="hidden sm:inline">Nations Cup</span>
                </>
              )}
              {tab === 'hof' && (
                <>
                  <span className="shrink-0">👑</span>
                  <span className="truncate">Hall of Fame</span>
                </>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="p-1.5 sm:p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-0.5"
          title="Refresh Standings"
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Country Filter Bar for Individual Player Standings (Global, Daily, Weekly) - Single-line responsive on mobile */}
      {activeTab !== 'nations' && activeTab !== 'hof' && (
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2.5 rounded-2xl bg-black/40 border border-white/10 w-full overflow-hidden">
          <div className="flex items-center gap-1 text-slate-300 shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline text-xs font-bold text-slate-300">Filter by Country:</span>
          </div>

          <button
            onClick={() => setCountryFilter('ALL')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              countryFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="sm:hidden">🌍 All</span>
            <span className="hidden sm:inline">🌍 Global (All)</span>
          </button>

          {currentCountry && currentCountry !== 'ALL' && (
            <button
              onClick={() => setCountryFilter(currentCountry)}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                countryFilter === currentCountry
                  ? 'bg-sky-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                  : 'bg-white/5 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 border border-sky-500/20'
              }`}
            >
              <span className="shrink-0">{getCountryFlag(currentCountry)}</span>
              <span className="sm:hidden">{currentCountry}</span>
              <span className="hidden sm:inline truncate max-w-[120px]">My Country ({currentCountry})</span>
            </button>
          )}

          {/* Dropdown for any country */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-[10px] sm:text-xs text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer truncate"
          >
            <option value="ALL">🌍 Select Country...</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NATIONS CUP TAB (WORLD CHAMPIONSHIP) */}
      {/* ========================================================================= */}
      {activeTab === 'nations' && (
        <div className="space-y-5 sm:space-y-6">
          {/* Nations Cup Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 p-4 sm:p-6 bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/60 shadow-2xl">
            <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1.5 shrink-0">
                    <Globe className="w-3.5 h-3.5 text-amber-300" />
                    WORLD CLICKER CHAMPIONSHIP
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {countryStandings.length} NATIONS COMPETING
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white mt-1.5 tracking-wide leading-tight">
                  NATIONS CUP — WORLD CHAMPIONSHIP
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Current energy held by all clickers representing the same nation is aggregated. Click to lead your country to world dominance!
                </p>
              </div>

              {/* Player Contribution Badge */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 text-left sm:text-right shrink-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">Representing</div>
                <div className="text-base sm:text-lg font-black text-amber-300 flex items-center sm:justify-end gap-1.5 mt-0.5">
                  <span className="text-2xl shrink-0">{getCountryFlag(currentCountry)}</span>
                  <span className="truncate">{getCountryName(currentCountry)}</span>
                </div>
                <div className="text-[11px] text-sky-400 font-mono mt-0.5">
                  Contribution: {currentUserScore.toLocaleString()} ⚡
                </div>
              </div>
            </div>
          </div>

          {/* National Rivalry Tactical Intel Box */}
          {nationalRivalry && (
            <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 p-3.5 sm:p-4 bg-gradient-to-r from-sky-950/40 via-slate-900 to-black/60 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-xl sm:text-2xl">
                    <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                      NATIONAL RIVALRY TACTICAL INTEL
                    </div>
                    <div className="text-xs sm:text-base font-bold text-white mt-0.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="truncate">{getCountryFlag(nationalRivalry.userCountry)} {getCountryName(nationalRivalry.userCountry)}</span>
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] sm:text-xs shrink-0">
                        RANK #{nationalRivalry.userCountryRank}
                      </span>
                      <span className="text-xs text-slate-400 font-mono shrink-0">
                        ({nationalRivalry.userCountryScore.toLocaleString()} ⚡)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rivalry Context Callout */}
                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10 shrink-0">
                  {nationalRivalry.userCountryRank === 1 ? (
                    <div>
                      <div className="text-xs font-black text-emerald-400 flex items-center sm:justify-end gap-1">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>HOLDING WORLD #1 CROWN!</span>
                      </div>
                      {nationalRivalry.behindCountry && (
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          Leading {getCountryFlag(nationalRivalry.behindCountry.country)} {getCountryName(nationalRivalry.behindCountry.country)}{' '}
                          by <strong className="text-amber-400 font-mono">
                            +{nationalRivalry.behindCountry.leadDiff.toLocaleString()} ⚡
                          </strong>
                          . Keep clicking to defend the crown!
                        </div>
                      )}
                    </div>
                  ) : nationalRivalry.aheadCountry ? (
                    <div>
                      <div className="text-xs font-black text-amber-400 flex items-center sm:justify-end gap-1">
                        <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>CHASING THE CROWN!</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Need only{' '}
                        <strong className="text-amber-400 font-mono">
                          {nationalRivalry.aheadCountry.scoreDiff.toLocaleString()} ⚡
                        </strong>{' '}
                        to overtake {getCountryFlag(nationalRivalry.aheadCountry.country)} {getCountryName(nationalRivalry.aheadCountry.country)}{' '}
                        for Rank #{nationalRivalry.aheadCountry.rank}!
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* 3D-Style Podium for Top 3 Nations */}
          {topThreeNations.length >= 3 && (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-4 items-end pt-8 pb-4">
              {/* Rank 2 (Silver) */}
              <div className="flex flex-col items-center min-w-0">
                <div className="text-3xl sm:text-4xl mb-1.5 animate-bounce">
                  {getCountryFlag(topThreeNations[1].country)}
                </div>
                <div className="text-[11px] sm:text-sm font-black text-slate-200 text-center truncate w-full px-1">
                  {getCountryName(topThreeNations[1].country)}
                </div>
                <div className="text-[9px] sm:text-xs font-mono text-slate-400 mt-0.5 truncate max-w-full">
                  {topThreeNations[1].totalScore.toLocaleString()} ⚡
                </div>
                <div className="w-full h-24 sm:h-28 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-600/80 border-t-2 border-x-2 border-slate-400/50 flex flex-col items-center justify-center shadow-lg px-1 text-center">
                  <span className="text-xl sm:text-3xl font-black text-slate-200">🥈</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-300 mt-1 truncate w-full">2nd Place</span>
                </div>
              </div>

              {/* Rank 1 (Gold) */}
              <div className="flex flex-col items-center min-w-0">
                <div className="relative mb-1.5">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-pulse" />
                  <div className="text-4xl sm:text-5xl drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                    {getCountryFlag(topThreeNations[0].country)}
                  </div>
                </div>
                <div className="text-xs sm:text-base font-black text-amber-300 text-center truncate w-full px-1">
                  {getCountryName(topThreeNations[0].country)}
                </div>
                <div className="text-[10px] sm:text-sm font-mono text-amber-400 font-bold mt-0.5 truncate max-w-full">
                  {topThreeNations[0].totalScore.toLocaleString()} ⚡
                </div>
                <div className="w-full h-32 sm:h-36 mt-2 rounded-t-2xl bg-gradient-to-t from-amber-700 via-yellow-600 to-amber-500 border-t-2 border-x-2 border-yellow-300 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.4)] px-1 text-center">
                  <span className="text-2xl sm:text-4xl font-black text-slate-950">🥇</span>
                  <span className="text-[8px] sm:text-xs uppercase font-black text-slate-950 mt-1 tracking-wider truncate w-full leading-tight">
                    WORLD CHAMPION
                  </span>
                </div>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="flex flex-col items-center min-w-0">
                <div className="text-3xl sm:text-4xl mb-1.5 animate-bounce">
                  {getCountryFlag(topThreeNations[2].country)}
                </div>
                <div className="text-[11px] sm:text-sm font-black text-amber-200/80 text-center truncate w-full px-1">
                  {getCountryName(topThreeNations[2].country)}
                </div>
                <div className="text-[9px] sm:text-xs font-mono text-slate-400 mt-0.5 truncate max-w-full">
                  {topThreeNations[2].totalScore.toLocaleString()} ⚡
                </div>
                <div className="w-full h-20 sm:h-24 mt-2 rounded-t-2xl bg-gradient-to-t from-amber-900 to-amber-800/80 border-t-2 border-x-2 border-amber-600/50 flex flex-col items-center justify-center shadow-lg px-1 text-center">
                  <span className="text-xl sm:text-3xl font-black text-amber-500">🥉</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-300 mt-1 truncate w-full">3rd Place</span>
                </div>
              </div>
            </div>
          )}

          {/* Full National Standings Table */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <div className="px-3 sm:px-4 py-3 bg-white/5 text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider grid grid-cols-12 gap-1.5 sm:gap-2 items-center">
              <span className="col-span-2 sm:col-span-1 text-center">Rank</span>
              <span className="col-span-6 sm:col-span-5 truncate">Nation</span>
              <span className="hidden sm:block sm:col-span-3 text-center">National MVP</span>
              <span className="col-span-4 sm:col-span-3 text-right">Current Energy</span>
            </div>

            <div className="divide-y divide-white/5">
              {countryStandings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
                  No national rankings recorded yet. Start tapping in the arena to represent your nation!
                </div>
              ) : (
                countryStandings.map((nation) => {
                const isUserCountry = nation.country === currentCountry;
                const isGold = nation.rank === 1;
                const isSilver = nation.rank === 2;
                const isBronze = nation.rank === 3;

                return (
                  <div
                    key={nation.country}
                    className={`px-3 sm:px-4 py-3 sm:py-3.5 grid grid-cols-12 gap-1.5 sm:gap-2 items-center transition-colors ${
                      isUserCountry
                        ? 'bg-sky-500/15 border-l-4 border-sky-400'
                        : isGold
                        ? 'bg-amber-500/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="col-span-2 sm:col-span-1 text-center font-black">
                      {isGold && <span className="text-xl sm:text-2xl">🥇</span>}
                      {isSilver && <span className="text-xl sm:text-2xl">🥈</span>}
                      {isBronze && <span className="text-xl sm:text-2xl">🥉</span>}
                      {!isGold && !isSilver && !isBronze && (
                        <span className="text-slate-400 font-mono text-xs sm:text-sm">#{nation.rank}</span>
                      )}
                    </div>

                    {/* Country Flag & Name */}
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-2 min-w-0">
                      <span className="text-xl sm:text-2xl shrink-0" title={getCountryName(nation.country)}>
                        {getCountryFlag(nation.country)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-base text-white flex items-center gap-1 min-w-0">
                          <span className="truncate">{getCountryName(nation.country)}</span>
                          {isUserCountry && (
                            <span className="text-[9px] font-extrabold uppercase bg-sky-500 text-slate-950 px-1 py-0.2 rounded shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {nation.playerCount} Clickers
                        </div>
                      </div>
                    </div>

                    {/* Top Player / National MVP */}
                    <div className="hidden sm:flex sm:col-span-3 items-center justify-center min-w-0">
                      {nation.topPlayer ? (
                        <Link
                          href={`/player/${encodeURIComponent(nation.topPlayer.username)}`}
                          className="text-xs text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1 truncate"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate font-semibold">{nation.topPlayer.username}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </div>

                    {/* Total Country Score */}
                    <div className="col-span-4 sm:col-span-3 text-right min-w-0">
                      <div className="text-xs sm:text-base font-black text-amber-300 font-mono truncate">
                        {nation.totalScore.toLocaleString()} ⚡
                      </div>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INDIVIDUAL PLAYER STANDINGS (GLOBAL, TODAY, WEEKLY) */}
      {/* ========================================================================= */}
      {activeTab !== 'nations' && (
        <>
          {/* Top 1 Player Branding Showcase Card */}
          {topOneWinner && activeTab !== 'hof' && (
            <div className="relative glass-panel-gold rounded-3xl p-4 sm:p-6 overflow-hidden border border-amber-500/40 shadow-2xl">
              <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.6)] shrink-0 aspect-square">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl sm:text-3xl">
                      👑
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                        REIGNING #1 CHAMPION
                      </span>
                      <span className="text-base sm:text-lg shrink-0" title={getCountryName(topOneWinner.country)}>
                        {getCountryFlag(topOneWinner.country)}
                      </span>
                    </div>
                    <Link
                      href={`/player/${encodeURIComponent(topOneWinner.username)}`}
                      className="group flex items-center gap-1.5 mt-1 hover:underline min-w-0"
                    >
                      <h3 className="text-lg sm:text-2xl font-black text-white tracking-wide truncate">
                        {topOneWinner.username}
                      </h3>
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-amber-400 shrink-0" />
                    </Link>
                    <p className="text-xs sm:text-sm italic text-amber-200/90 mt-0.5 max-w-md truncate">
                      &ldquo;{topOneWinner.snapshotDescription}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-500/20 shrink-0">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Championship Score
                  </div>
                  <div className="text-lg sm:text-3xl font-black text-amber-400 font-mono drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                    {topOneWinner.finalScore.toLocaleString()} ⚡
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Immediate Competitor Tracker Bar */}
          {competitor && competitor.userScore > 0 && activeTab !== 'hof' && (
            <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-sky-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-black/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black text-xs sm:text-sm shrink-0">
                  #{competitor.userRank}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase flex items-center gap-1">
                    <span>Your Standing ({getCountryFlag(currentCountry)})</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white font-mono truncate">
                    {competitor.userScore.toLocaleString()} ⚡
                  </div>
                </div>
              </div>

              {competitor.isTopOne ? (
                <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs sm:text-sm">
                  <Crown className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
                  <span>You are currently #1! Defend your throne!</span>
                </div>
              ) : competitor.nextPlayerUsername ? (
                <div className="text-left sm:text-right border-t sm:border-t-0 pt-1.5 sm:pt-0 border-white/5">
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium flex items-center sm:justify-end gap-1">
                    <span>Next Rival:</span>
                    <span className="font-bold text-white truncate">
                      #{competitor.nextPlayerRank} {getCountryFlag(competitor.nextPlayerCountry)} {competitor.nextPlayerUsername}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-sky-400 flex items-center sm:justify-end gap-1 mt-0.5">
                    <ChevronUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Need only {(competitor.energyNeeded || 0).toLocaleString()} ⚡ to pass!</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Leaderboard Table / Hall of Fame List */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            {activeTab === 'hof' ? (
              // Hall of Fame Tab
              <div className="divide-y divide-white/5">
                <div className="p-3 sm:p-4 bg-white/5 font-extrabold text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Past Weekly Champions</span>
                  <span>Winning Score</span>
                </div>
                {hallOfFame.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
                    No weekly champions crowned yet. Be the first to claim glory for your nation!
                  </div>
                ) : (
                  hallOfFame.map((winner, idx) => (
                  <div
                    key={winner.id || idx}
                    className="p-3.5 sm:p-5 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-lg sm:text-xl shrink-0">
                        👑
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/player/${encodeURIComponent(winner.username)}`}
                          className="font-black text-sm sm:text-base text-white hover:text-amber-400 transition-colors flex items-center gap-1.5 min-w-0"
                        >
                          <span className="text-base shrink-0" title={getCountryName(winner.country)}>
                            {getCountryFlag(winner.country)}
                          </span>
                          <span className="truncate">{winner.username}</span>
                        </Link>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 italic truncate">
                          &ldquo;{winner.snapshotDescription}&rdquo;
                        </p>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-mono">
                          Week of {new Date(winner.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-lg font-black text-amber-400 font-mono">
                        {winner.finalScore.toLocaleString()} ⚡
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase">Crowned #1</div>
                    </div>
                  </div>
                ))
                )}
              </div>
            ) : (
              // Standard Leaderboard Table
              <div className="divide-y divide-white/5">
                <div className="px-3 sm:px-4 py-3 bg-white/5 text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider grid grid-cols-12 gap-1.5 sm:gap-2 items-center">
                  <span className="col-span-2 sm:col-span-1 text-center">Rank</span>
                  <span className="col-span-6 sm:col-span-7">Player</span>
                  <span className="hidden sm:block sm:col-span-2 text-center">Best Combo</span>
                  <span className="col-span-4 sm:col-span-2 text-right">Current Energy</span>
                </div>

                {entries.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-slate-400 text-xs sm:text-sm">
                    No active clickers from this country yet. Be the first to claim glory for your nation!
                  </div>
                ) : (
                  entries.map((player) => {
                    const isFirst = player.rank === 1;
                    const isSecond = player.rank === 2;
                    const isThird = player.rank === 3;
                    const isSelf = player.userId === currentUserId || player.isCurrentUser;

                    return (
                      <div
                        key={player.userId}
                        className={`px-3 sm:px-4 py-3 sm:py-3.5 transition-all ${
                          isFirst
                            ? 'rounded-2xl border-2 border-amber-400/70 bg-gradient-to-br from-amber-500/20 via-amber-950/30 to-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.25)] my-2.5'
                            : isSelf
                            ? 'bg-sky-500/15 border-l-4 border-sky-400'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center">
                          {/* Rank Badge */}
                          <div className="col-span-2 sm:col-span-1 text-center font-black">
                            {isFirst && <span className="text-xl sm:text-2xl animate-pulse">🥇</span>}
                            {isSecond && <span className="text-xl sm:text-2xl">🥈</span>}
                            {isThird && <span className="text-xl sm:text-2xl">🥉</span>}
                            {!isFirst && !isSecond && !isThird && (
                              <span className="text-slate-400 font-mono text-xs sm:text-sm">#{player.rank}</span>
                            )}
                          </div>

                          {/* Player Name */}
                          <div className="col-span-6 sm:col-span-7 pr-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <Link
                                href={`/player/${encodeURIComponent(player.username)}`}
                                className="font-black text-xs sm:text-base text-white hover:text-amber-400 transition-colors flex items-center gap-1.5 min-w-0"
                              >
                                <span className="text-base shrink-0" title={getCountryName(player.country)}>
                                  {getCountryFlag(player.country)}
                                </span>
                                <span className="truncate">{player.username}</span>
                              </Link>
                              {isSelf && (
                                <span className="text-[9px] font-extrabold uppercase bg-sky-500 text-slate-950 px-1 py-0.2 rounded shrink-0">
                                  YOU
                                </span>
                              )}
                              {isFirst && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 px-1.5 py-0.5 rounded shadow-sm shrink-0 flex items-center gap-1">
                                  <Crown className="w-2.5 h-2.5" />
                                  #1 CHAMPION
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Best Combo */}
                          <div className="hidden sm:flex sm:col-span-2 items-center justify-center gap-1 text-xs font-mono font-bold text-amber-400">
                            <Flame className="w-3.5 h-3.5" />
                            <span>×{player.bestCombo || 1}</span>
                          </div>

                          {/* Score */}
                          <div className="col-span-4 sm:col-span-2 text-right min-w-0">
                            <div className={`text-xs sm:text-sm font-black font-mono truncate ${isFirst ? 'text-amber-300' : 'text-sky-300'}`}>
                              {player.score.toLocaleString()} ⚡
                            </div>
                          </div>
                        </div>

                        {/* Top 1 Exclusive Full Bio & Brand Showcase Billboard */}
                        {isFirst && (
                          <div className="mt-2.5 sm:mt-3 p-3 sm:p-3.5 rounded-xl bg-black/60 border border-amber-400/40 shadow-inner space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                                <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>#1 Champion Brand Billboard</span>
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-sm">
                                VIP SPOTLIGHT
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-amber-100/95 leading-relaxed break-words whitespace-pre-wrap selection:bg-amber-400 selection:text-slate-950">
                              {player.shortDescription || 'Crowned #1 Champion of the World! Reach Top 1 to broadcast your brand, community link, or slogan here!'}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
