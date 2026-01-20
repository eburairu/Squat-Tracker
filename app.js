const phaseDisplay = document.getElementById('phase-display');
const setDisplay = document.getElementById('set-display');
const repDisplay = document.getElementById('rep-display');
const phaseTimer = document.getElementById('phase-timer');
const phaseHint = document.getElementById('phase-hint');
const quizProblem = document.getElementById('quiz-problem');
const quizAnswer = document.getElementById('quiz-answer');
const progressBar = document.getElementById('progress-bar');
const statsTotalReps = document.getElementById('stats-total-reps');
const statsTotalWorkouts = document.getElementById('stats-total-workouts');
const statsLastDate = document.getElementById('stats-last-date');
const statsRank = document.getElementById('stats-rank');
const statsSessionReps = document.getElementById('stats-session-reps');
const statsSessionTarget = document.getElementById('stats-session-target');
const historyList = document.getElementById('history-list');
const heatmapContainer = document.getElementById('activity-heatmap');
const historyNote = document.getElementById('history-note');
const themeToggle = document.getElementById('theme-toggle');
const themeStatus = document.getElementById('theme-status');
const voiceToggle = document.getElementById('voice-toggle');
const voiceStatus = document.getElementById('voice-status');

const setCountInput = document.getElementById('set-count');
const repCountInput = document.getElementById('rep-count');
const downDurationInput = document.getElementById('down-duration');
const holdDurationInput = document.getElementById('hold-duration');
const upDurationInput = document.getElementById('up-duration');
const restDurationInput = document.getElementById('rest-duration');
const countdownDurationInput = document.getElementById('countdown-duration');

const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');

const presetSelect = document.getElementById('preset-select');
const savePresetButton = document.getElementById('save-preset-button');
const deletePresetButton = document.getElementById('delete-preset-button');

const sensorToggle = document.getElementById('sensor-toggle');
const sensorCalibrateButton = document.getElementById('sensor-calibrate');
const sensorStatus = document.getElementById('sensor-status');

const exportDataButton = document.getElementById('export-data-button');
const importDataButton = document.getElementById('import-data-button');
const importFileInput = document.getElementById('import-file-input');

const confettiCanvas = document.getElementById('confetti');
let confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
const prefersReducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

const Phase = {
  IDLE: '待機中',
  COUNTDOWN: 'スタート前',
  DOWN: 'しゃがむ',
  HOLD: 'キープ',
  UP: '立つ',
  REST: '休憩',
  REST_COUNTDOWN: '再開前',
  FINISHED: '終了',
};

const MONSTERS = [
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

const RARITY_SETTINGS = {
  1: { weight: 500, multiplier: 1.0, name: 'Common' },
  2: { weight: 300, multiplier: 1.5, name: 'Uncommon' },
  3: { weight: 150, multiplier: 2.0, name: 'Rare' },
  4: { weight: 45, multiplier: 3.5, name: 'Epic' },
  5: { weight: 5, multiplier: 6.0, name: 'Legendary' }
};

const BASE_WEAPONS = [
  { id: 'wood_sword', name: 'ひのきの棒', emoji: '🪵', baseAtk: 2, weight: 50 },
  { id: 'club', name: 'こん棒', emoji: '🦴', baseAtk: 3, weight: 40 },
  { id: 'stone_axe', name: '石の斧', emoji: '🪓', baseAtk: 6, weight: 25 },
  { id: 'iron_sword', name: '鉄の剣', emoji: '⚔️', baseAtk: 12, weight: 20 },
  { id: 'steel_hammer', name: '鋼のハンマー', emoji: '🔨', baseAtk: 20, weight: 10 },
  { id: 'flame_sword', name: '炎の剣', emoji: '🔥', baseAtk: 35, weight: 3 },
  { id: 'hero_sword', name: '勇者の剣', emoji: '🗡️', baseAtk: 50, weight: 1 },
];

const generateWeapons = () => {
  const weapons = {
    unarmed: { id: 'unarmed', name: '素手', emoji: '✊', baseAtk: 0, rarity: 1, maxLevel: 1, atkPerLevel: 0, weight: 0 }
  };

  BASE_WEAPONS.forEach(base => {
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

const WEAPONS = generateWeapons();

const INVENTORY_KEY = 'squat-tracker-inventory';

const InventoryManager = {
  state: {
    equippedId: 'unarmed',
    items: {
      unarmed: { level: 1, acquiredAt: Date.now() }
    }
  },

  init() {
    this.load();
    // Ensure initial state validity
    if (!this.state.items.unarmed) {
      this.state.items.unarmed = { level: 1, acquiredAt: Date.now() };
    }
    if (!WEAPONS[this.state.equippedId]) {
      this.state.equippedId = 'unarmed';
    }
    // Render UI if elements exist
    this.render();
    this.setupUI();
  },

  load() {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(INVENTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.items) {
          this.state = parsed;
          this.migrate();
        }
      }
    } catch (e) {
      console.error('Failed to load inventory', e);
    }
  },

  migrate() {
    // Migration: Convert old IDs (e.g., 'wood_sword') to new IDs (e.g., 'wood_sword_r1')
    let changed = false;
    const newItems = {};

    // Handle equippedId migration
    if (this.state.equippedId && !WEAPONS[this.state.equippedId]) {
      const newId = `${this.state.equippedId}_r1`;
      if (WEAPONS[newId]) {
        this.state.equippedId = newId;
        changed = true;
      } else {
        this.state.equippedId = 'unarmed';
        changed = true;
      }
    }

    // Handle items migration
    Object.keys(this.state.items).forEach(key => {
      if (WEAPONS[key]) {
        newItems[key] = this.state.items[key];
      } else {
        const newId = `${key}_r1`;
        if (WEAPONS[newId]) {
          newItems[newId] = this.state.items[key];
          changed = true;
        }
      }
    });

    if (changed) {
      this.state.items = newItems;
      this.save();
    }
  },

  save() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save inventory', e);
    }
  },

  addWeapon(weaponId) {
    const weaponDef = WEAPONS[weaponId];
    if (!weaponDef) return null;

    let result = 'NEW'; // NEW, LEVEL_UP, MAX
    let item = this.state.items[weaponId];

    if (item) {
      if (item.level < weaponDef.maxLevel) {
        item.level += 1;
        result = 'LEVEL_UP';
      } else {
        result = 'MAX';
      }
    } else {
      this.state.items[weaponId] = {
        level: 1,
        acquiredAt: Date.now()
      };
      result = 'NEW';
    }

    this.save();
    this.render(); // Update UI if open
    return { result, weapon: weaponDef, level: this.state.items[weaponId].level };
  },

  equipWeapon(weaponId) {
    if (!this.state.items[weaponId] || !WEAPONS[weaponId]) return false;
    this.state.equippedId = weaponId;
    this.save();
    this.render();
    return true;
  },

  getEquippedWeapon() {
    const id = this.state.equippedId;
    const def = WEAPONS[id] || WEAPONS.unarmed;
    const item = this.state.items[id] || { level: 1 };

    // Calculate attack power: Base + (Level - 1) * Growth
    const bonus = def.baseAtk + (item.level - 1) * def.atkPerLevel;

    return {
      ...def,
      level: item.level,
      bonusAtk: bonus
    };
  },

  getAttackBonus() {
    return this.getEquippedWeapon().bonusAtk;
  },

  setupUI() {
    const openBtn = document.getElementById('equipment-button');
    const modal = document.getElementById('equipment-modal');
    if (!modal) return;

    const closeElements = modal.querySelectorAll('[data-close]');

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        this.render();
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
      });
    }

    closeElements.forEach(el => {
      el.addEventListener('click', () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      });
    });
  },

  render() {
    const listEl = document.getElementById('weapon-list');
    const bonusEl = document.getElementById('equipment-total-bonus');
    const totalBonus = this.getAttackBonus();

    if (bonusEl) {
      bonusEl.textContent = `+${totalBonus}`;
    }

    if (!listEl) return;
    listEl.innerHTML = '';

    // Sort: Equipped first, then by rarity desc, then by power
    const ownedIds = Object.keys(this.state.items);
    ownedIds.sort((a, b) => {
      if (a === this.state.equippedId) return -1;
      if (b === this.state.equippedId) return 1;

      const wa = WEAPONS[a];
      const wb = WEAPONS[b];
      if (wb.rarity !== wa.rarity) return wb.rarity - wa.rarity;
      return wb.baseAtk - wa.baseAtk;
    });

    ownedIds.forEach(id => {
      const def = WEAPONS[id];
      const item = this.state.items[id];
      if (!def) return;

      const currentAtk = def.baseAtk + (item.level - 1) * def.atkPerLevel;
      const isEquipped = id === this.state.equippedId;

      const li = document.createElement('li');
      li.className = `weapon-item ${isEquipped ? 'equipped' : ''}`;
      li.innerHTML = `
        <div class="weapon-icon">${def.emoji}</div>
        <div class="weapon-info">
          <div class="weapon-name">
             ${def.name} <span style="font-size:0.8em; color:#666">Lv.${item.level}</span>
             ${isEquipped ? '<span class="equip-status">装備中</span>' : ''}
          </div>
          <div class="weapon-meta">レア度 ${'★'.repeat(def.rarity)}</div>
        </div>
        <div class="weapon-stats">+${currentAtk}</div>
      `;

      li.addEventListener('click', () => {
        if (!isEquipped) {
          this.equipWeapon(id);
        }
      });

      listEl.appendChild(li);
    });
  }
};

// Expose for testing
if (typeof window !== 'undefined') {
  window.InventoryManager = InventoryManager;
}

const RpgSystem = {
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

  calculateDamage(baseAttackPower) {
    const isCritical = Math.random() < 0.1; // 10% chance
    const multiplier = isCritical ? 2 : 1;
    return {
      amount: baseAttackPower * multiplier,
      isCritical
    };
  }
};

// Expose for testing
if (typeof window !== 'undefined') {
  window.RpgSystem = RpgSystem;
}

const BossBattle = {
  state: {
    currentMonster: null,
    totalKills: 0,
    monsterIndex: 0,
    loopCount: 1,
    lastInteraction: Date.now(),
  },
  isRespawning: false,
  elements: {},

  init() {
    this.elements = {
      card: document.getElementById('boss-card'),
      avatar: document.getElementById('boss-avatar'),
      name: document.getElementById('boss-name'),
      hpText: document.getElementById('boss-hp-text'),
      hpBar: document.getElementById('boss-hp-bar'),
      killCount: document.getElementById('boss-kill-count'),
    };

    if (!this.elements.card) return;

    this.loadState();

    // Initial regeneration check
    this.regenerateHp();

    if (!this.state.currentMonster) {
      this.spawnMonster(false);
    }
    this.render();

    // Regenerate on visibility change (app becoming active)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.regenerateHp();
        this.render();
      }
    });
  },

  loadState() {
    try {
      const raw = localStorage.getItem('squat-tracker-boss-v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = {
          ...this.state,
          ...parsed
        };

        // Migration: Ensure new fields exist
        if (typeof this.state.monsterIndex !== 'number') this.state.monsterIndex = 0;
        if (typeof this.state.loopCount !== 'number') this.state.loopCount = 1;
        if (!this.state.lastInteraction) this.state.lastInteraction = Date.now();
      }
    } catch (e) {
      console.error('Failed to load boss state', e);
    }
  },

  saveState() {
    try {
      localStorage.setItem('squat-tracker-boss-v1', JSON.stringify(this.state));
    } catch (e) {
      // Ignore
    }
  },

  regenerateHp() {
    if (!this.state.currentMonster) return;

    const now = Date.now();
    const elapsed = now - (this.state.lastInteraction || now);
    // 10% per 24 hours (86400000 ms)
    const healRatio = 0.10 * (elapsed / 86400000);
    const healAmount = this.state.currentMonster.maxHp * healRatio;

    if (healAmount > 0) {
      this.state.currentMonster.currentHp = Math.min(
        this.state.currentMonster.maxHp,
        this.state.currentMonster.currentHp + healAmount
      );
    }

    this.state.lastInteraction = now;
    this.saveState();
  },

  spawnMonster(animate = true) {
    const index = this.state.monsterIndex % MONSTERS.length;
    const template = MONSTERS[index];

    // Scaling: 1.0, 1.5, 2.0...
    const scalingFactor = 1 + (this.state.loopCount - 1) * 0.5;

    const minHp = Math.floor(template.hpRange[0] * scalingFactor);
    const maxHp = Math.floor(template.hpRange[1] * scalingFactor);
    const hp = getRandomInt(minHp, maxHp);

    this.state.currentMonster = {
      name: template.name,
      emoji: template.emoji,
      maxHp: hp,
      currentHp: hp,
    };

    this.state.lastInteraction = Date.now();

    this.saveState();
    this.render();

    if (animate && this.elements.avatar) {
      this.elements.avatar.classList.remove('boss-spawn', 'boss-defeat');
      void this.elements.avatar.offsetWidth;
      this.elements.avatar.classList.add('boss-spawn');
    }
  },

  damage(amount, isCritical = false) {
    if (this.isRespawning) return;

    this.regenerateHp();

    if (!this.state.currentMonster) return;

    const monster = this.state.currentMonster;
    monster.currentHp = Math.max(0, monster.currentHp - amount);
    this.state.lastInteraction = Date.now();

    if (this.elements.avatar) {
      this.elements.avatar.classList.remove('boss-shake', 'boss-critical');
      void this.elements.avatar.offsetWidth;

      if (isCritical) {
        this.elements.avatar.classList.add('boss-critical');
        this.showCriticalEffect();
        if (typeof AchievementSystem !== 'undefined') {
          AchievementSystem.notify('critical');
        }
      } else {
        this.elements.avatar.classList.add('boss-shake');
      }
    }

    if (monster.currentHp <= 0) {
      this.handleDefeat();
    } else {
      this.saveState();
      this.render();
    }
  },

  showCriticalEffect() {
    // Simple visual effect for critical hit
    const damageText = document.createElement('div');
    damageText.textContent = 'CRITICAL!';
    damageText.className = 'critical-text';

    // Append to avatar wrapper for better positioning
    const wrapper = this.elements.avatar ? this.elements.avatar.parentElement : this.elements.card;
    if (wrapper) {
      wrapper.appendChild(damageText);
      setTimeout(() => {
        damageText.remove();
      }, 1000);
    }
  },

  handleDefeat() {
    if (this.isRespawning) return;
    this.isRespawning = true;

    this.state.totalKills += 1;
    this.state.monsterIndex += 1;
    if (this.state.monsterIndex >= MONSTERS.length) {
      this.state.monsterIndex = 0;
      this.state.loopCount += 1;
    }

    this.rollDrop();

    this.saveState();
    this.render();

    if (this.elements.avatar) {
      this.elements.avatar.classList.add('boss-defeat');
    }

    setTimeout(() => {
      this.spawnMonster(true);
      this.isRespawning = false;
    }, 1000);
  },

  rollDrop() {
    // 30% drop chance
    if (Math.random() > 0.3) return;

    // 1. Select Rarity
    const rarityPool = Object.values(RARITY_SETTINGS);
    const totalRarityWeight = rarityPool.reduce((sum, r) => sum + r.weight, 0);
    let rRandom = Math.random() * totalRarityWeight;
    let selectedRarity = 1;

    // Iterate keys 1..5
    for (let r = 1; r <= 5; r++) {
      rRandom -= RARITY_SETTINGS[r].weight;
      if (rRandom <= 0) {
        selectedRarity = r;
        break;
      }
    }

    // 2. Select Base Weapon
    const totalBaseWeight = BASE_WEAPONS.reduce((sum, w) => sum + w.weight, 0);
    let bRandom = Math.random() * totalBaseWeight;
    let selectedBase = BASE_WEAPONS[0];

    for (const w of BASE_WEAPONS) {
      bRandom -= w.weight;
      if (bRandom <= 0) {
        selectedBase = w;
        break;
      }
    }

    const weaponId = `${selectedBase.id}_r${selectedRarity}`;
    const weapon = WEAPONS[weaponId];

    if (weapon && typeof InventoryManager !== 'undefined') {
      const result = InventoryManager.addWeapon(weaponId);
      if (result) {
        let title = result.result === 'NEW' ? '武器GET!' : '武器レベルUP!';
        const rarityStars = '★'.repeat(weapon.rarity);

        // Special message for high rarity
        if (weapon.rarity >= 4 && result.result === 'NEW') {
          title = `✨${RARITY_SETTINGS[weapon.rarity].name.toUpperCase()} GET!✨`;
        }

        const message = result.result === 'MAX'
          ? `${weapon.name} ${rarityStars} (最大Lv)`
          : `${weapon.name} ${rarityStars} (Lv.${result.level})`;

        showToast({
          emoji: weapon.emoji,
          title: title,
          message: message,
          sound: true
        });
      }
    }
  },

  render() {
    if (!this.elements.card) return;

    const { currentMonster, totalKills } = this.state;
    if (currentMonster) {
      this.elements.avatar.textContent = currentMonster.emoji;
      this.elements.name.textContent = currentMonster.name;
      // Show integer HP for cleaner UI
      const current = Math.ceil(currentMonster.currentHp);
      const max = Math.ceil(currentMonster.maxHp);
      this.elements.hpText.textContent = `${current} / ${max}`;

      const pct = (current / max) * 100;
      this.elements.hpBar.style.width = `${pct}%`;
    }

    this.elements.killCount.textContent = totalKills;
  }
};

if (typeof window !== 'undefined') {
  window.BossBattle = BossBattle;
}

const MISSIONS_KEY = 'squat-tracker-missions';

const MISSION_TYPES = [
  { type: 'login', description: 'アプリを起動してログイン', target: 1, unit: '回' },
  { type: 'finish_workout', description: 'トレーニングを完了する', target: 1, unit: '回' },
  { type: 'total_reps', description: '合計スクワット回数', target: 30, unit: '回', variants: [30, 50, 80] },
  { type: 'total_sets', description: '合計セット数', target: 3, unit: 'セット', variants: [3, 5, 10] },
  // Future: Add 'consistency' or 'no_pause' types
];

const DailyMissionSystem = {
  state: {
    lastUpdated: null,
    missions: []
  },

  init() {
    this.load();
    this.checkDailyReset();
    // Check login mission
    this.check({ type: 'login' });
    this.render();
  },

  load() {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(MISSIONS_KEY);
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
      localStorage.setItem(MISSIONS_KEY, JSON.stringify(this.state));
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
    }
  },

  lotteryWeapon() {
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
    const totalBaseWeight = BASE_WEAPONS.reduce((sum, w) => sum + w.weight, 0);
    let bRandom = Math.random() * totalBaseWeight;
    let selectedBase = BASE_WEAPONS[0];

    for (const w of BASE_WEAPONS) {
      bRandom -= w.weight;
      if (bRandom <= 0) {
        selectedBase = w;
        break;
      }
    }

    const weaponId = `${selectedBase.id}_r${selectedRarity}`;
    const weapon = WEAPONS[weaponId];

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
      const li = document.createElement('li');
      li.className = `mission-item ${mission.completed ? 'completed' : ''} ${mission.claimed ? 'claimed' : ''}`;

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
        btn.className = 'mission-btn claim';
        btn.textContent = '報酬を受取る';
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

if (typeof window !== 'undefined') {
  window.DailyMissionSystem = DailyMissionSystem;
}

class WorkoutTimer {
  constructor() {
    this.timeoutId = null;
    this.callback = null;
    this.remaining = 0;
    this.startTime = 0;
    this.isRunning = false;
  }

  schedule(durationSeconds, callback) {
    this.cancel();
    this.callback = callback;
    this.remaining = durationSeconds * 1000;
    this.resume();
  }

  pause() {
    if (!this.isRunning) return;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = null;
    const elapsed = Date.now() - this.startTime;
    this.remaining = Math.max(0, this.remaining - elapsed);
    this.isRunning = false;
  }

  resume() {
    if (this.isRunning || !this.callback) return;
    // If remaining is 0 or less, execute immediately (or next tick)
    this.startTime = Date.now();
    this.isRunning = true;
    this.timeoutId = setTimeout(() => {
      this.isRunning = false;
      this.callback();
    }, Math.max(0, this.remaining));
  }

  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = null;
    this.callback = null;
    this.remaining = 0;
    this.isRunning = false;
  }
}

const workoutTimer = new WorkoutTimer();
let audioContext = null;
let phaseStart = null;
let phaseDuration = null;
let currentPhase = Phase.IDLE;
let totalSets = 3;
let repsPerSet = 10;
let currentSet = 1;
let currentRep = 1;
let isPaused = false;
let hasPaused = false; // Track if pause was used
let pausedAt = null;
let workoutStarted = false;
let workoutSaved = false;
let lastCountdownSecond = null;
let currentQuiz = null;

let sensorMode = false;
let sensorActive = false;
let sensorBaseline = null;
let sensorThreshold = null;
let lastSensorCounted = false;
let lastOrientationTime = 0;

const HISTORY_KEY = 'squat-tracker-history-v1';
const MAX_HISTORY_ENTRIES = 50;
const THEME_KEY = 'squat-tracker-theme';
const VOICE_COACH_KEY = 'squat-tracker-voice';
const WORKOUT_SETTINGS_KEY = 'squat-tracker-workout-settings';
const PRESET_KEY = 'squat-tracker-presets';
let historyEntries = [];

const phases = [
  { key: Phase.DOWN, duration: () => parseInt(downDurationInput.value, 10) },
  { key: Phase.HOLD, duration: () => parseInt(holdDurationInput.value, 10) },
  { key: Phase.UP, duration: () => parseInt(upDurationInput.value, 10) },
];

const phaseBeepFrequencies = {
  [Phase.DOWN]: 523.25,
  [Phase.HOLD]: 659.25,
  [Phase.UP]: 784,
};

const timesTableRange = { min: 1, max: 9 };

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateQuiz = () => {
  const types = ['+', '-', '×', '÷'];
  const type = types[getRandomInt(0, 3)];
  const range = timesTableRange; // { min: 1, max: 9 }

  if (type === '+') {
    const a = getRandomInt(range.min, range.max);
    const b = getRandomInt(range.min, range.max);
    return {
      expression: `${a} + ${b}`,
      answer: a + b,
    };
  }

  if (type === '-') {
    const a = getRandomInt(range.min, range.max);
    const b = getRandomInt(range.min, range.max);
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    return {
      expression: `${big} - ${small}`,
      answer: big - small,
    };
  }

  if (type === '×') {
    const a = getRandomInt(range.min, range.max);
    const b = getRandomInt(range.min, range.max);
    return {
      expression: `${a} × ${b}`,
      answer: a * b,
    };
  }

  // Division (÷)
  const divisor = getRandomInt(range.min, range.max);
  const answer = getRandomInt(range.min, range.max);
  const dividend = divisor * answer;
  return {
    expression: `${dividend} ÷ ${divisor}`,
    answer,
  };
};

if (typeof window !== 'undefined') {
  window.generateQuiz = generateQuiz;
}

const updateQuizDisplay = (phaseKey) => {
  if (!quizProblem || !quizAnswer) {
    return;
  }
  if (phaseKey === Phase.DOWN) {
    currentQuiz = generateQuiz();
  }
  if (phaseKey === Phase.DOWN || phaseKey === Phase.HOLD) {
    const quiz = currentQuiz ?? generateQuiz();
    currentQuiz = quiz;
    quizProblem.textContent = `問題: ${quiz.expression} = ?`;
    quizAnswer.textContent = '答え: --';
    return;
  }
  if (phaseKey === Phase.UP && currentQuiz) {
    quizProblem.textContent = `問題: ${currentQuiz.expression} = ?`;
    quizAnswer.textContent = `答え: ${currentQuiz.answer}`;
    return;
  }
  quizProblem.textContent = '問題: --';
  quizAnswer.textContent = '答え: --';
};

const isCountdownPhase = (phaseKey) => phaseKey === Phase.COUNTDOWN || phaseKey === Phase.REST_COUNTDOWN;

const ensureAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const VoiceCoach = {
  enabled: false,
  voice: null,

  init() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = ['Google', 'Haruka', 'Ichiro', 'Kyoko', 'Nanami'];

      this.voice = voices.find((v) => v.lang === 'ja-JP' && preferredVoices.some(name => v.name.includes(name)))
        || voices.find((v) => v.lang === 'ja-JP' && v.default)
        || voices.find((v) => v.lang === 'ja-JP')
        || voices[0]
        || null;

      console.log('VoiceCoach selected voice:', this.voice ? this.voice.name : 'none');
    };

    setVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
  },

  speak(text) {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!this.enabled || !synth) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    synth.speak(utterance);
  },

  setEnabled(value) {
    this.enabled = value;
  }
};

const playTone = (frequency, duration, options = {}) => {
  ensureAudioContext();
  const now = audioContext.currentTime;
  const startTime = options.startTime ?? now;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = options.type ?? 'triangle';
  oscillator.frequency.setValueAtTime(frequency * 0.96, startTime);
  oscillator.frequency.linearRampToValueAtTime(frequency * 1.08, startTime + duration / 1000);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(options.volume ?? 0.2, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration / 1000);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration / 1000 + 0.05);
};

const beep = (frequency = 659.25, duration = 150) => {
  playTone(frequency, duration, { type: 'triangle', volume: 0.2 });
};

const playCelebration = () => {
  ensureAudioContext();
  const now = audioContext.currentTime;
  const notes = [880, 1174.66, 1318.51, 1567.98];
  notes.forEach((frequency, index) => {
    playTone(frequency, 180, { startTime: now + index * 0.12, type: 'sine', volume: 0.22 });
  });
  playTone(2093, 260, { startTime: now + 0.1, type: 'triangle', volume: 0.16 });
};

const ensureConfettiContext = () => {
  if (!confettiCanvas) {
    return null;
  }
  if (!confettiCtx) {
    confettiCtx = confettiCanvas.getContext('2d');
  }
  return confettiCtx;
};

const isStorageAvailable = (() => {
  try {
    const testKey = '__squat_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
})();

const getPreferredTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const applyTheme = (theme) => {
  const isDark = theme === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (themeToggle) {
    themeToggle.checked = isDark;
  }
  if (themeStatus) {
    themeStatus.textContent = isDark ? 'ダーク' : 'ライト';
  }
};

const persistTheme = (theme) => {
  if (!isStorageAvailable) {
    return;
  }
  localStorage.setItem(THEME_KEY, theme);
};

const initializeTheme = () => {
  const stored = isStorageAvailable ? localStorage.getItem(THEME_KEY) : null;
  const theme = stored || getPreferredTheme();
  applyTheme(theme);
};

const initializeVoiceCoach = () => {
  VoiceCoach.init();
  if (!voiceToggle || !voiceStatus) return;

  const stored = isStorageAvailable ? localStorage.getItem(VOICE_COACH_KEY) : null;
  const enabled = stored === 'true';

  voiceToggle.checked = enabled;
  VoiceCoach.setEnabled(enabled);
  voiceStatus.textContent = enabled ? 'ON' : 'OFF';
};

const DataManager = {
  init() {
    if (exportDataButton) {
      exportDataButton.addEventListener('click', () => this.exportData());
    }
    if (importDataButton && importFileInput) {
      importDataButton.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
  },

  exportData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('squat-tracker-')) {
        data[key] = localStorage.getItem(key);
      }
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `squat-tracker-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof AchievementSystem !== 'undefined') {
      AchievementSystem.notify('backup');
    }
  },

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('現在のデータを上書きして復元しますか？この操作は取り消せません。')) {
      importFileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        this.importData(json);
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。正しいJSONファイルか確認してください。');
        console.error(error);
      } finally {
        importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  },

  importData(data) {
    if (!data || typeof data !== 'object') {
      alert('データ形式が不正です。');
      return;
    }

    let count = 0;
    Object.keys(data).forEach(key => {
      if (key.startsWith('squat-tracker-')) {
        localStorage.setItem(key, data[key]);
        count++;
      }
    });

    if (count > 0) {
      alert('復元が完了しました。ページを再読み込みします。');
      window.location.reload();
    } else {
      alert('有効なデータが見つかりませんでした。');
    }
  }
};

const PresetManager = {
  presets: [],

  init() {
    this.loadPresets();
    if (this.presets.length === 0) {
      this.createDefaultPresets();
    }
    this.renderOptions();
    this.updateButtons();
  },

  loadPresets() {
    if (!isStorageAvailable) return;
    try {
      const stored = localStorage.getItem(PRESET_KEY);
      if (stored) {
        this.presets = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load presets', e);
    }
  },

  savePresets() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(this.presets));
    } catch (e) {
      console.error('Failed to save presets', e);
    }
  },

  createDefaultPresets() {
    this.presets = [
      {
        name: 'ノーマル (標準)',
        settings: { setCount: 3, repCount: 10, downDuration: 2, holdDuration: 1, upDuration: 1, restDuration: 30, countdownDuration: 5 }
      },
      {
        name: '初心者 (軽め)',
        settings: { setCount: 2, repCount: 5, downDuration: 2, holdDuration: 1, upDuration: 1, restDuration: 60, countdownDuration: 5 }
      },
      {
        name: 'スロー (じっくり)',
        settings: { setCount: 3, repCount: 8, downDuration: 4, holdDuration: 2, upDuration: 4, restDuration: 45, countdownDuration: 5 }
      }
    ];
    this.savePresets();
  },

  addPreset(name, settings) {
    const existingIndex = this.presets.findIndex(p => p.name === name);
    if (existingIndex >= 0) {
      this.presets[existingIndex] = { name, settings };
    } else {
      this.presets.push({ name, settings });
    }
    this.savePresets();
    this.renderOptions(name);
  },

  deletePreset(name) {
    this.presets = this.presets.filter(p => p.name !== name);
    this.savePresets();
    this.renderOptions('');
  },

  getPreset(name) {
    return this.presets.find(p => p.name === name);
  },

  renderOptions(selectedName = null) {
    if (!presetSelect) return;
    const currentVal = selectedName !== null ? selectedName : presetSelect.value;
    presetSelect.innerHTML = '<option value="">-- 選択してください --</option>';
    this.presets.forEach(p => {
      const option = document.createElement('option');
      option.value = p.name;
      option.textContent = p.name;
      presetSelect.appendChild(option);
    });

    if (selectedName !== null) {
         presetSelect.value = selectedName;
    } else if (currentVal && this.presets.some(p => p.name === currentVal)) {
         presetSelect.value = currentVal;
    }

    this.updateButtons();
  },

  updateButtons() {
    if (deletePresetButton) {
        deletePresetButton.disabled = !presetSelect.value;
    }
  }
};

const initializePresets = () => {
  PresetManager.init();

  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      const name = presetSelect.value;
      PresetManager.updateButtons();
      if (!name) return;

      const preset = PresetManager.getPreset(name);
      if (preset && preset.settings) {
        const s = preset.settings;
        if (s.setCount) setCountInput.value = s.setCount;
        if (s.repCount) repCountInput.value = s.repCount;
        if (s.downDuration) downDurationInput.value = s.downDuration;
        if (s.holdDuration) holdDurationInput.value = s.holdDuration;
        if (s.upDuration) upDurationInput.value = s.upDuration;
        if (s.restDuration) restDurationInput.value = s.restDuration;
        if (s.countdownDuration) countdownDurationInput.value = s.countdownDuration;

        // Trigger input events to validate and save current settings
        setCountInput.dispatchEvent(new Event('input'));
        setCountInput.dispatchEvent(new Event('change'));
      }
    });
  }

  if (savePresetButton) {
    savePresetButton.addEventListener('click', () => {
      const name = prompt('プリセット名を入力してください', presetSelect.value || '');
      if (name) {
        const settings = {
          setCount: setCountInput.value,
          repCount: repCountInput.value,
          downDuration: downDurationInput.value,
          holdDuration: holdDurationInput.value,
          upDuration: upDurationInput.value,
          restDuration: restDurationInput.value,
          countdownDuration: countdownDurationInput.value,
        };
        PresetManager.addPreset(name, settings);
      }
    });
  }

  if (deletePresetButton) {
    deletePresetButton.addEventListener('click', () => {
      const name = presetSelect.value;
      if (!name) return;
      if (confirm(`プリセット「${name}」を削除しますか？`)) {
        PresetManager.deletePreset(name);
      }
    });
  }
};

const validateInput = (input) => {
  const isValid = input.checkValidity() && input.value !== '';
  if (isValid) {
    input.classList.remove('input-error');
  } else {
    input.classList.add('input-error');
  }
  return isValid;
};

const areAllInputsValid = () => {
  const inputs = [
    setCountInput,
    repCountInput,
    downDurationInput,
    holdDurationInput,
    upDurationInput,
    restDurationInput,
    countdownDurationInput,
  ];
  return inputs.every((input) => validateInput(input));
};

const updateStartButtonAvailability = () => {
  const valid = areAllInputsValid();
  if (!workoutStarted) {
    startButton.disabled = !valid;
  }
};

const saveWorkoutSettings = () => {
  if (!isStorageAvailable) return;
  if (!areAllInputsValid()) return;

  const settings = {
    setCount: setCountInput.value,
    repCount: repCountInput.value,
    downDuration: downDurationInput.value,
    holdDuration: holdDurationInput.value,
    upDuration: upDurationInput.value,
    restDuration: restDurationInput.value,
    countdownDuration: countdownDurationInput.value,
  };

  try {
    localStorage.setItem(WORKOUT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    // Ignore errors
  }
};

const loadWorkoutSettings = () => {
  if (!isStorageAvailable) return;

  try {
    const raw = localStorage.getItem(WORKOUT_SETTINGS_KEY);
    if (!raw) return;

    const settings = JSON.parse(raw);
    if (!settings || typeof settings !== 'object') return;

    if (settings.setCount) setCountInput.value = settings.setCount;
    if (settings.repCount) repCountInput.value = settings.repCount;
    if (settings.downDuration) downDurationInput.value = settings.downDuration;
    if (settings.holdDuration) holdDurationInput.value = settings.holdDuration;
    if (settings.upDuration) upDurationInput.value = settings.upDuration;
    if (settings.restDuration) restDurationInput.value = settings.restDuration;
    if (settings.countdownDuration) countdownDurationInput.value = settings.countdownDuration;
  } catch (error) {
    // Ignore errors
  }
};

const initializeWorkoutSettings = () => {
  loadWorkoutSettings();

  const inputs = [
    setCountInput,
    repCountInput,
    downDurationInput,
    holdDurationInput,
    upDurationInput,
    restDurationInput,
    countdownDurationInput,
  ];

  inputs.forEach((input) => {
    if (input) {
      input.addEventListener('input', () => {
        validateInput(input);
        updateStartButtonAvailability();
      });
      input.addEventListener('change', () => {
        if (validateInput(input)) {
          saveWorkoutSettings();
        }
        updateStartButtonAvailability();
      });
    }
    if (input) {
      validateInput(input);
    }
  });
  updateStartButtonAvailability();
};

const sanitizeHistoryEntries = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const id = typeof entry.id === 'string' ? entry.id : null;
      const date = typeof entry.date === 'string' ? entry.date : null;
      const totalSets = Number(entry.totalSets);
      const repsPerSet = Number(entry.repsPerSet);
      const totalReps = Number(entry.totalReps);
      if (!id || !date || !Number.isFinite(totalSets) || !Number.isFinite(repsPerSet) || !Number.isFinite(totalReps)) {
        return null;
      }
      const durations = entry.durations && typeof entry.durations === 'object' ? entry.durations : {};
      return {
        id,
        date,
        totalSets,
        repsPerSet,
        totalReps,
        durations: {
          down: Number(durations.down) || 0,
          hold: Number(durations.hold) || 0,
          up: Number(durations.up) || 0,
          rest: Number(durations.rest) || 0,
          countdown: Number(durations.countdown) || 0,
        },
      };
    })
    .filter(Boolean);
};

const loadHistoryEntries = () => {
  if (!isStorageAvailable) {
    return [];
  }
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeHistoryEntries(parsed);
    if (sanitized.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
      saveHistoryEntries(sanitized);
    }
    return sanitized;
  } catch (error) {
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }
};

const saveHistoryEntries = (entries) => {
  if (!isStorageAvailable) {
    return false;
  }
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    return false;
  }
};

const computeStats = (entries) => {
  const totalWorkouts = entries.length;
  const totalRepsAllTime = entries.reduce((sum, entry) => sum + entry.totalReps, 0);
  const lastEntry = entries[0];
  return {
    totalWorkouts,
    totalRepsAllTime,
    lastWorkoutDate: lastEntry ? lastEntry.date : null,
    lastWorkoutTotalReps: lastEntry ? lastEntry.totalReps : 0,
  };
};

const formatDate = (isoString) => {
  if (!isoString) {
    return '--';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

const getLocalDateKey = (date = new Date()) => {
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayOfYear = (date = new Date()) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const computeStreak = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return 0;
  }
  const dateKeys = new Set(
    entries
      .map((entry) => getLocalDateKey(new Date(entry.date)))
      .filter((value) => value)
  );
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = getLocalDateKey(cursor);
    if (!key || !dateKeys.has(key)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const updateHistoryNote = () => {
  if (!historyNote) {
    return;
  }
  historyNote.textContent = isStorageAvailable
    ? '最新の記録を最大5件表示します。'
    : 'この端末では履歴の自動保存が利用できません。';
};

const renderStats = () => {
  if (!statsTotalReps || !statsTotalWorkouts || !statsLastDate || !statsRank) {
    return;
  }
  const stats = computeStats(historyEntries);
  statsTotalReps.textContent = stats.totalRepsAllTime.toLocaleString('ja-JP');
  statsTotalWorkouts.textContent = stats.totalWorkouts.toLocaleString('ja-JP');
  statsLastDate.textContent = stats.lastWorkoutDate ? formatDate(stats.lastWorkoutDate) : '--';

  // Use Level and AP instead of Rank
  const level = RpgSystem.calculateLevel(stats.totalRepsAllTime);
  const ap = RpgSystem.calculateAttackPower(level);
  statsRank.textContent = `Lv.${level} (AP:${ap})`;
};

const renderHistory = () => {
  if (!historyList) {
    return;
  }
  historyList.textContent = '';
  if (historyEntries.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'history-empty';
    emptyItem.textContent = 'まだ記録がありません';
    historyList.appendChild(emptyItem);
    return;
  }
  historyEntries.slice(0, 5).forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    const date = document.createElement('div');
    date.className = 'history-date';
    date.textContent = formatDate(entry.date);

    const meta = document.createElement('div');
    meta.className = 'history-meta';
    meta.textContent = `${entry.totalSets}セット × ${entry.repsPerSet}回`;

    const total = document.createElement('div');
    total.className = 'history-total';
    total.textContent = `${entry.totalReps}回`;

    item.append(date, meta, total);
    historyList.appendChild(item);
  });
};

const getPlannedTargetReps = () => {
  const sets = Number.parseInt(setCountInput.value, 10);
  const reps = Number.parseInt(repCountInput.value, 10);
  if (!Number.isFinite(sets) || !Number.isFinite(reps)) {
    return 0;
  }
  return Math.max(sets, 0) * Math.max(reps, 0);
};

const getSessionTargetReps = () => (workoutStarted ? totalSets * repsPerSet : getPlannedTargetReps());

const getCompletedReps = () => {
  if (!workoutStarted) {
    return 0;
  }
  if (currentPhase === Phase.FINISHED) {
    return getSessionTargetReps();
  }
  const completed = (currentSet - 1) * repsPerSet + (currentRep - 1);
  return Math.max(Math.min(completed, getSessionTargetReps()), 0);
};

const updateSessionStats = () => {
  if (!statsSessionReps || !statsSessionTarget) {
    return;
  }
  statsSessionReps.textContent = getCompletedReps().toLocaleString('ja-JP');
  statsSessionTarget.textContent = getSessionTargetReps().toLocaleString('ja-JP');
};

const updateActionButtonStates = () => {
  if (!startButton || !pauseButton) {
    return;
  }
  startButton.setAttribute('aria-pressed', workoutStarted ? 'true' : 'false');
  pauseButton.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
};

const applyReducedMotionPreference = () => {
  if (!prefersReducedMotion) {
    return;
  }
  document.body.classList.toggle('reduced-motion', prefersReducedMotion.matches);
};

const createHistoryEntry = () => {
  const durations = {
    down: Number.parseInt(downDurationInput.value, 10),
    hold: Number.parseInt(holdDurationInput.value, 10),
    up: Number.parseInt(upDurationInput.value, 10),
    rest: Number.parseInt(restDurationInput.value, 10),
    countdown: Number.parseInt(countdownDurationInput.value, 10),
  };
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: new Date().toISOString(),
    totalSets,
    repsPerSet,
    totalReps: totalSets * repsPerSet,
    durations,
  };
};

const recordWorkout = () => {
  if (workoutSaved) {
    return;
  }
  const entry = createHistoryEntry();
  historyEntries = [entry, ...historyEntries].slice(0, MAX_HISTORY_ENTRIES);
  saveHistoryEntries(historyEntries);
  workoutSaved = true;
  renderStats();
  renderHistory();
  renderHeatmap();
};

const runTests = () => {
  const sample = sanitizeHistoryEntries([
    {
      id: '1',
      date: '2024-01-02T00:00:00.000Z',
      totalSets: 3,
      repsPerSet: 10,
      totalReps: 30,
      durations: { down: 2, hold: 1, up: 1, rest: 30, countdown: 5 },
    },
  ]);
  console.assert(sample.length === 1, 'sanitizeHistoryEntries should keep valid entries');
  console.assert(computeStats(sample).totalRepsAllTime === 30, 'computeStats should sum reps');
  console.assert(formatDate('2024-01-02T00:00:00.000Z') === '2024/01/02', 'formatDate should format date');
  console.log('Test run completed.');
};

const updateDisplays = () => {
  setDisplay.textContent = `${currentSet} / ${totalSets}`;
  repDisplay.textContent = `${currentRep} / ${repsPerSet}`;
  phaseDisplay.textContent = currentPhase;
  updateSessionStats();
};

const updateTimerUI = () => {
  if (!phaseDuration) {
    phaseTimer.textContent = '--';
    progressBar.style.width = '0%';
    return;
  }
  const elapsed = Math.min(Date.now() - phaseStart, phaseDuration);
  const remaining = Math.max(phaseDuration - elapsed, 0);
  phaseTimer.textContent = String(Math.ceil(remaining / 1000)).padStart(2, '0');
  progressBar.style.width = `${(elapsed / phaseDuration) * 100}%`;
};

let heatmapTooltip = null;

const renderHeatmap = () => {
  if (!heatmapContainer) return;
  heatmapContainer.innerHTML = '';

  if (!heatmapTooltip) {
    heatmapTooltip = document.createElement('div');
    heatmapTooltip.className = 'heatmap-tooltip';
    document.body.appendChild(heatmapTooltip);
  }

  const grid = document.createElement('div');
  grid.className = 'heatmap-grid';

  const dataMap = new Map();
  historyEntries.forEach((entry) => {
    const key = getLocalDateKey(new Date(entry.date));
    if (key) {
      dataMap.set(key, (dataMap.get(key) || 0) + entry.totalReps);
    }
  });

  const today = new Date();
  const dayOfWeek = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (26 * 7) - dayOfWeek);

  const cursor = new Date(startDate);
  const daysToRender = [];

  while (cursor <= today || cursor.getDay() !== 0) {
    if (cursor > today && cursor.getDay() === 0) break;
    daysToRender.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  daysToRender.forEach((date) => {
    const key = getLocalDateKey(date);
    const count = dataMap.get(key) || 0;

    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';

    let level = 0;
    if (count > 0) level = 1;
    if (count >= 30) level = 2;
    if (count >= 60) level = 3;
    if (count >= 100) level = 4;

    cell.dataset.level = level;
    cell.dataset.date = key || '';
    cell.dataset.count = count;

    const showTooltip = () => {
      if (!key) return;
      const rect = cell.getBoundingClientRect();
      const dateStr = formatDate(date.toISOString());
      heatmapTooltip.textContent = `${dateStr}: ${count}回`;
      heatmapTooltip.classList.add('visible');

      const tooltipWidth = heatmapTooltip.offsetWidth;
      heatmapTooltip.style.top = `${rect.top - 34 + window.scrollY}px`;
      heatmapTooltip.style.left = `${rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX}px`;
    };

    const hideTooltip = () => {
      heatmapTooltip.classList.remove('visible');
    };

    cell.addEventListener('mouseenter', showTooltip);
    cell.addEventListener('mouseleave', hideTooltip);
    cell.addEventListener('touchstart', () => {
      showTooltip();
      setTimeout(hideTooltip, 2500);
    }, { passive: true });

    grid.appendChild(cell);
  });

  heatmapContainer.appendChild(grid);
  requestAnimationFrame(() => {
    heatmapContainer.scrollLeft = heatmapContainer.scrollWidth;
  });
};

const initializeHistory = () => {
  historyEntries = loadHistoryEntries();
  renderStats();
  renderHistory();
  renderHeatmap();
  updateHistoryNote();
  updateSessionStats();
};

const ACHIEVEMENTS_KEY = 'squat-tracker-achievements';

const showToast = ({ emoji, title, message, sound = true }) => {
  const existing = document.querySelectorAll('.achievement-toast');
  const offset = existing.length * 90; // Approx height + gap

  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.style.top = `${20 + offset}px`;
  toast.innerHTML = `
    <div class="toast-icon">${emoji}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  document.body.appendChild(toast);

  if (sound) {
    if (typeof playCelebration === 'function') {
      setTimeout(() => playCelebration(), 300);
    }
    if (typeof VoiceCoach !== 'undefined') {
      VoiceCoach.speak(`${title}。${message}`);
    }
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.5s ease-in';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
};

if (typeof window !== 'undefined') {
  window.showToast = showToast;
}

const AchievementSystem = {
  badges: [],
  unlocked: {},

  init() {
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

        if (tab.dataset.tab === 'history' && typeof renderHeatmap === 'function') {
             requestAnimationFrame(() => renderHeatmap());
        }
      });
    });
  },

  defineBadges() {
    this.badges = [
      // Consistency
      { id: 'baby-steps', name: '初めの一歩', emoji: '🐣', description: '初めてワークアウトを完了する', condition: (ctx) => (ctx.historyEntries || historyEntries).length >= 1 },
      { id: 'consistency-3', name: '三日坊主回避', emoji: '🌱', description: '3日連続達成', condition: (ctx) => computeStreak(ctx.historyEntries || historyEntries) >= 3 },
      { id: 'consistency-7', name: '週間チャンピオン', emoji: '🔥', description: '7日連続達成', condition: (ctx) => computeStreak(ctx.historyEntries || historyEntries) >= 7 },
      { id: 'consistency-30', name: '習慣の達人', emoji: '📅', description: '30日連続達成', condition: (ctx) => computeStreak(ctx.historyEntries || historyEntries) >= 30 },
      { id: 'consistency-100', name: '百日修業', emoji: '💯', description: '100日連続達成', condition: (ctx) => computeStreak(ctx.historyEntries || historyEntries) >= 100 },

      // Total Reps
      { id: 'reps-100', name: 'スクワット初心者', emoji: '🥉', description: '累計100回', condition: (ctx) => computeStats(ctx.historyEntries || historyEntries).totalRepsAllTime >= 100 },
      { id: 'reps-500', name: '見習い戦士', emoji: '🥈', description: '累計500回', condition: (ctx) => computeStats(ctx.historyEntries || historyEntries).totalRepsAllTime >= 500 },
      { id: 'reps-1000', name: '熟練の騎士', emoji: '🥇', description: '累計1,000回', condition: (ctx) => computeStats(ctx.historyEntries || historyEntries).totalRepsAllTime >= 1000 },
      { id: 'reps-5000', name: '筋肉の将軍', emoji: '🎖️', description: '累計5,000回', condition: (ctx) => computeStats(ctx.historyEntries || historyEntries).totalRepsAllTime >= 5000 },
      { id: 'reps-10000', name: '伝説の英雄', emoji: '👑', description: '累計10,000回', condition: (ctx) => computeStats(ctx.historyEntries || historyEntries).totalRepsAllTime >= 10000 },

      // Boss
      { id: 'boss-first-blood', name: 'モンスターハンター', emoji: '🗡️', description: '初めてボスを倒す', condition: (ctx) => ctx.bossState && ctx.bossState.totalKills >= 1 },
      { id: 'boss-slayer', name: 'スレイヤー', emoji: '💀', description: 'ボス10体討伐', condition: (ctx) => ctx.bossState && ctx.bossState.totalKills >= 10 },
      { id: 'boss-collector', name: '図鑑コンプ', emoji: '📚', description: '全種類のボスを討伐', condition: (ctx) => ctx.bossState && ctx.bossState.totalKills >= 10 },
      { id: 'boss-critical', name: 'クリティカル', emoji: '💥', description: 'クリティカルヒットを出す', condition: () => false },
      { id: 'boss-limit-break', name: '限界突破', emoji: '🚀', description: 'レベル10到達', condition: (ctx) => RpgSystem.calculateLevel(computeStats(ctx.historyEntries || historyEntries).totalRepsAllTime) >= 10 },

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
      historyEntries,
      bossState: typeof BossBattle !== 'undefined' ? BossBattle.state : null,
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

if (typeof window !== 'undefined') {
  window.AchievementSystem = AchievementSystem;
}

const performAttack = () => {
  const stats = computeStats(historyEntries);
  const level = RpgSystem.calculateLevel(stats.totalRepsAllTime);
  const baseAp = RpgSystem.calculateAttackPower(level);
  const weaponBonus = typeof InventoryManager !== 'undefined' ? InventoryManager.getAttackBonus() : 0;
  const damage = RpgSystem.calculateDamage(baseAp + weaponBonus);
  BossBattle.damage(damage.amount, damage.isCritical);
};

const setPhase = (phaseKey, durationSeconds, hint) => {
  currentPhase = phaseKey;
  phaseDuration = durationSeconds * 1000;
  phaseStart = Date.now();
  phaseHint.textContent = hint;
  updateQuizDisplay(phaseKey);
  updateDisplays();
  updateTimerUI();
  lastCountdownSecond = null;
  if (!isCountdownPhase(phaseKey)) {
    const phaseFrequency = phaseBeepFrequencies[phaseKey];
    beep(phaseFrequency ?? 880);

    if (phaseKey === Phase.DOWN) VoiceCoach.speak('しゃがんで');
    else if (phaseKey === Phase.HOLD) VoiceCoach.speak('キープ');
    else if (phaseKey === Phase.UP) VoiceCoach.speak('立って');
    else if (phaseKey === Phase.REST) VoiceCoach.speak('休憩です。深呼吸しましょう');
  }
};

const nextRepOrSet = () => {
  if (currentRep < repsPerSet) {
    currentRep += 1;
    startPhaseCycle();
    return;
  }
  if (currentSet < totalSets) {
    currentSet += 1;
    currentRep = 1;
    startRest();
    return;
  }
  finishWorkout();
};

const startPhaseCycle = () => {
  const [downPhase, holdPhase, upPhase] = phases;
  setPhase(Phase.DOWN, downPhase.duration(), '2秒かけてしゃがみます');
  schedulePhase(() => {
    setPhase(Phase.HOLD, holdPhase.duration(), '1秒キープ');
    schedulePhase(() => {
      setPhase(Phase.UP, upPhase.duration(), '1秒で立ちます');
      schedulePhase(() => {
        performAttack();
        nextRepOrSet();
      }, upPhase.duration());
    }, holdPhase.duration());
  }, downPhase.duration());
};

const schedulePhase = (callback, durationSeconds) => {
  workoutTimer.schedule(durationSeconds, callback);
};

const startCountdown = (label, callback) => {
  const countdownSeconds = parseInt(countdownDurationInput.value, 10);
  setPhase(Phase.COUNTDOWN, countdownSeconds, label);
  schedulePhase(callback, countdownSeconds);
};

const startRest = () => {
  const restSeconds = parseInt(restDurationInput.value, 10);
  setPhase(Phase.REST, restSeconds, '休憩中');
  schedulePhase(() => {
    setPhase(Phase.REST_COUNTDOWN, parseInt(countdownDurationInput.value, 10), '再開までカウントダウン');
    schedulePhase(() => {
      startPhaseCycle();
    }, parseInt(countdownDurationInput.value, 10));
  }, restSeconds);
};

const finishWorkout = () => {
  currentPhase = Phase.FINISHED;
  phaseDuration = null;
  isPaused = false;
  phaseHint.textContent = 'お疲れさまでした！';
  updateQuizDisplay(Phase.FINISHED);
  updateDisplays();
  phaseTimer.textContent = '00';
  progressBar.style.width = '100%';
  playCelebration();
  VoiceCoach.speak('お疲れ様でした！ナイスファイト');
  recordWorkout();

  if (typeof AchievementSystem !== 'undefined') {
    const settings = {
      setCount: setCountInput.value,
      repCount: repCountInput.value,
      downDuration: downDurationInput.value,
      holdDuration: holdDurationInput.value,
      upDuration: upDurationInput.value,
      restDuration: restDurationInput.value,
      countdownDuration: countdownDurationInput.value,
    };
    AchievementSystem.check({ type: 'finish', settings, sensorMode, hasPaused });
  }

  if (typeof DailyMissionSystem !== 'undefined') {
    DailyMissionSystem.check({
      type: 'finish',
      totalReps: totalSets * repsPerSet,
      totalSets: totalSets
    });
  }

  launchConfetti();
  updateActionButtonStates();
};

if (typeof window !== 'undefined') {
  window.finishWorkout = finishWorkout;
}

const tick = () => {
  if (!phaseDuration || isPaused) {
    return;
  }
  updateTimerUI();
  if (isCountdownPhase(currentPhase)) {
    const elapsed = Math.min(Date.now() - phaseStart, phaseDuration);
    const remaining = Math.max(phaseDuration - elapsed, 0);
    const remainingSeconds = Math.ceil(remaining / 1000);
    if (remainingSeconds !== lastCountdownSecond) {
      lastCountdownSecond = remainingSeconds;
      beep(988, 140);
      if (remainingSeconds <= 3 && remainingSeconds >= 1) {
        VoiceCoach.speak(String(remainingSeconds));
      }
    }
  }
  if (Date.now() - phaseStart >= phaseDuration) {
    updateTimerUI();
  }
};

const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
};

const validateWorkoutInputs = () => {
  const totalSetsValue = parsePositiveInt(setCountInput.value);
  const repsPerSetValue = parsePositiveInt(repCountInput.value);
  const downSeconds = parsePositiveInt(downDurationInput.value);
  const holdSeconds = parsePositiveInt(holdDurationInput.value);
  const upSeconds = parsePositiveInt(upDurationInput.value);
  const restSeconds = parsePositiveInt(restDurationInput.value);
  const countdownSeconds = parsePositiveInt(countdownDurationInput.value);

  if (
    !totalSetsValue
    || !repsPerSetValue
    || !downSeconds
    || !holdSeconds
    || !upSeconds
    || !restSeconds
    || !countdownSeconds
  ) {
    phaseHint.textContent = '入力値が不正です。セット数・回数・各秒数は1以上で入力してください。';
    return null;
  }

  return {
    totalSetsValue,
    repsPerSetValue,
  };
};

const startWorkout = () => {
  ensureAudioContext();
  if (workoutStarted || currentPhase !== Phase.IDLE) {
    return;
  }
  const validatedInputs = validateWorkoutInputs();
  if (!validatedInputs) {
    return;
  }
  totalSets = validatedInputs.totalSetsValue;
  repsPerSet = validatedInputs.repsPerSetValue;
  currentSet = 1;
  currentRep = 1;
  isPaused = false;
  workoutStarted = true;
  workoutSaved = false;
  startButton.disabled = true;
  startButton.textContent = '進行中';
  updateActionButtonStates();
  updateSessionStats();
  VoiceCoach.speak('準備して。スタートします');
  startCountdown('スタートまでカウントダウン', () => {
    startPhaseCycle();
  });
};

const pauseWorkout = () => {
  if (currentPhase === Phase.IDLE || currentPhase === Phase.FINISHED) {
    return;
  }
  isPaused = !isPaused;
  if (isPaused) {
    hasPaused = true;
    pausedAt = Date.now();
    phaseHint.textContent = '一時停止中';
    pauseButton.textContent = '再開';
    workoutTimer.pause();
  } else {
    const pausedDuration = Date.now() - pausedAt;
    phaseStart += pausedDuration;
    pauseButton.textContent = '一時停止';
    workoutTimer.resume();
  }
  updateActionButtonStates();
};

const resetWorkout = () => {
  workoutTimer.cancel();
  phaseDuration = null;
  currentPhase = Phase.IDLE;
  updateQuizDisplay(Phase.IDLE);
  currentSet = 1;
  currentRep = 1;
  isPaused = false;
  hasPaused = false;
  workoutStarted = false;
  workoutSaved = false;
  startButton.disabled = false;
  startButton.textContent = 'スタート';
  pauseButton.textContent = '一時停止';
  updateActionButtonStates();
  phaseTimer.textContent = '05';
  phaseHint.textContent = 'スタートまでカウントダウン';
  progressBar.style.width = '0%';
  updateDisplays();
  stopConfetti();
};

const timerInterval = setInterval(tick, 100);

startButton.addEventListener('click', () => {
  if (sensorMode) {
    sensorStatus.textContent = 'センサーモードではタイマーを併用できます。';
  }
  startWorkout();
});

pauseButton.addEventListener('click', pauseWorkout);
resetButton.addEventListener('click', resetWorkout);
setCountInput.addEventListener('input', updateSessionStats);
repCountInput.addEventListener('input', updateSessionStats);
if (themeToggle) {
  themeToggle.addEventListener('change', (event) => {
    const theme = event.target.checked ? 'dark' : 'light';
    applyTheme(theme);
    persistTheme(theme);
    if (typeof AchievementSystem !== 'undefined') {
      AchievementSystem.notify('theme_change');
    }
  });
}

if (voiceToggle) {
  voiceToggle.addEventListener('change', (event) => {
    const enabled = event.target.checked;
    VoiceCoach.setEnabled(enabled);
    if (voiceStatus) {
      voiceStatus.textContent = enabled ? 'ON' : 'OFF';
    }
    if (isStorageAvailable) {
      localStorage.setItem(VOICE_COACH_KEY, String(enabled));
    }
    // モバイルの制限解除のため、ユーザー操作時に空の音声を再生しておく
    if (enabled) {
      VoiceCoach.speak('');
    }
  });
}
if (prefersReducedMotion) {
  prefersReducedMotion.addEventListener('change', applyReducedMotionPreference);
}

document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented) {
    return;
  }
  const key = event.key;
  if (key !== ' ' && key !== 'Enter') {
    return;
  }
  const target = event.target;
  if (target instanceof HTMLElement) {
    const tagName = target.tagName;
    if (
      tagName === 'INPUT'
      || tagName === 'TEXTAREA'
      || tagName === 'SELECT'
      || tagName === 'BUTTON'
      || target.isContentEditable
    ) {
      return;
    }
  }
  event.preventDefault();
  if (currentPhase === Phase.IDLE && !workoutStarted) {
    startWorkout();
    return;
  }
  if (currentPhase !== Phase.FINISHED) {
    pauseWorkout();
  }
});

const handleOrientation = (event) => {
  if (!sensorMode || !sensorActive) {
    return;
  }

  // Throttle sensor updates to ~20Hz (50ms) to reduce CPU usage and battery drain
  const now = Date.now();
  if (now - lastOrientationTime < 50) {
    return;
  }
  lastOrientationTime = now;

  const beta = event.beta;
  if (beta === null || beta === undefined) {
    sensorStatus.textContent = '角度データを取得できません。';
    return;
  }
  if (sensorBaseline === null) {
    sensorBaseline = beta;
    sensorThreshold = beta - 60;
    sensorStatus.textContent = `基準角度を記録しました: ${Math.round(beta)}°`;
  }

  const depthReached = beta <= sensorThreshold;
  if (depthReached && !lastSensorCounted) {
    lastSensorCounted = true;
    currentRep = Math.min(currentRep + 1, repsPerSet);
    repDisplay.textContent = `${currentRep} / ${repsPerSet}`;
    updateSessionStats();
    beep(700, 120);
    performAttack(); // Updated to use performAttack helper
    if (currentRep >= repsPerSet) {
      nextRepOrSet();
      lastSensorCounted = false;
    }
  }

  if (!depthReached) {
    lastSensorCounted = false;
  }
};

const enableSensor = async () => {
  if (typeof DeviceOrientationEvent === 'undefined') {
    sensorStatus.textContent = 'この端末ではセンサーを利用できません。';
    sensorToggle.checked = false;
    sensorMode = false;
    return;
  }
  if (DeviceOrientationEvent.requestPermission) {
    const permission = await DeviceOrientationEvent.requestPermission();
    if (permission !== 'granted') {
      sensorStatus.textContent = 'センサー利用が許可されませんでした。';
      sensorToggle.checked = false;
      sensorMode = false;
      return;
    }
  }
  sensorMode = true;
  sensorActive = true;
  sensorBaseline = null;
  sensorThreshold = null;
  lastSensorCounted = false;
  sensorCalibrateButton.disabled = false;
  sensorStatus.textContent = 'センサー準備完了。逆さまに固定してしゃがむとカウントされます。';
  window.addEventListener('deviceorientation', handleOrientation);
};

const disableSensor = () => {
  sensorMode = false;
  sensorActive = false;
  sensorBaseline = null;
  sensorThreshold = null;
  lastSensorCounted = false;
  sensorCalibrateButton.disabled = true;
  sensorStatus.textContent = '未使用';
  window.removeEventListener('deviceorientation', handleOrientation);
};

sensorToggle.addEventListener('change', (event) => {
  if (event.target.checked) {
    enableSensor();
  } else {
    disableSensor();
  }
});

sensorCalibrateButton.addEventListener('click', () => {
  sensorBaseline = null;
  sensorThreshold = null;
  lastSensorCounted = false;
  sensorStatus.textContent = '角度を再計測します。逆さまに固定して数秒待ってください。';
});

const launchConfetti = () => {
  if (!confettiCanvas) {
    return;
  }
  const ctx = ensureConfettiContext();
  if (!ctx) {
    return;
  }
  const pixelRatio = window.devicePixelRatio || 1;
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const reduceMotion = (prefersReducedMotion && prefersReducedMotion.matches)
    || document.body.classList.contains('reduced-motion');
  const pieceCount = reduceMotion ? 40 : 120;
  const maxFrames = reduceMotion ? 120 : 240;
  confettiCanvas.width = Math.floor(canvasWidth * pixelRatio);
  confettiCanvas.height = Math.floor(canvasHeight * pixelRatio);
  confettiCanvas.style.width = '100%';
  confettiCanvas.style.height = '100%';
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  confettiCanvas.classList.add('active');
  const pieces = Array.from({ length: pieceCount }).map(() => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * -canvasHeight,
    size: 6 + Math.random() * 6,
    speed: (reduceMotion ? 1 : 2) + Math.random() * (reduceMotion ? 2 : 4),
    color: `hsl(${Math.random() * 360}, 80%, 60%)`,
  }));

  let frame = 0;
  const draw = () => {
    frame += 1;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    pieces.forEach((piece) => {
      piece.y += piece.speed;
      piece.x += Math.sin((piece.y + frame) / 20);
      ctx.fillStyle = piece.color;
      ctx.fillRect(piece.x, piece.y, piece.size, piece.size);
      if (piece.y > canvasHeight) {
        piece.y = -20;
      }
    });
    if (frame < maxFrames) {
      requestAnimationFrame(draw);
    } else {
      stopConfetti();
    }
  };
  draw();
};

const stopConfetti = () => {
  if (!confettiCanvas) {
    return;
  }
  const ctx = ensureConfettiContext();
  if (!ctx) {
    return;
  }
  confettiCanvas.classList.remove('active');
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
};

runTests();
applyReducedMotionPreference();
initializeTheme();
initializeVoiceCoach();
initializeWorkoutSettings();
initializePresets();
initializeHistory();
AchievementSystem.init();
DataManager.init();
InventoryManager.init(); // Initialize Inventory
DailyMissionSystem.init(); // Initialize Daily Missions
// BossBattle.init(); // Moved to DOMContentLoaded
updateDisplays();
updateActionButtonStates();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BossBattle.init());
} else {
  BossBattle.init();
}
