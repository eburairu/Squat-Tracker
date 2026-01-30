import { RARITY_SETTINGS } from '../constants.js';
import { InventoryManager } from './inventory-manager.js';
import { isStorageAvailable, showToast, getRandomInt, getLocalDateKey } from '../utils.js';

const WEEKLY_CHALLENGE_KEY = 'squat-tracker-weekly-challenge';

const WEEKLY_MISSION_TYPES = [
  { type: 'total_reps', description: '週間合計スクワット回数', target: 300, unit: '回', variants: [300, 500, 700] },
  { type: 'login_days', description: '週間ログイン日数', target: 3, unit: '日', variants: [3, 5] },
  { type: 'boss_kills', description: '週間ボス討伐数', target: 5, unit: '体', variants: [3, 5, 10] },
  // Future: total_calories, weapon_upgrade, etc.
];

// ローカル時間の週番号を取得 (YYYY-Www)
// ISO週番号に準拠（月曜始まり）
const getWeekKey = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const WeeklyChallengeSystem = {
  baseWeaponsData: [],
  weaponsMap: {},
  state: {
    lastUpdatedWeek: null,
    missions: []
  },

  init(options = {}) {
    if (options.baseWeaponsData) this.baseWeaponsData = options.baseWeaponsData;
    if (options.weaponsMap) this.weaponsMap = options.weaponsMap;

    this.load();
    this.checkWeeklyReset();

    // 初回ログインチェック
    this.check({ type: 'login' });
  },

  load() {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(WEEKLY_CHALLENGE_KEY);
      if (raw) {
        this.state = JSON.parse(raw);
      }
    } catch (e) {
      console.error('ウィークリーチャレンジの読み込みに失敗しました', e);
    }
  },

  save() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(WEEKLY_CHALLENGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      // 無視
    }
  },

  checkWeeklyReset() {
    const currentWeek = getWeekKey(new Date());
    if (this.state.lastUpdatedWeek !== currentWeek) {
      this.generateMissions(currentWeek);
    }
  },

  generateMissions(weekKey) {
    this.state.lastUpdatedWeek = weekKey;
    this.state.missions = [];

    // シャッフルして3つのタイプを選択
    const pool = [...WEEKLY_MISSION_TYPES].sort(() => 0.5 - Math.random());
    const selected = pool.slice(0, 3);

    selected.forEach((def, index) => {
      let target = def.target;
      if (def.variants) {
        target = def.variants[getRandomInt(0, def.variants.length - 1)];
      }

      this.state.missions.push({
        id: `weekly_${weekKey}_${index}`,
        type: def.type,
        description: def.description === '週間合計スクワット回数' ? `今週、スクワットを${target}回行う` :
                     def.description === '週間ログイン日数' ? `今週、${target}日間ログインする` :
                     def.description === '週間ボス討伐数' ? `今週、ボスを${target}体倒す` :
                     def.description,
        target: target,
        current: 0,
        unit: def.unit,
        completed: false,
        claimed: false,
        lastLoginDate: null // ログインミッション用
      });
    });

    this.save();
  },

  check(context = {}) {
    let changed = false;

    this.state.missions.forEach(mission => {
      if (mission.completed) return;

      let progress = 0;

      if (mission.type === 'login_days' && context.type === 'login') {
        // ログインは1日1回のみカウント
        const today = getLocalDateKey(new Date());
        if (mission.lastLoginDate !== today) {
            progress = 1;
            mission.lastLoginDate = today;
            // lastLoginDate更新のためchangedフラグを立てる必要があるが、
            // progress > 0 なら下で立てられる。
        }
      } else if (mission.type === 'total_reps' && context.type === 'finish' && context.totalReps) {
        progress = context.totalReps;
      } else if (mission.type === 'boss_kills' && context.type === 'boss_kill') {
        progress = 1;
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
      emoji: '🏆',
      title: 'ウィークリーチャレンジ達成！',
      message: mission.description,
      sound: true
    });
  },

  claimReward(missionId) {
    const mission = this.state.missions.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return;

    // ウィークリー報酬はレア度高めに設定
    const reward = this.lotteryWeapon();

    if (reward) {
      mission.claimed = true;
      this.save();
      this.render();

      let title = reward.result === 'NEW' ? 'ウィークリー報酬GET!' : '武器レベルUP!';
      if (reward.weapon.rarity >= 4) {
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
        showToast({
            emoji: '⚠️',
            title: '報酬エラー',
            message: '報酬の生成に失敗しました。',
        });
    }
  },

  lotteryWeapon() {
    if (!this.baseWeaponsData || this.baseWeaponsData.length === 0) return null;

    // ウィークリーボーナス: 最低レアリティ2, レア3以上の確率アップ
    // 重み設定:
    // 1: 0, 2: 40, 3: 40, 4: 15, 5: 5
    const weeklyRarityWeights = {
        1: 0,
        2: 40,
        3: 40,
        4: 15,
        5: 5
    };

    const totalRarityWeight = Object.values(weeklyRarityWeights).reduce((a, b) => a + b, 0);
    let rRandom = Math.random() * totalRarityWeight;
    let selectedRarity = 2;

    for (let r = 1; r <= 5; r++) {
      rRandom -= weeklyRarityWeights[r];
      if (rRandom <= 0) {
        selectedRarity = r;
        break;
      }
    }

    // ベース武器の選定
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

  // 今週の残り日数を計算 (月曜始まり)
  getRemainingDays() {
    const today = new Date();
    const day = today.getDay() || 7; // 月=1, ..., 日=7
    return 8 - day;
  },

  // UIレンダリング
  render(containerId = 'mission-list-weekly') {
    const listEl = document.getElementById(containerId);
    if (!listEl) return;

    // 残り日数の更新 (UI要素があれば)
    const remainingEl = document.getElementById('weekly-remaining-days');
    if (remainingEl) {
        const days = this.getRemainingDays();
        remainingEl.textContent = `残り${days}日`;
    }

    listEl.innerHTML = '';

    if (this.state.missions.length === 0) {
        listEl.innerHTML = '<li class="mission-empty">今週のミッションはありません</li>';
        return;
    }

    this.state.missions.forEach(mission => {
      const li = document.createElement('li');
      li.className = `mission-item weekly-mission ${mission.completed ? 'completed' : ''} ${mission.claimed ? 'claimed' : ''}`;

      const content = document.createElement('div');
      content.className = 'mission-content';

      const title = document.createElement('div');
      title.className = 'mission-title';
      title.textContent = mission.description;

      const progressText = document.createElement('div');
      progressText.className = 'mission-progress-text';
      const progressVal = Math.min(mission.current, mission.target);
      progressText.innerHTML = `<span>進捗: ${progressVal} / ${mission.target} ${mission.unit}</span>`;

      const progressBarBg = document.createElement('div');
      progressBarBg.className = 'mission-progress-bar-bg';
      const progressBarFill = document.createElement('div');
      progressBarFill.className = 'mission-progress-bar-fill';
      // ウィークリーミッション用のスタイル
      const pct = Math.min(100, (mission.current / mission.target) * 100);
      progressBarFill.style.width = `${pct}%`;
      progressBarBg.appendChild(progressBarFill);

      content.append(title, progressText, progressBarBg);

      const action = document.createElement('div');
      action.className = 'mission-action';

      if (mission.claimed) {
        action.innerHTML = '<span class="mission-status-icon">✅</span>';
      } else if (mission.completed) {
        const btn = document.createElement('button');
        btn.className = 'mission-btn claim weekly-claim';
        btn.textContent = '報酬受取';
        btn.addEventListener('click', () => this.claimReward(mission.id));
        action.appendChild(btn);
      } else {
        action.innerHTML = '<span class="mission-status-icon" style="opacity:0.3">🔒</span>';
      }

      li.append(content, action);
      listEl.appendChild(li);
    });
  }
};
