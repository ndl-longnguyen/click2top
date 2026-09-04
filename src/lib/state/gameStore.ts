'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArenaObject, FloatingTextItem, PlayerStats, ShopItem } from '../types/game';
import {
  GAME_CONFIG,
  calculateItemPrice,
  calculateClickReward,
  calculateBoomPenalty,
  calculatePassiveProduction,
} from '../config/gameConfig';
import { soundEffects } from '../sound/soundEffects';

const LOCAL_STORAGE_KEY = 'coin_clicker_save_v1';

const DEFAULT_STATS: PlayerStats = {
  userId: 'guest_player',
  username: 'Guest Player',
  shortDescription: 'Clicking my way to the top!',
  country: 'VN',
  currentEnergy: 0,
  totalEarnedEnergy: 0,
  leaderboardScore: 0,
  bestCombo: 0,
  currentCombo: 0,
  lastActiveAt: 0,
  items: {},
};

function generateRandomPosition(existing: ArenaObject[]): { x: number; y: number } {
  const { minX, maxX, minY, maxY, minDistancePercentage } = GAME_CONFIG.arena.safeZone;
  let attempts = 0;
  while (attempts < 20) {
    const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

    const tooClose = existing.some((obj) => {
      const dx = obj.x - x;
      const dy = obj.y - y;
      return Math.sqrt(dx * dx + dy * dy) < minDistancePercentage;
    });

    if (!tooClose) {
      return { x, y };
    }
    attempts++;
  }
  return {
    x: Math.floor(Math.random() * (maxX - minX + 1)) + minX,
    y: Math.floor(Math.random() * (maxY - minY + 1)) + minY,
  };
}

export function useGameStore() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);

  const [arenaObjects, setArenaObjects] = useState<ArenaObject[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [offlineEarned, setOfflineEarned] = useState(0);
  const [offlineElapsedSec, setOfflineElapsedSec] = useState(0);
  const [rankUpData, setRankUpData] = useState<{ newRank: number; previousRank: number } | null>(null);

  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statsRef = useRef(stats);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const clickBatchRef = useRef({
    coins: 0,
    booms: 0,
    comboMax: 0,
    lastSyncTime: 0,
  });

  // 1. Initial Load & Offline Earnings Calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
        let initialStats: PlayerStats;

        if (saved) {
          const parsed = JSON.parse(saved);
          initialStats = {
            ...DEFAULT_STATS,
            ...parsed,
            items: parsed.items || {},
          };
          setIsGuest(parsed.isGuest !== false);
        } else {
          const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
          initialStats = {
            ...DEFAULT_STATS,
            userId: guestId,
            username: 'Guest_' + guestId.slice(-4),
            lastActiveAt: Date.now(),
          };
          setIsGuest(true);
        }

        // Calculate offline earnings
        const now = Date.now();
        const lastActive = initialStats.lastActiveAt || now;
        const elapsedSec = Math.floor((now - lastActive) / 1000);
        const passivePerSec = calculatePassiveProduction(initialStats.items);

        if (elapsedSec >= GAME_CONFIG.offline.minSecondsToTrigger && passivePerSec > 0) {
          const maxOfflineSec = GAME_CONFIG.offline.maxHours * 3600;
          const cappedSec = Math.min(elapsedSec, maxOfflineSec);
          const earned = cappedSec * passivePerSec;

          if (earned > 0) {
            setOfflineEarned(earned);
            setOfflineElapsedSec(cappedSec);
            setOfflineModalOpen(true);
          }
        }

        initialStats.lastActiveAt = now;
        setStats(initialStats);
        setIsInitialized(true);

        // Seed initial arena objects with guaranteed coins
        const initialObjs: ArenaObject[] = [];
        for (let i = 0; i < GAME_CONFIG.arena.minObjects + 2; i++) {
          const currentBooms = initialObjs.filter((o) => o.type === 'boom').length;
          const isBoom = currentBooms < GAME_CONFIG.arena.maxActiveBooms && Math.random() < GAME_CONFIG.arena.boomChance;
          const pos = generateRandomPosition(initialObjs);
          initialObjs.push({
            id: 'obj_' + Math.random().toString(36).substring(2, 9),
            type: isBoom ? 'boom' : 'coin',
            x: pos.x,
            y: pos.y,
            spawnTime: Date.now(),
            scale: 1,
          });
        }
        setArenaObjects(initialObjs);
      } catch (e) {
        console.error('Error initializing game state', e);
        setIsInitialized(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save to localStorage whenever stats change
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        ...stats,
        isGuest,
      })
    );
  }, [stats, isGuest, isInitialized]);

  // 2. Passive Production Loop (every second)
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      const passivePerSec = calculatePassiveProduction(statsRef.current.items);
      if (passivePerSec > 0) {
        setStats((prev) => ({
          ...prev,
          currentEnergy: prev.currentEnergy + passivePerSec,
          totalEarnedEnergy: prev.totalEarnedEnergy + passivePerSec,
          leaderboardScore: prev.leaderboardScore + passivePerSec,
          lastActiveAt: Date.now(),
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isInitialized]);

  // Reset combo timer
  const resetComboTimer = useCallback(() => {
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }
    comboTimerRef.current = setTimeout(() => {
      setStats((prev) => {
        if (prev.currentCombo > 0) {
          return { ...prev, currentCombo: 0 };
        }
        return prev;
      });
    }, GAME_CONFIG.combo.timeoutMs);
  }, []);

  // Spawn replacement object with strict cap on max active booms
  const spawnReplacement = useCallback(() => {
    setTimeout(() => {
      setArenaObjects((prev) => {
        if (prev.length >= GAME_CONFIG.arena.maxObjects) return prev;
        const currentBooms = prev.filter((o) => o.type === 'boom').length;
        const currentCoins = prev.filter((o) => o.type === 'coin').length;

        // Never allow more than maxActiveBooms (2), and ensure minimum coins available
        const canSpawnBoom =
          currentBooms < GAME_CONFIG.arena.maxActiveBooms &&
          currentCoins >= GAME_CONFIG.arena.minActiveCoins;
        const isBoom = canSpawnBoom && Math.random() < GAME_CONFIG.arena.boomChance;

        const pos = generateRandomPosition(prev);
        const newObj: ArenaObject = {
          id: 'obj_' + Math.random().toString(36).substring(2, 9),
          type: isBoom ? 'boom' : 'coin',
          x: pos.x,
          y: pos.y,
          spawnTime: Date.now(),
          scale: 1,
        };
        return [...prev, newObj];
      });
    }, GAME_CONFIG.arena.spawnIntervalMs);
  }, []);

  // 3. Boom Auto-Defuse & Minimum Coin Guarantee Loop
  useEffect(() => {
    if (!isInitialized) return;

    const defuseInterval = setInterval(() => {
      const now = Date.now();
      setArenaObjects((prev) => {
        const expiredBooms: ArenaObject[] = [];
        const active: ArenaObject[] = [];

        for (const obj of prev) {
          if (obj.type === 'boom' && now - obj.spawnTime >= GAME_CONFIG.arena.boomLifespanMs) {
            expiredBooms.push(obj);
          } else {
            active.push(obj);
          }
        }

        if (expiredBooms.length > 0) {
          expiredBooms.forEach((b) => {
            const textId = 'float_' + Math.random().toString(36).substring(2, 9);
            setFloatingTexts((f) => [
              ...f,
              {
                id: textId,
                x: b.x,
                y: b.y,
                text: '💨 DODGED!',
                color: '#10b981',
                createdAt: Date.now(),
              },
            ]);
            setTimeout(() => {
              setFloatingTexts((f) => f.filter((t) => t.id !== textId));
            }, 900);
            spawnReplacement();
          });
          return active;
        }

        // Guarantee at least minActiveCoins on the arena
        const coinsCount = active.filter((o) => o.type === 'coin').length;
        if (coinsCount < GAME_CONFIG.arena.minActiveCoins && active.length < GAME_CONFIG.arena.maxObjects) {
          spawnReplacement();
        }

        return prev;
      });
    }, 450);

    return () => clearInterval(defuseInterval);
  }, [isInitialized, spawnReplacement]);

  // 4. Periodic Background Sync
  useEffect(() => {
    if (!isInitialized) return;

    const syncInterval = setInterval(async () => {
      const currentBatch = { ...clickBatchRef.current };
      clickBatchRef.current = {
        coins: 0,
        booms: 0,
        comboMax: 0,
        lastSyncTime: Date.now(),
      };

      if (currentBatch.coins === 0 && currentBatch.booms === 0) return;

      try {
        await fetch('/api/game/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: statsRef.current.userId,
            isGuest,
            clickBatch: currentBatch,
            currentEnergy: statsRef.current.currentEnergy,
            totalEarnedEnergy: statsRef.current.totalEarnedEnergy,
            leaderboardScore: statsRef.current.leaderboardScore,
            clientTimestamp: Date.now(),
          }),
        });
      } catch {
        // Silent network failure tolerance
      }
    }, GAME_CONFIG.sync.intervalMs);

    return () => clearInterval(syncInterval);
  }, [isInitialized, isGuest]);

  // 4. Handle Coin Click
  const handleCoinClick = useCallback(
    (objectId: string, x: number, y: number) => {
      const isCrit = Math.random() < GAME_CONFIG.criticalClick.chance;
      const earthLevel = statsRef.current.items['earth_clicker'] || 0;
      const newCombo = statsRef.current.currentCombo + 1;

      const { totalReward } = calculateClickReward(earthLevel, newCombo, isCrit);

      if (isCrit) {
        soundEffects.playCritical();
      } else {
        soundEffects.playCoin();
      }

      const textId = 'float_' + Math.random().toString(36).substring(2, 9);
      setFloatingTexts((prev) => [
        ...prev,
        {
          id: textId,
          x,
          y,
          text: isCrit ? `CRITICAL! +${totalReward.toLocaleString()} ⚡` : `+${totalReward.toLocaleString()} ⚡`,
          color: isCrit ? '#f59e0b' : '#38bdf8',
          isCrit,
          createdAt: Date.now(),
        },
      ]);

      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((t) => t.id !== textId));
      }, 950);

      setArenaObjects((prev) => prev.filter((o) => o.id !== objectId));

      setStats((prev) => {
        const nextCombo = prev.currentCombo + 1;
        return {
          ...prev,
          currentEnergy: prev.currentEnergy + totalReward,
          totalEarnedEnergy: prev.totalEarnedEnergy + totalReward,
          leaderboardScore: prev.leaderboardScore + totalReward,
          currentCombo: nextCombo,
          bestCombo: Math.max(prev.bestCombo, nextCombo),
          lastActiveAt: Date.now(),
        };
      });

      clickBatchRef.current.coins += 1;
      clickBatchRef.current.comboMax = Math.max(clickBatchRef.current.comboMax, newCombo);

      resetComboTimer();
      spawnReplacement();
    },
    [resetComboTimer, spawnReplacement]
  );

  // 5. Handle Boom Click
  const handleBoomClick = useCallback(
    (objectId: string, x: number, y: number) => {
      const earthLevel = statsRef.current.items['earth_clicker'] || 0;
      const clickMultiplier = earthLevel > 0 ? earthLevel + 1 : 1;
      const penalty = calculateBoomPenalty(statsRef.current.currentEnergy, clickMultiplier);

      soundEffects.playBoom();

      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }

      const textId = 'float_' + Math.random().toString(36).substring(2, 9);
      setFloatingTexts((prev) => [
        ...prev,
        {
          id: textId,
          x,
          y,
          text: `💥 -${penalty.toLocaleString()} ⚡ COMBO LOST`,
          color: '#ef4444',
          createdAt: Date.now(),
        },
      ]);

      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((t) => t.id !== textId));
      }, 1100);

      setArenaObjects((prev) => prev.filter((o) => o.id !== objectId));

      setStats((prev) => ({
        ...prev,
        currentEnergy: Math.max(0, prev.currentEnergy - penalty),
        currentCombo: 0,
        lastActiveAt: Date.now(),
      }));

      clickBatchRef.current.booms += 1;

      spawnReplacement();
    },
    [spawnReplacement]
  );

  // 6. Buy / Upgrade Shop Item
  const buyShopItem = useCallback((item: ShopItem): { success: boolean; message?: string } => {
    const currentLevel = statsRef.current.items[item.slug] || 0;
    const price = calculateItemPrice(item.basePrice, item.priceGrowth, currentLevel);

    if (statsRef.current.totalEarnedEnergy < item.unlockRequirement) {
      return { success: false, message: `Requires ${item.unlockRequirement.toLocaleString()} ⚡ total energy to unlock!` };
    }

    if (statsRef.current.currentEnergy < price) {
      return { success: false, message: `Not enough Energy! Need ${price.toLocaleString()} ⚡` };
    }

    setStats((prev) => ({
      ...prev,
      currentEnergy: prev.currentEnergy - price,
      items: {
        ...prev.items,
        [item.slug]: (prev.items[item.slug] || 0) + 1,
      },
      lastActiveAt: Date.now(),
    }));

    soundEffects.playUpgrade();
    return { success: true };
  }, []);

  // 7. Collect Offline Earnings
  const collectOfflineEarnings = useCallback(() => {
    if (offlineEarned <= 0) {
      setOfflineModalOpen(false);
      return;
    }
    setStats((prev) => ({
      ...prev,
      currentEnergy: prev.currentEnergy + offlineEarned,
      totalEarnedEnergy: prev.totalEarnedEnergy + offlineEarned,
      leaderboardScore: prev.leaderboardScore + offlineEarned,
      lastActiveAt: Date.now(),
    }));
    soundEffects.playUpgrade();
    setOfflineEarned(0);
    setOfflineModalOpen(false);
  }, [offlineEarned]);

  // 8. Update Profile (Username, Description, Country)
  const updateProfile = useCallback((username: string, shortDescription: string, country?: string) => {
    const cleanUsername = username.trim().slice(0, 20);
    const cleanDesc = shortDescription.trim().slice(0, 100);

    setStats((prev) => ({
      ...prev,
      username: cleanUsername || prev.username,
      shortDescription: cleanDesc || prev.shortDescription,
      country: country || prev.country || 'VN',
    }));
  }, []);

  // 9. Merge Guest Account into Supabase Account
  const mergeIntoAccount = useCallback(
    async (newUserId: string, newUsername: string) => {
      try {
        const response = await fetch('/api/auth/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestStats: statsRef.current,
            targetUserId: newUserId,
            targetUsername: newUsername,
          }),
        });

        if (response.ok) {
          setIsGuest(false);
          setStats((prev) => ({
            ...prev,
            userId: newUserId,
            username: newUsername,
          }));
        }
      } catch (err) {
        console.error('Failed to merge guest account', err);
      }
    },
    []
  );

  // 10. Reset Game Data (for testing or restarting from scratch)
  const resetGameData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
    const freshStats: PlayerStats = {
      ...DEFAULT_STATS,
      userId: guestId,
      username: 'Guest_' + guestId.slice(-4),
      lastActiveAt: Date.now(),
      items: {},
    };
    setStats(freshStats);
    setIsGuest(true);
  }, []);

  return {
    isInitialized,
    isGuest,
    stats,
    arenaObjects,
    floatingTexts,
    offlineModalOpen,
    offlineEarned,
    offlineElapsedSec,
    rankUpData,
    setOfflineModalOpen,
    handleCoinClick,
    handleBoomClick,
    buyShopItem,
    collectOfflineEarnings,
    updateProfile,
    mergeIntoAccount,
    setRankUpData,
    resetGameData,
  };
}
