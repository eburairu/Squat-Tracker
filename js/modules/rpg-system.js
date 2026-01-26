export const RpgSystem = {
  calculateLevel(totalReps) {
    if (typeof totalReps !== 'number' || totalReps < 0) return 1;
    // Level = floor(1 + sqrt(TotalReps) * 0.5)
    return Math.floor(1 + Math.sqrt(totalReps) * 0.5);
  },

  calculateAttackPower(level) {
    if (typeof level !== 'number' || level < 1) return 1;
    // AP = 1 + floor((Level - 1) * 0.5)
    return 1 + Math.floor((level - 1) * 0.5);
  },

  calculateDamage(baseAttackPower, forceCritical = false, criticalChanceBonus = 0) {
    const isCritical = forceCritical || Math.random() < (0.1 + criticalChanceBonus);
    const multiplier = isCritical ? 2 : 1;
    return {
      amount: baseAttackPower * multiplier,
      isCritical
    };
  }
};
