import { ShopItem } from '../types/game';

export const GAME_CONFIG = {
  baseClickPower: 10,

  criticalClick: {
    chance: 0.06, // 6% chance for critical
    multiplier: 4, // 4x reward
  },

  combo: {
    timeoutMs: 2500,
    thresholds: [
      { clicks: 100, multiplier: 5.0 },
      { clicks: 50, multiplier: 3.0 },
      { clicks: 20, multiplier: 2.0 },
      { clicks: 10, multiplier: 1.5 },
      { clicks: 5, multiplier: 1.2 },
      { clicks: 1, multiplier: 1.0 },
    ],
    maxMultiplier: 5.0,
  },

  arena: {
    maxObjects: 8,
    minObjects: 5,
    spawnIntervalMs: 350,
    boomChance: 0.35, // ~35% boom chance for intense action and obstacle dodging
    maxActiveBooms: 4, // Up to 4 bombs concurrently on screen
    minActiveCoins: 2, // Guarantee at least 2 active coins on screen
    boomLifespanMs: 5000, // Bombs safely defuse after 5s
    safeZone: {
      minX: 8,
      maxX: 92,
      minY: 12,
      maxY: 88,
      minDistancePercentage: 13, // prevent overlapping
    },
  },

  boom: {
    basePenalty: 100,
    percentagePenalty: 0.15, // 15% of current energy
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
      description: 'Makes your clicks significantly more powerful. Harness the earth’s energy!',
      icon: '🌍',
      type: 'click_power' as const,
      basePrice: 2000,
      priceGrowth: 1.65,
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
      basePrice: 152,
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
      basePrice: 800,
      priceGrowth: 1.15,
      baseProduction: 10, // 10 ⚡ / sec
      clickMultiplier: 1,
      unlockRequirement: 0,
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
      basePrice: 10000,
      priceGrowth: 1.15,
      baseProduction: 120, // 120 ⚡ / sec
      clickMultiplier: 1,
      unlockRequirement: 10000, // unlocks at 10,000 total energy earned
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
      basePrice: 75000,
      priceGrowth: 1.15,
      baseProduction: 1000, // 1,000 ⚡ / sec
      clickMultiplier: 1,
      unlockRequirement: 75000, // unlocks at 75,000 total energy earned
      level: 0,
      sortOrder: 5,
    },
    {
      id: 'item_factory',
      slug: 'factory',
      name: 'FACTORY',
      description: 'Industrial megastructure outputting supreme power.',
      icon: '🏭',
      type: 'passive' as const,
      basePrice: 250000,
      priceGrowth: 1.15,
      baseProduction: 5000, // 5,000 ⚡ / sec
      clickMultiplier: 1,
      unlockRequirement: 250000, // unlocks at 250,000 total energy earned
      level: 0,
      sortOrder: 6,
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
