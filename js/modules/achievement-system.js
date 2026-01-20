import { PresetManager } from './preset-manager.js';
import { VoiceCoach } from './voice-coach.js';
import { RpgSystem } from './rpg-system.js';
import { computeStreak, computeStats, isStorageAvailable, showToast } from '../utils.js';
import { BossBattle } from './boss-battle.js';

const ACHIEVEMENTS_KEY = 'squat-tracker-achievements';

export const AchievementSystem = {
  badges: [],
  unlocked: {},
  callbacks: {},

  init(options = {}) {
    this.callbacks = options;
    this.load();
    this.defineBadges();
    this.setupUI();
    this.render();
  },

  setupUI() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetId = `tab-${tab.dataset.tab}`;
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');

        if (tab.dataset.tab === 'history' && typeof this.callbacks.onHistoryTabSelected === 'function') {
             this.callbacks.onHistoryTabSelected();
        }
      });
    });
  },

  defineBadges() {
    // Note: conditions access historyEntries. We will pass context to check().
    // If we need global historyEntries, we must rely on it being passed in context.

    this.badges = [
      // Consistency
      { id: 'baby-steps', name: '初めの一歩', emoji: '🐣', description: '初めてワークアウトを完了する', condition: (ctx) => (ctx.historyEntries).length >= 1 },
      { id: 'consistency-3', name: '三日坊主回避', emoji: '🌱', description: '3日連続達成', condition: (ctx) => computeStreak(ctx.historyEntries) >= 3 },
      { id: 'consistency-7', name: '週間チャンピオン', emoji: '🔥', description: '7日連続達成', condition: (ctx) => computeStreak(ctx.historyEntries) >= 7 },
      { id: 'consistency-30', name: '習慣の達人', emoji: '📅', description: '30日連続達成', condition: (ctx) => computeStreak(ctx.historyEntries) >= 30 },
      { id: 'consistency-100', name: '百日修業', emoji: '💯', description: '100日連続達成', condition: (ctx) => computeStreak(ctx.historyEntries) >= 100 },

      // Total Reps
      { id: 'reps-100', name: 'スクワット初心者', emoji: '🥉', description: '累計100回', condition: (ctx) => computeStats(ctx.historyEntries).totalRepsAllTime >= 100 },
      { id: 'reps-500', name: '見習い戦士', emoji: '🥈', description: '累計500回', condition: (ctx) => computeStats(ctx.historyEntries).totalRepsAllTime >= 500 },
      { id: 'reps-1000', name: '熟練の騎士', emoji: '🥇', description: '累計1,000回', condition: (ctx) => computeStats(ctx.historyEntries).totalRepsAllTime >= 1000 },
      { id: 'reps-5000', name: '筋肉の将軍', emoji: '🎖️', description: '累計5,000回', condition: (ctx) => computeStats(ctx.historyEntries).totalRepsAllTime >= 5000 },
      { id: 'reps-10000', name: '伝説の英雄', emoji: '👑', description: '累計10,000回', condition: (ctx) => computeStats(ctx.historyEntries).totalRepsAllTime >= 10000 },

      // Boss
      { id: 'boss-first-blood', name: 'モンスターハンター', emoji: '🗡️', description: '初めてボスを倒す', condition: (ctx) => ctx.bossState && ctx.bossState.totalKills >= 1 },
      { id: 'boss-slayer', name: 'スレイヤー', emoji: '💀', description: 'ボス10体討伐', condition: (ctx) => ctx.bossState && ctx.bossState.totalKills >= 10 },
      { id: 'boss-collector', name: '図鑑コンプ', emoji: '📚', description: '全種類のボスを討伐', condition: (ctx) => ctx.bossState && ctx.bossState.totalKills >= 10 },
      { id: 'boss-critical', name: 'クリティカル', emoji: '💥', description: 'クリティカルヒットを出す', condition: () => false },
      { id: 'boss-limit-break', name: '限界突破', emoji: '🚀', description: 'レベル10到達', condition: (ctx) => RpgSystem.calculateLevel(computeStats(ctx.historyEntries).totalRepsAllTime) >= 10 },

      // Settings & Specials
      { id: 'tech-user', name: 'センサー使い', emoji: '📱', description: 'センサーモードで完了', condition: (ctx) => ctx.sensorMode },
      { id: 'stoic', name: 'ストイック', emoji: '⏱️', description: '休憩15秒以下で完了', condition: (ctx) => ctx.settings && parseInt(ctx.settings.restDuration) <= 15 },
      { id: 'slow-life', name: 'スローライフ', emoji: '🐢', description: '動作3秒以上で完了', condition: (ctx) => ctx.settings && parseInt(ctx.settings.downDuration) >= 3 && parseInt(ctx.settings.upDuration) >= 3 },
      { id: 'marathon', name: 'マラソンマン', emoji: '🏃', description: '1セット30回以上で完了', condition: (ctx) => ctx.settings && parseInt(ctx.settings.repCount) >= 30 },
      { id: 'iron-will', name: '鉄の意志', emoji: '🛡️', description: '一時停止なしで完了', condition: (ctx) => ctx.hasPaused === false },
      { id: 'customizer', name: 'カスタマイザー', emoji: '⚙️', description: 'プリセットを保存する', condition: () => PresetManager.presets.length > 3 },
      { id: 'backup', name: '復活の呪文', emoji: '💾', description: 'データをエクスポートする', condition: () => false },
      { id: 'balance', name: 'ハーフ＆ハーフ', emoji: '⚖️', description: 'しゃがむ時間と立つ時間が同じ', condition: (ctx) => ctx.settings && ctx.settings.downDuration == ctx.settings.upDuration },
      { id: 'good-listener', name: 'フルコンボ', emoji: '🎧', description: '音声ガイドONで完了', condition: () => VoiceCoach.enabled },
      { id: 'chameleon', name: 'テーマチェンジャー', emoji: '🎨', description: 'テーマを切り替える', condition: () => false },

      // Time & Humor
      { id: 'early-bird', name: '早起きは三文の徳', emoji: '☀️', description: '午前4時〜8時に完了', condition: () => { const h = new Date().getHours(); return h >= 4 && h < 8; } },
      { id: 'night-owl', name: '夜更かしの筋トレ', emoji: '🦉', description: '午後10時〜午前2時に完了', condition: () => { const h = new Date().getHours(); return h >= 22 || h < 2; } },
      { id: 'lunch-break', name: 'ランチタイム', emoji: '🍱', description: '正午〜午後1時に完了', condition: () => { const h = new Date().getHours(); return h === 12; } },
      { id: 'weekend-warrior', name: '週末の戦士', emoji: '🏖️', description: '土日に完了', condition: () => { const d = new Date().getDay(); return d === 0 || d === 6; } },
      { id: 'lucky-7', name: 'ラッキーセブン', emoji: '🎰', description: '1セット7回で完了', condition: (ctx) => ctx.settings && parseInt(ctx.settings.repCount) === 7 }
    ];
  },

  notify(eventName) {
    if (eventName === 'critical') this.unlock('boss-critical');
    if (eventName === 'theme_change') this.unlock('chameleon');
    if (eventName === 'backup') this.unlock('backup');
  },

  load() {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (raw) {
        this.unlocked = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load achievements', e);
    }
  },

  save() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this.unlocked));
    } catch (e) {
      // Ignore
    }
  },

  check(triggerContext = {}) {
    const context = {
      // historyEntries needs to be provided in triggerContext or accessible globally.
      // We will expect historyEntries to be passed in triggerContext from main app.
      historyEntries: triggerContext.historyEntries || [],
      bossState: BossBattle.state, // Direct import access to state
      ...triggerContext
    };

    let newUnlock = false;
    this.badges.forEach(badge => {
      if (this.isUnlocked(badge.id)) return;

      try {
        if (badge.condition(context)) {
          this.unlocked[badge.id] = Date.now();
          newUnlock = true;
          if (triggerContext.type === 'finish' || triggerContext.forceNotify) {
            this.showNotification(badge);
          }
        }
      } catch (e) {
        console.error(`Error checking badge ${badge.id}`, e);
      }
    });

    if (newUnlock) {
      this.save();
      this.render();
    }
  },

  showNotification(badge) {
    showToast({
      emoji: badge.emoji,
      title: '実績解除！',
      message: badge.name,
      sound: true
    });
  },

  unlock(badgeId) {
    if (this.unlocked[badgeId]) return;
    this.unlocked[badgeId] = Date.now();
    this.save();
  },

  isUnlocked(badgeId) {
    return !!this.unlocked[badgeId];
  },

  getBadge(badgeId) {
    return this.badges.find(b => b.id === badgeId);
  },

  render() {
    const grid = document.getElementById('badge-grid');
    if (!grid) return;

    grid.innerHTML = '';
    this.badges.forEach(badge => {
      const isUnlocked = this.isUnlocked(badge.id);
      const el = document.createElement('div');
      el.className = `badge ${isUnlocked ? 'unlocked' : 'locked'}`;

      const emoji = document.createElement('div');
      emoji.className = 'badge-emoji';
      emoji.textContent = badge.emoji;

      const name = document.createElement('div');
      name.className = 'badge-name';
      name.textContent = badge.name;

      el.append(emoji, name);

      el.addEventListener('click', () => {
        const status = isUnlocked ? '✅ 獲得済み' : '🔒 未獲得';
        const dateStr = isUnlocked ? `\n獲得日: ${new Date(this.unlocked[badge.id]).toLocaleDateString()}` : '';
        alert(`${badge.emoji} ${badge.name}\n\n${badge.description}\n\n${status}${dateStr}`);
      });

      grid.appendChild(el);
    });
  }
};
