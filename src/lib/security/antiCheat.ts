import { GAME_CONFIG, calculatePassiveProduction } from '../config/gameConfig';

export interface ValidationInput {
  claimedEnergyDelta: number;
  clickBatch: {
    coins: number;
    booms: number;
    comboMax: number;
    durationMs: number;
  };
  items: Record<string, number>;
  elapsedSeconds: number;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedEnergyDelta: number;
}

/**
 * Server-side anti-cheat validation for batched click sessions
 */
export function validateBatch(input: ValidationInput): ValidationResult {
  const { claimedEnergyDelta, clickBatch, items, elapsedSeconds } = input;

  // 1. Validate Click Rate (CPS)
  const durationSec = Math.max(1, clickBatch.durationMs / 1000);
  const totalClicks = clickBatch.coins + clickBatch.booms;
  const cps = totalClicks / durationSec;

  if (cps > GAME_CONFIG.sync.maxCps) {
    return {
      isValid: false,
      reason: `Unrealistic click speed: ${cps.toFixed(1)} CPS exceeds limit of ${GAME_CONFIG.sync.maxCps} CPS`,
      sanitizedEnergyDelta: 0,
    };
  }

  // 2. Calculate Maximum Plausible Active Click Energy
  const earthLevel = items['earth_clicker'] || 0;
  const clickMultiplier = earthLevel > 0 ? earthLevel + 1 : 1;
  const maxComboMultiplier = GAME_CONFIG.combo.maxMultiplier;
  const critMultiplier = GAME_CONFIG.criticalClick.multiplier;

  const maxClickRewardPerCoin =
    GAME_CONFIG.baseClickPower * clickMultiplier * maxComboMultiplier * critMultiplier;
  const maxPlausibleCoinReward = clickBatch.coins * maxClickRewardPerCoin;

  // 3. Calculate Passive Production Upper Bound
  const passiveRate = calculatePassiveProduction(items);
  // Allow slight grace period (1.5x) for network latency variations
  const maxPlausiblePassive = passiveRate * Math.min(elapsedSeconds * 1.5, 30);

  const totalMaxPlausible = maxPlausibleCoinReward + maxPlausiblePassive;

  if (claimedEnergyDelta > totalMaxPlausible + 50) {
    return {
      isValid: false,
      reason: `Claimed energy delta (${claimedEnergyDelta}) exceeds maximum plausible energy (${totalMaxPlausible.toFixed(0)})`,
      sanitizedEnergyDelta: Math.round(totalMaxPlausible),
    };
  }

  return {
    isValid: true,
    sanitizedEnergyDelta: claimedEnergyDelta,
  };
}
