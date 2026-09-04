import { ShopItem } from '../types/game';

export const GAME_CONFIG = {
  baseClickPower: 1,

  criticalClick: {
    chance: 0.04, // 4% chance for critical
    multiplier: 2.5, // 2.5x reward
  },

  combo: {
    timeoutMs: 1600, // 1.6s timeout: demands continuous focus and agility
    thresholds: [
      { clicks: 200, multiplier: 2.5 },
      { clicks: 100, multiplier: 2.0 },
      { clicks: 60, multiplier: 1.75 },
      { clicks: 30, multiplier: 1.5 },
      { clicks: 15, multiplier: 1.25 },
      { clicks: 5, multiplier: 1.1 },
      { clicks: 1, multiplier: 1.0 },
    ],
    maxMultiplier: 2.5,
  },

  arena: {
    maxObjects: 8,
    minObjects: 5,
    spawnIntervalMs: 320,
    boomChance: 0.35, // ~35% boom chance for intense tactical dodging
    maxActiveBooms: 4, // Up to 4 bombs concurrently on screen
    minActiveCoins: 2, // Guarantee at least 2 active coins on screen
    boomLifespanMs: 4500, // Bombs linger for 4.5s
    safeZone: {
      minX: 8,
      maxX: 92,
      minY: 12,
      maxY: 88,
      minDistancePercentage: 13, // prevent overlapping
    },
  },

  boom: {
    basePenalty: 25,
    percentagePenalty: 0.30, // 30% penalty: severely punishes reckless tapping!
    resetsCombo: true,
  },

  offline: {
    maxHours: 8,
    minSecondsToTrigger: 60, // at least 1 minute away to show offline modal
  },

  sync: {
    intervalMs: 8000, // periodic sync to server every 8s
    maxCps: 25, // anti-cheat threshold
  },

  shopItems: [
    {
      id: 'item_earth_clicker',
      slug: 'earth_clicker',
      name: 'EARTH CLICKER',
      description: 'Harness planetary resonance. Every level adds +100% base click power!',
      icon: '🌍',
      type: 'click_power' as const,
      basePrice: 100,
      priceGrowth: 1.85,
      baseProduction: 0,
      clickMultiplier: 2, // Lv 1 = x2, Lv 2 = x3, etc.
      unlockRequirement: 0,
      level: 0,
      sortOrder: 1,
    },
    {
      id: 'item_campfire',
      slug: 'campfire',
      name: 'CAMPFIRE',
      description: 'Produces cozy passive energy continuously.',
      icon: '🔥',
      type: 'passive' as const,
      basePrice: 30,
      priceGrowth: 1.15,
      baseProduction: 1, // 1 ⚡ / sec
      clickMultiplier: 1,
      unlockRequirement: 0,
      level: 0,
      sortOrder: 2,
    },
    {
      id: 'item_farm',
      slug: 'farm',
      name: 'FARM',
      description: 'Cultivates energy crops to feed your progression.',
      icon: '🌾',
      type: 'passive' as const,
      basePrice: 350,
      priceGrowth: 1.18,
      baseProduction: 4, // 4 ⚡ / sec
      clickMultiplier: 1,
      unlockRequirement: 200, // unlocks at 200 total energy earned
      level: 0,
      sortOrder: 3,
    },
    {
      id: 'item_animal_farm',
      slug: 'animal_farm',
      name: 'ANIMAL FARM',
      description: 'Generates robust energy reserves automatically.',
      icon: '🐄',
      type: 'passive' as const,
      basePrice: 2800,
      priceGrowth: 1.20,
      baseProduction: 18, // 18 ⚡ / sec
      clickMultiplier: 1,
      unlockRequirement: 2000, // unlocks at 2,000 total energy earned
      level: 0,
      sortOrder: 4,
    },
    {
      id: 'item_windmill',
      slug: 'windmill',
      name: 'WINDMILL',
      description: 'Harnesses gale-force winds into massive energy streams.',
      icon: '💨',
      type: 'passive' as const,
      basePrice: 25000,
      priceGrowth: 1.22,
      baseProduction: 80, // 80 ⚡ / sec
      clickMultiplier: 1,
      unlockRequirement: 20000, // unlocks at 20,000 total energy earned
      level: 0,
      sortOrder: 5,
    },
    {
      id: 'item_factory',
      slug: 'factory',
      name: 'FACTORY',
      description: 'Industrial megastructure outputting supreme automated power.',
      icon: '🏭',
      type: 'passive' as const,
      basePrice: 200000,
      priceGrowth: 1.25,
      baseProduction: 350, // 350 ⚡ / sec
      clickMultiplier: 1,
      unlockRequirement: 150000, // unlocks at 150,000 total energy earned
      level: 0,
      sortOrder: 6,
    },
    {
      id: 'item_solar_plant',
      slug: 'solar_plant',
      name: 'SOLAR PLANT',
      description: 'Advanced photovoltaic solar array delivering monumental clean energy.',
      icon: '☀️',
      type: 'passive' as const,
      basePrice: 1500000,
      priceGrowth: 1.28,
      baseProduction: 1500, // 1,500 ⚡ / sec
      clickMultiplier: 1,
      unlockRequirement: 1000000, // unlocks at 1,000,000 total energy earned
      level: 0,
      sortOrder: 7,
    },
  ] as ShopItem[],
};

/**
 * Calculates current price for an item at a given level
 */
export function calculateItemPrice(basePrice: number, growthRate: number, currentLevel: number): number {
  return Math.round(basePrice * Math.pow(growthRate, currentLevel));
}

/**
 * Calculates total click power based on Earth Clicker level and active combo
 */
export function calculateClickReward(
  earthClickerLevel: number,
  comboCount: number,
  isCrit: boolean = false
): { totalReward: number; comboMultiplier: number; clickMultiplier: number } {
  // Earth clicker: Lv 0 = 1x, Lv 1 = 2x, Lv 2 = 3x, Lv N = (N + 1)x
  const clickMultiplier = earthClickerLevel > 0 ? earthClickerLevel + 1 : 1;

  let comboMultiplier = 1.0;
  for (const t of GAME_CONFIG.combo.thresholds) {
    if (comboCount >= t.clicks) {
      comboMultiplier = t.multiplier;
      break;
    }
  }

  const critMultiplier = isCrit ? GAME_CONFIG.criticalClick.multiplier : 1;

  const totalReward = Math.round(
    GAME_CONFIG.baseClickPower * clickMultiplier * comboMultiplier * critMultiplier
  );

  return { totalReward, comboMultiplier, clickMultiplier };
}

/**
 * Calculates Boom penalty
 */
export function calculateBoomPenalty(currentEnergy: number): number {
  const percentagePart = Math.round(currentEnergy * GAME_CONFIG.boom.percentagePenalty);
  const penalty = Math.max(GAME_CONFIG.boom.basePenalty, percentagePart);
  return Math.min(penalty, currentEnergy); // never allows energy to become negative
}

/**
 * Calculates passive energy production per second
 */
export function calculatePassiveProduction(items: Record<string, number>): number {
  let production = 0;
  for (const item of GAME_CONFIG.shopItems) {
    if (item.type === 'passive') {
      const level = items[item.slug] || 0;
      production += item.baseProduction * level;
    }
  }
  return production;
}
