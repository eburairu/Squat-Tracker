export const Phase = {
  IDLE: '待機中',
  WARMUP: '準備運動',
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

export const STORAGE_KEYS = {
  HISTORY: 'squat-tracker-history-v1',
  THEME: 'squat-tracker-theme',
  THEME_STYLE: 'squat-tracker-theme-style',
  SMART_WARMUP: 'squat-tracker-smart-warmup',
  VOICE_COACH: 'squat-tracker-voice',
  VOICE_COMMAND: 'squat-tracker-voice-command',
  VOICE_PERSONA: 'squat-tracker-voice-persona',
  WORKOUT_SETTINGS: 'squat-tracker-workout-settings',
  ACHIEVEMENTS: 'squat-tracker-achievements',
  ADVENTURE: 'squat-tracker-adventure',
  BINGO: 'squat-tracker-bingo',
  BUDDY: 'squat-tracker-buddy',
  CLASS: 'squat-tracker-class',
  CLASS_MASTERY: 'squat-tracker-class-mastery',
  COMMITMENT: 'squat-tracker-commitment',
  MISSIONS: 'squat-tracker-missions',
  FORTUNE: 'squat-tracker-fortune',
  INVENTORY: 'squat-tracker-inventory',
  LOADOUTS: 'squat-tracker-loadouts',
  PLAYLISTS: 'squat-tracker-playlists',
  PRESETS: 'squat-tracker-presets',
  SCHEDULER: 'squat-tracker-weekly-schedule',
  SOUND: 'squat-tracker-sound-type',
  TITLES: 'squat-tracker-titles',
  BOSS: 'squat-tracker-boss-v1',
  TOWER_HIGHSCORE: 'squat-tracker-tower-highscore',
  COMMENTARY: 'squat-tracker-commentary',
  PHOENIX: 'squat-tracker-phoenix'
};
