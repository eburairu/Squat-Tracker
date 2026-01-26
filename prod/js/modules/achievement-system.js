import { PresetManager } from './preset-manager.js';
import { VoiceCoach } from './voice-coach.js';
import { RpgSystem } from './rpg-system.js';
import { computeStreak, computeStats, isStorageAvailable, showToast } from '../utils.js';
import { BossBattle } from './boss-battle.js';
import { TitleManager } from './title-manager.js';

const ACHIEVEMENTS_KEY = 'squat-tracker-achievements';

export const AchievementSystem = {
  badges: [],
  unlocked: {},
  callbacks: {},

  init(options = {}) {
    this.callbacks = options;

    // Inject achievements data if provided
    if (options.achievementsData && Array.isArray(options.achievementsData)) {
      this.badges = options.achievementsData;
    } else {
      // Fallback or empty if no data provided (legacy behavior removed)
      this.badges = [];
    }

    this.load();
    // this.defineBadges(); // Removed: Badges are now loaded from JSON
    this.setupUI();
    this.render();
    this.checkRetroactiveRewards();
  },

  checkRetroactiveRewards() {
      if (!this.badges || !this.unlocked) return;

      Object.keys(this.unlocked).forEach(badgeId => {
          const badge = this.getBadge(badgeId);
          if (badge && badge.rewards) {
              if (typeof TitleManager !== 'undefined') {
                  TitleManager.unlock(badge.rewards.titlePrefix, badge.rewards.titleSuffix, true);
              }
          }
      });
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

  notify(eventName) {
    // Notify checks with type 'event' and passing eventName
    // We reuse check() logic, but we need to pass context that indicates the event
    // For simplicity, we trigger a check with a special context flag or handle it directly here if needed.
    // However, the check() function iterates all badges.
    // Optimization: check() logic handles EVENT type conditions.
    this.check({ type: 'event', eventName: eventName, forceNotify: true });
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

  evaluateCondition(cond, ctx) {
    if (!cond || !cond.type) return false;

    try {
      switch (cond.type) {
        case 'TOTAL_REPS':
          return computeStats(ctx.historyEntries).totalRepsAllTime >= cond.value;
        case 'TOTAL_WORKOUTS': // New support
            return computeStats(ctx.historyEntries).totalWorkouts >= cond.value;
        case 'STREAK':
          return computeStreak(ctx.historyEntries) >= cond.value;
        case 'BOSS_KILLS':
          return ctx.bossState && ctx.bossState.totalKills >= cond.value;
        case 'BOSS_COLLECTION':
          // Assuming we track unique types in bossState or similar.
          // Currently BossBattle.state structure might need inspection.
          // If logic is too complex for simple JSON, we assume totalKills for now or specific logic.
          // For now, let's map it to totalKills as fallback or specific logic if available.
          // Note: The original code used totalKills >= 10 for 'boss-collector'.
          return ctx.bossState && ctx.bossState.totalKills >= cond.value;
        case 'LEVEL':
           return RpgSystem.calculateLevel(computeStats(ctx.historyEntries).totalRepsAllTime) >= cond.value;
        case 'SENSOR_MODE':
          return !!ctx.sensorMode;
        case 'NO_PAUSE':
          return ctx.hasPaused === false;
        case 'SETTING_VAL': {
          if (!ctx.settings) return false;
          const val = parseInt(ctx.settings[cond.key]);
          const target = cond.value;
          if (cond.operator === '<=') return val <= target;
          if (cond.operator === '>=') return val >= target;
          if (cond.operator === '==') return val === target;
          return false;
        }
        case 'SETTING_MATCH': {
          if (!ctx.settings) return false;
          return ctx.settings[cond.key1] == ctx.settings[cond.key2];
        }
        case 'SETTING_AND': {
            if (!Array.isArray(cond.conditions)) return false;
            return cond.conditions.every(c => this.evaluateCondition(c, ctx));
        }
        case 'TIME_RANGE': {
          const h = new Date().getHours();
          // startHour <= h < endHour
          return h >= cond.startHour && h < cond.endHour;
        }
        case 'TIME_RANGE_OVERNIGHT': {
             const h = new Date().getHours();
             // e.g. 22 to 2: h >= 22 OR h < 2
             return h >= cond.startHour || h < cond.endHour;
        }
        case 'WEEKEND': {
          const d = new Date().getDay();
          return d === 0 || d === 6;
        }
        case 'VOICE_ENABLED':
            return !!VoiceCoach.enabled;
        case 'PRESET_COUNT':
             // Access PresetManager directly
             return PresetManager.presets.length > cond.value;
        case 'EVENT':
            return ctx.type === 'event' && ctx.eventName === cond.name;
        default:
          return false;
      }
    } catch (e) {
      console.warn(`Condition check failed for type ${cond.type}`, e);
      return false;
    }
  },

  check(triggerContext = {}) {
    const context = {
      // historyEntries needs to be provided in triggerContext or accessible globally.
      historyEntries: triggerContext.historyEntries || [],
      bossState: BossBattle.state,
      ...triggerContext
    };

    let newUnlock = false;
    this.badges.forEach(badge => {
      if (this.isUnlocked(badge.id)) return;

      try {
        if (this.evaluateCondition(badge.condition, context)) {
          this.unlocked[badge.id] = Date.now();
          newUnlock = true;

          if (badge.rewards) {
             TitleManager.unlock(badge.rewards.titlePrefix, badge.rewards.titleSuffix);
          }

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
