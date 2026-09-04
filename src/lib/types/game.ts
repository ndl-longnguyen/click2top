export type ArenaObjectType = 'coin' | 'boom';

export interface ArenaObject {
  id: string;
  type: ArenaObjectType;
  x: number; // percentage 5-95%
  y: number; // percentage 10-90%
  spawnTime: number;
  scale: number;
  isCrit?: boolean;
}

export interface FloatingTextItem {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  isCrit?: boolean;
  createdAt: number;
}

export interface ShopItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  type: 'click_power' | 'passive';
  basePrice: number;
  priceGrowth: number;
  baseProduction: number; // for passive: energy/sec
  clickMultiplier: number; // for click_power: multiplier per level
  unlockRequirement: number; // required total_earned_energy to unlock
  level: number;
  sortOrder: number;
}

export interface PlayerStats {
  userId: string;
  username: string;
  shortDescription: string;
  country?: string;
  avatarUrl?: string;
  currentEnergy: number;
  totalEarnedEnergy: number;
  leaderboardScore: number;
  bestCombo: number;
  currentCombo: number;
  lastActiveAt: number;
  items: Record<string, number>; // itemSlug -> level
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  shortDescription: string;
  country?: string;
  avatarUrl?: string;
  score: number;
  isCurrentUser?: boolean;
  bestCombo?: number;
}

export interface PeriodWinner {
  id: string;
  periodType: 'weekly' | 'daily' | 'season';
  periodStart: string;
  periodEnd: string;
  userId: string;
  username: string;
  country?: string;
  snapshotDescription: string;
  finalScore: number;
  createdAt: string;
}

export interface PlayerRankHistory {
  id: string;
  userId: string;
  periodType: 'weekly' | 'daily' | 'global';
  periodStart: string;
  periodEnd: string;
  rank: number;
  score: number;
  createdAt: string;
  rankDelta?: number; // positive = climbed up, negative = fell down, 0 = unchanged
}

export interface CountryStanding {
  rank: number;
  country: string;
  totalScore: number;
  playerCount: number;
  topPlayer: {
    username: string;
    score: number;
  };
}

export interface NationalRivalryInfo {
  userCountry: string;
  userCountryRank: number;
  userCountryScore: number;
  aheadCountry?: {
    country: string;
    rank: number;
    scoreDiff: number;
  };
  behindCountry?: {
    country: string;
    rank: number;
    leadDiff: number;
  };
}

export interface CompetitorStatus {
  userRank: number;
  userScore: number;
  userCountry?: string;
  nextPlayerRank?: number;
  nextPlayerUsername?: string;
  nextPlayerCountry?: string;
  nextPlayerScore?: number;
  energyNeeded?: number;
  isTopOne: boolean;
}

export interface SyncPayload {
  guestId?: string;
  sessionToken?: string;
  clickBatch: {
    coins: number;
    booms: number;
    comboMax: number;
    durationMs: number;
  };
  clientTimestamp: number;
}

export interface SyncResult {
  success: boolean;
  currentEnergy: number;
  totalEarnedEnergy: number;
  leaderboardScore: number;
  rank?: number;
  error?: string;
}
