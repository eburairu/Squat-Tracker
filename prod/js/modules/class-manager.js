import { showToast, isStorageAvailable } from '../utils.js';

const CLASS_KEY = 'squat-tracker-class';
const MASTERY_KEY = 'squat-tracker-class-mastery';

const MASTERY_THRESHOLDS = [
  0,    // Lv1
  100,  // Lv2
  300,  // Lv3
  600,  // Lv4
  1000, // Lv5
  1500, // Lv6
  2100, // Lv7
  2800, // Lv8
  3600, // Lv9
  4500  // Lv10 (MAX)
];

const ClassManager = {
  classes: [],
  currentClassId: 'novice',
  masteryData: {},
  elements: {
    modal: null,
    triggerBtn: null,
    listContainer: null,
    closeBtn: null,
    currentClassIcon: null
  },

  init(classesData) {
    if (!classesData || !Array.isArray(classesData)) {
      console.error('Invalid classes data');
      return;
    }
    this.classes = classesData;

    // Load saved class
    if (isStorageAvailable) {
      const saved = localStorage.getItem(CLASS_KEY);
      if (saved && this.classes.find(c => c.id === saved)) {
        this.currentClassId = saved;
      }
    }

    this.loadMasteryData();

    // Bind DOM elements (will be called after DOMContentLoaded via init)
    this.elements.modal = document.getElementById('class-modal');
    this.elements.triggerBtn = document.getElementById('open-class-settings');
    this.elements.listContainer = document.getElementById('class-list');
    this.elements.closeBtn = document.getElementById('close-class-modal');
    this.elements.currentClassIcon = document.getElementById('current-class-icon'); // HUD icon

    this.setupEventListeners();
    this.updateUI();
  },

  loadMasteryData() {
    if (!isStorageAvailable) {
      this.masteryData = {};
      return;
    }
    try {
      const raw = localStorage.getItem(MASTERY_KEY);
      this.masteryData = raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('Failed to load mastery data', e);
      this.masteryData = {};
    }
  },

  saveMasteryData() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(MASTERY_KEY, JSON.stringify(this.masteryData));
    } catch (e) {
      console.error('Failed to save mastery data', e);
    }
  },

  getLevel(classId) {
    const exp = this.masteryData[classId] || 0;
    // Find the highest level threshold that fits the current exp
    for (let i = MASTERY_THRESHOLDS.length - 1; i >= 0; i--) {
      if (exp >= MASTERY_THRESHOLDS[i]) {
        return i + 1; // Index 0 is Lv1
      }
    }
    return 1;
  },

  getExpProgress(classId) {
    const exp = this.masteryData[classId] || 0;
    const level = this.getLevel(classId);

    // Max Level Check
    if (level >= MASTERY_THRESHOLDS.length) {
      return {
        current: exp,
        next: null,
        percent: 100,
        isMax: true
      };
    }

    const currentThreshold = MASTERY_THRESHOLDS[level - 1];
    const nextThreshold = MASTERY_THRESHOLDS[level];

    const range = nextThreshold - currentThreshold;
    const progress = exp - currentThreshold;
    const percent = Math.min(100, Math.max(0, (progress / range) * 100));

    return {
      current: exp,
      next: nextThreshold,
      percent: percent,
      isMax: false,
      needed: nextThreshold - exp
    };
  },

  addExperience(classId, amount) {
    if (!classId || amount <= 0) return null;

    const oldLevel = this.getLevel(classId);
    const currentExp = this.masteryData[classId] || 0;
    const newExp = currentExp + amount;

    this.masteryData[classId] = newExp;
    this.saveMasteryData();

    const newLevel = this.getLevel(classId);

    if (newLevel > oldLevel) {
      const cls = this.classes.find(c => c.id === classId);
      if (cls) {
        showToast({
          emoji: '🆙',
          title: 'Class Level Up!',
          message: `${cls.name}が Lv.${newLevel} になりました！`,
          sound: true
        });
      }
      return { leveledUp: true, oldLevel, newLevel };
    }

    return { leveledUp: false, oldLevel, newLevel };
  },

  setupEventListeners() {
    if (this.elements.triggerBtn) {
      this.elements.triggerBtn.addEventListener('click', () => {
        this.renderList();
        this.openModal();
      });
    }

    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // Close on click outside
    if (this.elements.modal) {
      this.elements.modal.addEventListener('click', (e) => {
        if (e.target === this.elements.modal) {
          this.closeModal();
        }
      });
    }
  },

  openModal() {
    if (this.elements.modal) {
      this.elements.modal.classList.add('active');
      this.elements.modal.setAttribute('aria-hidden', 'false');
    }
  },

  closeModal() {
    if (this.elements.modal) {
      this.elements.modal.classList.remove('active');
      this.elements.modal.setAttribute('aria-hidden', 'true');
    }
  },

  renderList() {
    if (!this.elements.listContainer) return;

    this.elements.listContainer.innerHTML = '';

    this.classes.forEach(cls => {
      const isSelected = cls.id === this.currentClassId;
      const card = document.createElement('div');
      card.className = `class-card ${isSelected ? 'selected' : ''}`;
      card.dataset.id = cls.id;

      // Calculate effect text (now using getModifiers to include level bonus)
      const mods = this.getModifiers(cls.id);
      const level = this.getLevel(cls.id);

      const effects = [];
      if (mods.attackMultiplier > 1.0) {
        effects.push(`攻撃力 x${mods.attackMultiplier.toFixed(2)}`);
      }
      if (mods.quizMultiplier > 1.0) {
        effects.push(`クイズ x${mods.quizMultiplier.toFixed(2)}`);
      }
      if (mods.criticalRateBonus > 0) {
        effects.push(`会心 +${(mods.criticalRateBonus * 100).toFixed(0)}%`);
      }
      if (effects.length === 0) effects.push('特殊効果なし');

      // Calculate progress
      const progress = this.getExpProgress(cls.id);
      let progressHtml = '';

      if (progress.isMax) {
        progressHtml = `
          <div class="mastery-progress-container">
            <div class="mastery-track">
              <div class="mastery-bar" style="width: 100%"></div>
            </div>
            <div class="mastery-info">
              <span>EXP: MAX</span>
              <span class="mastery-max-badge">MASTER</span>
            </div>
          </div>
        `;
      } else {
        progressHtml = `
          <div class="mastery-progress-container">
            <div class="mastery-track">
              <div class="mastery-bar" style="width: ${progress.percent}%"></div>
            </div>
            <div class="mastery-info">
              <span>EXP: ${progress.current} / ${progress.next}</span>
              <span>あと ${progress.needed}回</span>
            </div>
          </div>
        `;
      }

      // Skill info
      const skillHtml = cls.skill ?
        `<div class="class-skill-info">
           <span class="skill-label">必殺技:</span>
           <span class="skill-detail">${cls.skill.emoji} ${cls.skill.name}</span>
           <div class="skill-desc-small">${cls.skill.description}</div>
         </div>` : '';

      card.innerHTML = `
        <div class="class-emoji">${cls.emoji}</div>
        <div class="class-info">
          <div class="class-name">${cls.name} <span class="class-level-badge">Lv.${level}</span></div>
          <div class="class-desc">${cls.description}</div>
          <div class="class-effects">${effects.join(' / ')}</div>
          ${skillHtml}
          ${progressHtml}
        </div>
        ${isSelected ? '<div class="class-selected-badge">選択中</div>' : ''}
      `;

      card.addEventListener('click', () => {
        this.changeClass(cls.id);
      });

      this.elements.listContainer.appendChild(card);
    });
  },

  changeClass(id) {
    if (this.currentClassId === id) return;

    const newClass = this.classes.find(c => c.id === id);
    if (!newClass) return;

    this.currentClassId = id;
    if (isStorageAvailable) {
      localStorage.setItem(CLASS_KEY, id);
    }

    this.updateUI();
    this.renderList(); // Update selection state in list

    const level = this.getLevel(id);
    showToast({
      emoji: newClass.emoji,
      title: 'クラス変更',
      message: `「${newClass.name}」(Lv.${level}) になりました！`
    });
  },

  updateUI() {
    // Update HUD icon if exists
    if (this.elements.currentClassIcon) {
      const cls = this.getCurrentClass();
      if (cls) {
        const level = this.getLevel(cls.id);
        this.elements.currentClassIcon.textContent = cls.emoji;
        // Show Level in tooltip
        this.elements.currentClassIcon.setAttribute('title', `現在のクラス: ${cls.name} (Lv.${level})`);

        // Optionally update text content to show level if space allows,
        // but current UI design only shows emoji.
        // We can add a small badge via CSS if we modify HTML structure later.
      }
    }
  },

  getCurrentClass() {
    return this.classes.find(c => c.id === this.currentClassId) || this.classes[0];
  },

  getModifiers(classId = this.currentClassId) {
    const cls = this.classes.find(c => c.id === classId) || this.classes[0];
    if (!cls) return { attackMultiplier: 1.0, quizMultiplier: 1.0, criticalRateBonus: 0.0 };

    // Clone base modifiers
    const mods = { ...cls.modifiers };

    // Apply Level Bonus
    const level = this.getLevel(classId);
    const bonusLevel = Math.max(0, level - 1);

    // Bonus Logic:
    // Attack: +0.05 per level
    // Quiz: +0.1 per level
    // Critical: +1% (0.01) per level

    mods.attackMultiplier += bonusLevel * 0.05;
    mods.quizMultiplier += bonusLevel * 0.1;
    mods.criticalRateBonus += bonusLevel * 0.01;

    // Round to reasonable precision to avoid floating point errors
    mods.attackMultiplier = Math.round(mods.attackMultiplier * 100) / 100;
    mods.quizMultiplier = Math.round(mods.quizMultiplier * 100) / 100;
    mods.criticalRateBonus = Math.round(mods.criticalRateBonus * 1000) / 1000;

    return mods;
  }
};

export { ClassManager };
