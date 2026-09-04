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
import { getSupabaseClient } from '@/lib/supabase/client';

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

  // Track last active click time to distinguish active vs idle mode
  const lastClickTimeRef = useRef<number>(0);

  // Debounced localStorage write: 2s idle, forced flush every 5s
  const localSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocalSaveTimeRef = useRef<number>(0);

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

  // Debounced localStorage save: 2s idle debounce + forced flush every 5s max
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    const doSave = () => {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ ...statsRef.current, isGuest })
      );
      lastLocalSaveTimeRef.current = Date.now();
    };

    // Cancel any pending debounce timer
    if (localSaveTimerRef.current) {
      clearTimeout(localSaveTimerRef.current);
    }

    // If no save in over 5s, flush immediately (throttle guarantee)
    if (Date.now() - lastLocalSaveTimeRef.current >= 5000) {
      doSave();
      return;
    }

    // Otherwise debounce: save 2s after last change
    localSaveTimerRef.current = setTimeout(doSave, 2000);
  }, [stats, isGuest, isInitialized]);

  // 2. Passive Production Loop (every second)
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      const passivePerSec = calculatePassiveProduction(statsRef.current.items);
      if (passivePerSec > 0) {
        setStats((prev) => {
          const nextEnergy = prev.currentEnergy + passivePerSec;
          return {
            ...prev,
            currentEnergy: nextEnergy,
            totalEarnedEnergy: prev.totalEarnedEnergy + passivePerSec,
            leaderboardScore: nextEnergy,
            lastActiveAt: Date.now(),
          };
        });
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

  // 4. Adaptive Background Sync
  // - Active mode (clicked within last 15s): sync every 8s
  // - Idle mode (only passive production): sync every 30s
  useEffect(() => {
    if (!isInitialized) return;

    const ACTIVE_INTERVAL_MS = GAME_CONFIG.sync.intervalMs;  // 8s
    const IDLE_INTERVAL_MS = 30_000;                          // 30s
    const ACTIVE_WINDOW_MS = 15_000;                          // 15s after last click = still "active"

    let nextSyncAt = Date.now() + ACTIVE_INTERVAL_MS;

    const doSync = async (force = false) => {
      const currentBatch = { ...clickBatchRef.current };
      clickBatchRef.current = {
        coins: 0,
        booms: 0,
        comboMax: 0,
        lastSyncTime: Date.now(),
      };

      const hasClicks = currentBatch.coins > 0 || currentBatch.booms > 0;
      const isIdle = Date.now() - lastClickTimeRef.current > ACTIVE_WINDOW_MS;

      // In idle mode with no clicks, still sync to update passive score on server
      if (!hasClicks && isIdle && !force) return;

      try {
        await fetch('/api/game/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: statsRef.current.userId,
            username: statsRef.current.username,
            country: statsRef.current.country,
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
    };

    const tick = async () => {
      const now = Date.now();
      if (now < nextSyncAt) return;

      await doSync();

      // Schedule next sync based on current activity mode
      const isIdle = now - lastClickTimeRef.current > ACTIVE_WINDOW_MS;
      nextSyncAt = now + (isIdle ? IDLE_INTERVAL_MS : ACTIVE_INTERVAL_MS);
    };

    // Check every 2s whether it is time to sync
    const checkInterval = setInterval(tick, 2000);

    return () => clearInterval(checkInterval);
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
        const nextEnergy = prev.currentEnergy + totalReward;
        return {
          ...prev,
          currentEnergy: nextEnergy,
          totalEarnedEnergy: prev.totalEarnedEnergy + totalReward,
          leaderboardScore: nextEnergy,
          currentCombo: nextCombo,
          bestCombo: Math.max(prev.bestCombo, nextCombo),
          lastActiveAt: Date.now(),
        };
      });

      clickBatchRef.current.coins += 1;
      clickBatchRef.current.comboMax = Math.max(clickBatchRef.current.comboMax, newCombo);
      lastClickTimeRef.current = Date.now();

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

      setStats((prev) => {
        const nextEnergy = Math.max(0, prev.currentEnergy - penalty);
        return {
          ...prev,
          currentEnergy: nextEnergy,
          leaderboardScore: nextEnergy,
          currentCombo: 0,
          lastActiveAt: Date.now(),
        };
      });

      clickBatchRef.current.booms += 1;
      lastClickTimeRef.current = Date.now();

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

    setStats((prev) => {
      const nextEnergy = prev.currentEnergy - price;
      return {
        ...prev,
        currentEnergy: nextEnergy,
        leaderboardScore: nextEnergy,
        items: {
          ...prev.items,
          [item.slug]: (prev.items[item.slug] || 0) + 1,
        },
        lastActiveAt: Date.now(),
      };
    });

    soundEffects.playUpgrade();
    return { success: true };
  }, []);

  // 7. Collect Offline Earnings
  const collectOfflineEarnings = useCallback(() => {
    if (offlineEarned <= 0) {
      setOfflineModalOpen(false);
      return;
    }
    setStats((prev) => {
      const nextEnergy = prev.currentEnergy + offlineEarned;
      return {
        ...prev,
        currentEnergy: nextEnergy,
        totalEarnedEnergy: prev.totalEarnedEnergy + offlineEarned,
        leaderboardScore: nextEnergy,
        lastActiveAt: Date.now(),
      };
    });
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

  // 9. Merge Guest Account into Supabase Account (Claiming Guest Progress)
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

  // 10. Load & Restore Account Data from Database (Sign In / Restore Account)
  const loadAccountData = useCallback(async (targetUserId: string, fallbackUsername?: string) => {
    try {
      const res = await fetch(`/api/auth/load-user?userId=${encodeURIComponent(targetUserId)}`);
      const result = await res.json();

      if (res.ok && result.data) {
        const dbData = result.data;
        const loadedStats: PlayerStats = {
          userId: dbData.userId,
          username: dbData.username || fallbackUsername || 'Player',
          shortDescription: dbData.shortDescription || 'Clicker Champion',
          country: dbData.country || 'VN',
          currentEnergy: dbData.currentEnergy || 0,
          totalEarnedEnergy: dbData.totalEarnedEnergy || 0,
          leaderboardScore: dbData.currentEnergy || 0,
          bestCombo: dbData.bestCombo || 0,
          currentCombo: dbData.currentCombo || 0,
          lastActiveAt: dbData.lastActiveAt || Date.now(),
          items: dbData.items || {},
        };

        setStats(loadedStats);
        setIsGuest(false);
        return true;
      }
    } catch (err) {
      console.error('Failed to load user account data:', err);
    }
    // Fallback if data not found on DB yet
    setIsGuest(false);
    setStats((prev) => ({
      ...prev,
      userId: targetUserId,
      username: fallbackUsername || prev.username,
    }));
    return false;
  }, []);

  // 11. Log out current account and return to Guest mode
  const logoutCurrentAccount = useCallback(() => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.auth.signOut();
      }
    } catch {
      // Ignore offline / unconfigured errors
    }

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
    loadAccountData,
    logoutCurrentAccount,
    setRankUpData,
    resetGameData,
  };
}
