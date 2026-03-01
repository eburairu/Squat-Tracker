import { STORAGE_KEYS } from '../constants.js';
import { RARITY_SETTINGS } from '../constants.js';
// import { WEAPONS } from '../data/weapons.js'; // REMOVED
import { InventoryManager } from './inventory-manager.js';
import { createElement, isStorageAvailable, getLocalDateKey, getRandomInt, showToast } from '../utils.js';

const MISSION_TYPES = [
  { type: 'login', description: 'アプリを起動してログイン', target: 1, unit: '回' },
  { type: 'finish_workout', description: 'トレーニングを完了する', target: 1, unit: '回' },
  { type: 'total_reps', description: '合計スクワット回数', target: 30, unit: '回', variants: [30, 50, 80] },
  { type: 'total_sets', description: '合計セット数', target: 3, unit: 'セット', variants: [3, 5, 10] },
  // Future: Add 'consistency' or 'no_pause' types
];

export const DailyMissionSystem = {
  baseWeaponsData: [],
  weaponsMap: {},
  state: {
    lastUpdated: null,
    missions: []
  },

  init(options = {}) {
    if (options.baseWeaponsData) this.baseWeaponsData = options.baseWeaponsData;
    if (options.weaponsMap) this.weaponsMap = options.weaponsMap;

    this.load();
    this.checkDailyReset();
    // Check login mission
    this.check({ type: 'login' });
    this.render();
  },

  load() {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MISSIONS);
      if (raw) {
        this.state = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load missions', e);
    }
  },

  save() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(this.state));
    } catch (e) {
      // Ignore
    }
  },

  checkDailyReset() {
    const today = getLocalDateKey(new Date());
    if (this.state.lastUpdated !== today) {
      this.generateMissions(today);
    }
  },

  generateMissions(dateKey) {
    this.state.lastUpdated = dateKey;
    this.state.missions = [];

    // Shuffle and pick 3 unique types
    const pool = [...MISSION_TYPES].sort(() => 0.5 - Math.random());
    const selected = pool.slice(0, 3);

    selected.forEach((def, index) => {
      let target = def.target;
      // If variants exist, pick one
      if (def.variants) {
        target = def.variants[getRandomInt(0, def.variants.length - 1)];
      }

      this.state.missions.push({
        id: `mission_${dateKey}_${index}`,
        type: def.type,
        description: def.description === '合計スクワット回数' ? `スクワットを${target}回行う` :
                     def.description === '合計セット数' ? `合計${target}セット行う` :
                     def.description,
        target: target,
        current: 0,
        unit: def.unit,
        completed: false,
        claimed: false
      });
    });

    this.save();
  },

  check(context = {}) {
    let changed = false;

    this.state.missions.forEach(mission => {
      if (mission.completed) return;

      let progress = 0;

      if (mission.type === 'login' && context.type === 'login') {
        progress = 1;
      } else if (mission.type === 'finish_workout' && context.type === 'finish') {
        progress = 1;
      } else if (mission.type === 'total_reps' && context.type === 'finish' && context.totalReps) {
        progress = context.totalReps;
      } else if (mission.type === 'total_sets' && context.type === 'finish' && context.totalSets) {
        progress = context.totalSets;
      }

      if (progress > 0) {
        mission.current += progress;
        changed = true;

        if (mission.current >= mission.target && !mission.completed) {
          mission.completed = true;
          this.notifyCompletion(mission);
        }
      }
    });

    if (changed) {
      this.save();
      this.render();
    }
  },

  notifyCompletion(mission) {
    showToast({
      emoji: '🎯',
      title: 'ミッション達成！',
      message: mission.description,
      sound: true
    });
  },

  claimReward(missionId) {
    const mission = this.state.missions.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return;

    // 100% Drop Logic
    const reward = this.lotteryWeapon();

    if (reward) {
      mission.claimed = true;
      this.save();
      this.render();

      // Notify reward
      let title = reward.result === 'NEW' ? '報酬GET!' : '武器レベルUP!';
      if (reward.weapon.rarity >= 4 && reward.result === 'NEW') {
        title = `✨${RARITY_SETTINGS[reward.weapon.rarity].name.toUpperCase()} GET!✨`;
      }

      const rarityStars = '★'.repeat(reward.weapon.rarity);
      const message = reward.result === 'MAX'
        ? `${reward.weapon.name} ${rarityStars} (最大Lv)`
        : `${reward.weapon.name} ${rarityStars} (Lv.${reward.level})`;

      showToast({
        emoji: reward.weapon.emoji,
        title: title,
        message: message,
        sound: true
      });
    } else {
        // Fallback if no weapon (should not happen if data loaded)
         showToast({
            emoji: '⚠️',
            title: '報酬エラー',
            message: '武器データの読み込みに失敗しました。',
         });
    }
  },

  lotteryWeapon() {
    if (!this.baseWeaponsData || this.baseWeaponsData.length === 0) return null;

    // 1. Select Rarity
    const rarityPool = Object.values(RARITY_SETTINGS);
    const totalRarityWeight = rarityPool.reduce((sum, r) => sum + r.weight, 0);
    let rRandom = Math.random() * totalRarityWeight;
    let selectedRarity = 1;

    for (let r = 1; r <= 5; r++) {
      rRandom -= RARITY_SETTINGS[r].weight;
      if (rRandom <= 0) {
        selectedRarity = r;
        break;
      }
    }

    // 2. Select Base Weapon
    // Use injected baseWeaponsData
    const totalBaseWeight = this.baseWeaponsData.reduce((sum, w) => sum + w.weight, 0);
    let bRandom = Math.random() * totalBaseWeight;
    let selectedBase = this.baseWeaponsData[0];

    for (const w of this.baseWeaponsData) {
      bRandom -= w.weight;
      if (bRandom <= 0) {
        selectedBase = w;
        break;
      }
    }

    const weaponId = `${selectedBase.id}_r${selectedRarity}`;
    const weapon = this.weaponsMap[weaponId];

    if (weapon && typeof InventoryManager !== 'undefined') {
      return InventoryManager.addWeapon(weaponId);
    }
    return null;
  },

  render() {
    const listEl = document.getElementById('mission-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    this.state.missions.forEach(mission => {
      const title = createElement('div', { className: 'mission-title', textContent: mission.description });
      const progressVal = Math.min(mission.current, mission.target);
      const progressText = createElement('div', { className: 'mission-progress-text', innerHTML: `<span>進捗: ${progressVal} / ${mission.target} ${mission.unit}</span>` });

      const pct = Math.min(100, (mission.current / mission.target) * 100);
      const progressBarFill = createElement('div', { className: 'mission-progress-bar-fill', style: { width: `${pct}%` } });
      const progressBarBg = createElement('div', { className: 'mission-progress-bar-bg' }, progressBarFill);

      const content = createElement('div', { className: 'mission-content' }, title, progressText, progressBarBg);

      const action = createElement('div', { className: 'mission-action' });
      if (mission.claimed) {
        action.innerHTML = '<span class="mission-status-icon">✅</span>';
      } else if (mission.completed) {
        const btn = createElement('button', { className: 'mission-btn claim', textContent: '報酬を受取る', onClick: () => this.claimReward(mission.id) });
        action.appendChild(btn);
      } else {
        action.innerHTML = '<span class="mission-status-icon" style="opacity:0.3">🔒</span>';
      }

      const li = createElement('li', { className: `mission-item ${mission.completed ? 'completed' : ''} ${mission.claimed ? 'claimed' : ''}` }, content, action);
      listEl.appendChild(li);
    });
  }
};
