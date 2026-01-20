export const Phase = {
  IDLE: '待機中',
  COUNTDOWN: 'スタート前',
  DOWN: 'しゃがむ',
  HOLD: 'キープ',
  UP: '立つ',
  REST: '休憩',
  REST_COUNTDOWN: '再開前',
  FINISHED: '終了',
};

export const MONSTERS = [
  { name: 'スライム', emoji: '💧', hpRange: [10, 15] },
  { name: 'コウモリ', emoji: '🦇', hpRange: [15, 20] },
  { name: 'ゴースト', emoji: '👻', hpRange: [20, 30] },
  { name: 'ゴブリン', emoji: '👺', hpRange: [30, 40] },
  { name: 'スケルトン', emoji: '💀', hpRange: [35, 45] },
  { name: 'オーク', emoji: '👹', hpRange: [40, 60] },
  { name: '宇宙人', emoji: '👽', hpRange: [50, 70] },
  { name: 'ロボット', emoji: '🤖', hpRange: [60, 90] },
  { name: '恐竜', emoji: '🦖', hpRange: [80, 120] },
  { name: 'ドラゴン', emoji: '🐉', hpRange: [100, 150] },
];

export const RARITY_SETTINGS = {
  1: { weight: 500, multiplier: 1.0, name: 'Common' },
  2: { weight: 300, multiplier: 1.5, name: 'Uncommon' },
  3: { weight: 150, multiplier: 2.0, name: 'Rare' },
  4: { weight: 45, multiplier: 3.5, name: 'Epic' },
  5: { weight: 5, multiplier: 6.0, name: 'Legendary' }
};

export const BASE_WEAPONS = [
  { id: 'wood_sword', name: 'ひのきの棒', emoji: '🪵', baseAtk: 2, weight: 50 },
  { id: 'club', name: 'こん棒', emoji: '🦴', baseAtk: 3, weight: 40 },
  { id: 'stone_axe', name: '石の斧', emoji: '🪓', baseAtk: 6, weight: 25 },
  { id: 'iron_sword', name: '鉄の剣', emoji: '⚔️', baseAtk: 12, weight: 20 },
  { id: 'steel_hammer', name: '鋼のハンマー', emoji: '🔨', baseAtk: 20, weight: 10 },
  { id: 'flame_sword', name: '炎の剣', emoji: '🔥', baseAtk: 35, weight: 3 },
  { id: 'hero_sword', name: '勇者の剣', emoji: '🗡️', baseAtk: 50, weight: 1 },
];
