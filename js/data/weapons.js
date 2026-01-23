import { RARITY_SETTINGS } from '../constants.js';

export const generateWeapons = (baseWeaponsData) => {
  const weapons = {
    unarmed: { id: 'unarmed', name: '素手', emoji: '✊', baseAtk: 0, rarity: 1, maxLevel: 1, atkPerLevel: 0, weight: 0 }
  };

  if (!Array.isArray(baseWeaponsData)) {
    console.warn('generateWeapons: baseWeaponsData is not an array', baseWeaponsData);
    return weapons;
  }

  baseWeaponsData.forEach(base => {
    Object.keys(RARITY_SETTINGS).forEach(rKey => {
      const rarity = parseInt(rKey);
      const setting = RARITY_SETTINGS[rarity];
      const id = `${base.id}_r${rarity}`;
      const atk = Math.floor(base.baseAtk * setting.multiplier);

      // Higher rarity means higher potential, but slower leveling curve or higher max level could be set here.
      // For simplicity, keeping maxLevel/atkPerLevel somewhat consistent or scaled.
      const atkPerLevel = Math.max(1, Math.floor(atk * 0.1));

      weapons[id] = {
        id: id,
        baseId: base.id,
        name: base.name, // Name is same, rarity distinguished by stars
        emoji: base.emoji,
        baseAtk: atk,
        rarity: rarity,
        maxLevel: 10,
        atkPerLevel: atkPerLevel,
        weight: base.weight // Used for base type selection
      };
    });
  });
  return weapons;
};
