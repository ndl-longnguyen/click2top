import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of game formulas matching src/lib/config/gameConfig.ts
const GAME_CONFIG = {
  baseClickPower: 1,
  criticalClick: {
    chance: 0.04,
    multiplier: 2.5,
  },
  combo: {
    timeoutMs: 1600,
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
  boom: {
    basePenalty: 25,
    percentagePenalty: 0.30,
  },
  offline: {
    maxHours: 8,
  },
  shopItems: [
    { slug: 'earth_clicker', type: 'click_power', basePrice: 100, priceGrowth: 1.85 },
    { slug: 'campfire', type: 'passive', basePrice: 30, priceGrowth: 1.15, baseProduction: 1 },
    { slug: 'farm', type: 'passive', basePrice: 350, priceGrowth: 1.18, baseProduction: 4, unlockRequirement: 200 },
    { slug: 'animal_farm', type: 'passive', basePrice: 2800, priceGrowth: 1.20, baseProduction: 18, unlockRequirement: 2000 },
    { slug: 'windmill', type: 'passive', basePrice: 25000, priceGrowth: 1.22, baseProduction: 80, unlockRequirement: 20000 },
    { slug: 'factory', type: 'passive', basePrice: 200000, priceGrowth: 1.25, baseProduction: 350, unlockRequirement: 150000 },
    { slug: 'solar_plant', type: 'passive', basePrice: 1500000, priceGrowth: 1.28, baseProduction: 1500, unlockRequirement: 1000000 },
  ],
};

function calculateItemPrice(basePrice, growthRate, currentLevel) {
  return Math.round(basePrice * Math.pow(growthRate, currentLevel));
}

function calculateClickReward(earthClickerLevel, comboCount, isCrit = false) {
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

function calculateBoomPenalty(currentEnergy) {
  const percentagePart = Math.round(currentEnergy * GAME_CONFIG.boom.percentagePenalty);
  const penalty = Math.max(GAME_CONFIG.boom.basePenalty, percentagePart);
  return Math.min(penalty, currentEnergy);
}

function calculatePassiveProduction(items) {
  let production = 0;
  for (const item of GAME_CONFIG.shopItems) {
    if (item.type === 'passive') {
      const level = items[item.slug] || 0;
      production += item.baseProduction * level;
    }
  }
  return production;
}

function validateAntiCheat(claimedDelta, coins, booms, durationSec) {
  const cps = (coins + booms) / Math.max(1, durationSec);
  if (cps > 25) return false;
  // Maximum plausible reward
  const maxPerCoin = 1 * 10 * 2.5 * 2.5; // base * maxClickPower * maxCombo * maxCrit
  if (claimedDelta > coins * maxPerCoin + 500) return false;
  return true;
}

describe('Section 51 — Critical Game Logic Tests', () => {
  test('1. Coin Reward Calculation with Earth Clicker & Combo', () => {
    // Base level 0, combo 1
    const res1 = calculateClickReward(0, 1);
    assert.equal(res1.totalReward, 1);
    assert.equal(res1.clickMultiplier, 1);
    assert.equal(res1.comboMultiplier, 1.0);

    // Earth Clicker Lv 1 (x2) with combo 5 (x1.1)
    const res2 = calculateClickReward(1, 5);
    // 1 * 2 * 1.1 = 2.2 -> round -> 2
    assert.equal(res2.totalReward, 2);
    assert.equal(res2.clickMultiplier, 2);
    assert.equal(res2.comboMultiplier, 1.1);

    // Earth Clicker Lv 2 (x3) with combo 100 (x2.0)
    const res3 = calculateClickReward(2, 100);
    // 1 * 3 * 2.0 = 6
    assert.equal(res3.totalReward, 6);

    // Critical click (x2.5) on Lv 2, combo 100
    const resCrit = calculateClickReward(2, 100, true);
    // 6 * 2.5 = 15
    assert.equal(resCrit.totalReward, 15);
  });

  test('2. Boom Penalty & Non-Negative Energy Rule', () => {
    // Current energy 0: penalty must never make energy negative
    const penaltyZero = calculateBoomPenalty(0);
    assert.equal(penaltyZero, 0);

    // Current energy 15 (< 25 base penalty): penalty bounded to current energy
    const penalty15 = calculateBoomPenalty(15);
    assert.equal(penalty15, 15);

    // Current energy 1,000: 30% is 300 > base 25
    const penalty1000 = calculateBoomPenalty(1000);
    assert.equal(penalty1000, 300);
  });

  test('3. Shop Item Pricing & Leveling Formula', () => {
    const campfire = GAME_CONFIG.shopItems.find(i => i.slug === 'campfire');
    // Level 0 cost: 30
    assert.equal(calculateItemPrice(campfire.basePrice, campfire.priceGrowth, 0), 30);
    // Level 1 cost: 30 * 1.15^1 = 34.5 -> 35
    assert.equal(calculateItemPrice(campfire.basePrice, campfire.priceGrowth, 1), 35);
    // Level 2 cost: 30 * 1.15^2 = 39.675 -> 40
    assert.equal(calculateItemPrice(campfire.basePrice, campfire.priceGrowth, 2), 40);
  });

  test('4. Passive Production & Offline Cap', () => {
    const items = {
      campfire: 10,   // 10 * 1 = 10
      farm: 5,        // 5 * 4 = 20
      factory: 2,     // 2 * 350 = 700
      solar_plant: 1, // 1 * 1500 = 1500
    };
    const rate = calculatePassiveProduction(items);
    assert.equal(rate, 2230);

    // Offline 1 hour (3600s)
    const oneHourReward = 3600 * rate;
    assert.equal(oneHourReward, 8028000);

    // Offline 24 hours: capped at 8 hours (8 * 3600 = 28800s)
    const maxOfflineSec = GAME_CONFIG.offline.maxHours * 3600;
    const cappedReward = Math.min(24 * 3600, maxOfflineSec) * rate;
    assert.equal(cappedReward, 28800 * 2230);
  });

  test('5. Anti-Cheat Security Validator', () => {
    // Plausible batch: 20 coins clicked over 5 seconds (4 CPS)
    const plausible = validateAntiCheat(500, 20, 0, 5);
    assert.equal(plausible, true);

    // Impossible click speed: 300 clicks in 2 seconds (150 CPS)
    const tooFast = validateAntiCheat(500, 300, 0, 2);
    assert.equal(tooFast, false);

    // Unrealistic energy: claimed 100,000,000 from 5 coins
    const fakeScore = validateAntiCheat(100000000, 5, 0, 10);
    assert.equal(fakeScore, false);
  });
});
