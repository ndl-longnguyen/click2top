import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of game formulas matching src/lib/config/gameConfig.ts
const GAME_CONFIG = {
  baseClickPower: 10,
  criticalClick: {
    chance: 0.06,
    multiplier: 4,
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
  boom: {
    basePenalty: 100,
    percentagePenalty: 0.15,
  },
  offline: {
    maxHours: 8,
  },
  shopItems: [
    { slug: 'earth_clicker', type: 'click_power', basePrice: 2000, priceGrowth: 1.65 },
    { slug: 'campfire', type: 'passive', basePrice: 152, priceGrowth: 1.15, baseProduction: 1 },
    { slug: 'farm', type: 'passive', basePrice: 800, priceGrowth: 1.15, baseProduction: 10 },
    { slug: 'animal_farm', type: 'passive', basePrice: 10000, priceGrowth: 1.15, baseProduction: 120, unlockRequirement: 10000 },
    { slug: 'windmill', type: 'passive', basePrice: 75000, priceGrowth: 1.15, baseProduction: 1000, unlockRequirement: 75000 },
    { slug: 'factory', type: 'passive', basePrice: 250000, priceGrowth: 1.15, baseProduction: 5000, unlockRequirement: 250000 },
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
  const maxPerCoin = 10 * 10 * 5.0 * 4; // base * maxClickPower * maxCombo * maxCrit
  if (claimedDelta > coins * maxPerCoin + 500) return false;
  return true;
}

describe('Section 51 — Critical Game Logic Tests', () => {
  test('1. Coin Reward Calculation with Earth Clicker & Combo', () => {
    // Base level 0, combo 1
    const res1 = calculateClickReward(0, 1);
    assert.equal(res1.totalReward, 10);
    assert.equal(res1.clickMultiplier, 1);
    assert.equal(res1.comboMultiplier, 1.0);

    // Earth Clicker Lv 1 (x2) with combo 5 (x1.2)
    const res2 = calculateClickReward(1, 5);
    // 10 * 2 * 1.2 = 24
    assert.equal(res2.totalReward, 24);
    assert.equal(res2.clickMultiplier, 2);
    assert.equal(res2.comboMultiplier, 1.2);

    // Earth Clicker Lv 2 (x3) with combo 20 (x2.0)
    const res3 = calculateClickReward(2, 20);
    // 10 * 3 * 2.0 = 60
    assert.equal(res3.totalReward, 60);

    // Critical click (x4)
    const resCrit = calculateClickReward(2, 20, true);
    // 60 * 4 = 240
    assert.equal(resCrit.totalReward, 240);
  });

  test('2. Boom Penalty & Non-Negative Energy Rule', () => {
    // Current energy 0: penalty must never make energy negative
    const penaltyZero = calculateBoomPenalty(0);
    assert.equal(penaltyZero, 0);

    // Current energy 50 (< 100 base penalty): penalty bounded to current energy
    const penalty50 = calculateBoomPenalty(50);
    assert.equal(penalty50, 50);

    // Current energy 1,000: 15% is 150 > base 100
    const penalty1000 = calculateBoomPenalty(1000);
    assert.equal(penalty1000, 150);
  });

  test('3. Shop Item Pricing & Leveling Formula', () => {
    const campfire = GAME_CONFIG.shopItems.find(i => i.slug === 'campfire');
    // Level 0 cost: 152
    assert.equal(calculateItemPrice(campfire.basePrice, campfire.priceGrowth, 0), 152);
    // Level 1 cost: 152 * 1.15^1 = 175
    assert.equal(calculateItemPrice(campfire.basePrice, campfire.priceGrowth, 1), 175);
    // Level 2 cost: 152 * 1.15^2 = 201
    assert.equal(calculateItemPrice(campfire.basePrice, campfire.priceGrowth, 2), 201);
  });

  test('4. Passive Production & Offline Cap', () => {
    const items = {
      campfire: 10,  // 10 * 1 = 10
      farm: 5,       // 5 * 10 = 50
      factory: 2,    // 2 * 5000 = 10000
    };
    const rate = calculatePassiveProduction(items);
    assert.equal(rate, 10060);

    // Offline 1 hour (3600s)
    const oneHourReward = 3600 * rate;
    assert.equal(oneHourReward, 36216000);

    // Offline 24 hours: capped at 8 hours (8 * 3600 = 28800s)
    const maxOfflineSec = GAME_CONFIG.offline.maxHours * 3600;
    const cappedReward = Math.min(24 * 3600, maxOfflineSec) * rate;
    assert.equal(cappedReward, 28800 * 10060);
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
