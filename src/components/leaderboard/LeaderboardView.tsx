'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Flame, ChevronUp, Crown, ExternalLink, RefreshCw } from 'lucide-react';
import { LeaderboardEntry, PeriodWinner, CompetitorStatus } from '@/lib/types/game';
import Link from 'next/link';

interface LeaderboardViewProps {
  currentUserId: string;
  currentUserScore: number;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentUserId,
  currentUserScore,
}) => {
  const [activeTab, setActiveTab] = useState<'global' | 'daily' | 'weekly' | 'hof'>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [topOneWinner, setTopOneWinner] = useState<PeriodWinner | null>(null);
  const [hallOfFame, setHallOfFame] = useState<PeriodWinner[]>([]);
  const [competitor, setCompetitor] = useState<CompetitorStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leaderboard?period=${activeTab}&userId=${currentUserId}&userScore=${currentUserScore}`
      );
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTopOneWinner(data.topOneWinner || null);
        setHallOfFame(data.hallOfFame || []);
        setCompetitor(data.competitorStatus || null);
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUserId, currentUserScore]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/leaderboard?period=${activeTab}&userId=${currentUserId}&userScore=${currentUserScore}`
        );
        if (res.ok && !ignore) {
          const data = await res.json();
          setEntries(data.entries || []);
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
  }, [activeTab, currentUserId, currentUserScore]);

  return (
    <div className="w-full space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-2 rounded-2xl border border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['global', 'daily', 'weekly', 'hof'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold tracking-wide uppercase transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'global' && '🏆 Global'}
              {tab === 'daily' && '⚡ Today'}
              {tab === 'weekly' && '🔥 Weekly'}
              {tab === 'hof' && '👑 Hall of Fame'}
            </button>
          ))}
        </div>

        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition-colors"
          title="Refresh Standings"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Top 1 Player Branding Showcase Card */}
      {topOneWinner && activeTab !== 'hof' && (
        <div className="relative glass-panel-gold rounded-3xl p-5 sm:p-6 overflow-hidden border border-amber-500/40 shadow-2xl">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.6)]">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
                  👑
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    REIGNING #1 CHAMPION
                  </span>
                </div>
                <Link
                  href={`/player/${encodeURIComponent(topOneWinner.username)}`}
                  className="group flex items-center gap-1.5 mt-1 hover:underline"
                >
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    {topOneWinner.username}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
                </Link>
                <p className="text-xs sm:text-sm italic text-amber-200/90 mt-1 max-w-md">
                  &ldquo;{topOneWinner.snapshotDescription}&rdquo;
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Championship Score
              </div>
              <div className="text-xl sm:text-3xl font-black text-amber-400 font-mono drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                {topOneWinner.finalScore.toLocaleString()} ⚡
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Competitor Tracker Bar */}
      {competitor && competitor.userScore > 0 && activeTab !== 'hof' && (
        <div className="glass-panel rounded-2xl p-4 border border-sky-500/30 shadow-lg flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black text-sm">
              #{competitor.userRank}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase">Your Standing</div>
              <div className="text-sm font-black text-white font-mono">
                {competitor.userScore.toLocaleString()} ⚡
              </div>
            </div>
          </div>

          {competitor.isTopOne ? (
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
              <Crown className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>You are currently #1! Defend your throne!</span>
            </div>
          ) : competitor.nextPlayerUsername ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-slate-400 font-medium">
                  Next Rank: <span className="font-bold text-white">#{competitor.nextPlayerRank} {competitor.nextPlayerUsername}</span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-sky-400 flex items-center justify-end gap-1">
                  <ChevronUp className="w-4 h-4 text-emerald-400" />
                  <span>Need only {(competitor.energyNeeded || 0).toLocaleString()} ⚡ to pass!</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Leaderboard Table / Hall of Fame List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        {activeTab === 'hof' ? (
          // Hall of Fame Tab
          <div className="divide-y divide-white/5">
            <div className="p-4 bg-white/5 font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Past Weekly Champions</span>
              <span>Final Standing</span>
            </div>
            {hallOfFame.map((winner, idx) => (
              <div
                key={winner.id || idx}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
                    👑
                  </div>
                  <div>
                    <Link
                      href={`/player/${encodeURIComponent(winner.username)}`}
                      className="font-black text-base text-white hover:text-amber-400 transition-colors"
                    >
                      {winner.username}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5 italic">
                      &ldquo;{winner.snapshotDescription}&rdquo;
                    </p>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      Week of {new Date(winner.periodStart).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base sm:text-lg font-black text-amber-400 font-mono">
                    {winner.finalScore.toLocaleString()} ⚡
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">Crowned #1</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Standard Leaderboard Table
          <div className="divide-y divide-white/5">
            <div className="px-4 py-3 bg-white/5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider grid grid-cols-12 gap-2">
              <span className="col-span-2 sm:col-span-1 text-center">Rank</span>
              <span className="col-span-6 sm:col-span-7">Player</span>
              <span className="hidden sm:block sm:col-span-2 text-center">Best Combo</span>
              <span className="col-span-4 sm:col-span-2 text-right">Score</span>
            </div>

            {entries.map((player) => {
              const isFirst = player.rank === 1;
              const isSecond = player.rank === 2;
              const isThird = player.rank === 3;
              const isSelf = player.userId === currentUserId || player.isCurrentUser;

              return (
                <div
                  key={player.userId}
                  className={`px-4 py-3.5 grid grid-cols-12 gap-2 items-center transition-colors ${
                    isSelf
                      ? 'bg-sky-500/15 border-l-4 border-sky-400'
                      : isFirst
                      ? 'bg-amber-500/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="col-span-2 sm:col-span-1 text-center font-black">
                    {isFirst && <span className="text-2xl">🥇</span>}
                    {isSecond && <span className="text-2xl">🥈</span>}
                    {isThird && <span className="text-2xl">🥉</span>}
                    {!isFirst && !isSecond && !isThird && (
                      <span className="text-slate-400 font-mono text-sm">#{player.rank}</span>
                    )}
                  </div>

                  {/* Player Name & Bio */}
                  <div className="col-span-6 sm:col-span-7 pr-2">
                    <Link
                      href={`/player/${encodeURIComponent(player.username)}`}
                      className="font-bold text-sm sm:text-base text-white hover:text-amber-400 transition-colors flex items-center gap-1.5"
                    >
                      <span className="truncate">{player.username}</span>
                      {isSelf && (
                        <span className="text-[10px] font-extrabold uppercase bg-sky-500 text-slate-950 px-1.5 py-0.2 rounded-md">
                          YOU
                        </span>
                      )}
                    </Link>
                    <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                      {player.shortDescription}
                    </p>
                  </div>

                  {/* Best Combo */}
                  <div className="hidden sm:flex sm:col-span-2 items-center justify-center gap-1 text-xs font-mono font-bold text-amber-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span>×{player.bestCombo || 1}</span>
                  </div>

                  {/* Score */}
                  <div className="col-span-4 sm:col-span-2 text-right">
                    <div className="text-xs sm:text-sm font-black text-sky-300 font-mono">
                      {player.score.toLocaleString()} ⚡
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
