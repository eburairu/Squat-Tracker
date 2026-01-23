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
