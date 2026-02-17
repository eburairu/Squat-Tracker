import { showToast, isStorageAvailable } from '../utils.js';
import { TitleManager } from './title-manager.js';

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
      let data = raw ? JSON.parse(raw) : {};

      // Migration: Convert number (old format) to object (new format)
      // Old: { "warrior": 100 }
      // New: { "warrior": { exp: 100, unlockedNodes: [] } }
      const migratedData = {};
      let hasMigration = false;

      for (const key in data) {
        if (typeof data[key] === 'number') {
          migratedData[key] = { exp: data[key], unlockedNodes: [] };
          hasMigration = true;
        } else {
          migratedData[key] = data[key];
        }
      }

      this.masteryData = migratedData;
      if (hasMigration) {
        this.saveMasteryData();
      }

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

  // Helper to get raw exp safely
  getExp(classId) {
    const data = this.masteryData[classId];
    if (!data) return 0;
    if (typeof data === 'number') return data; // Should not happen after migration
    return data.exp || 0;
  },

  getUnlockedNodes(classId) {
    const data = this.masteryData[classId];
    if (!data || typeof data !== 'object') return [];
    return data.unlockedNodes || [];
  },

  getLevel(classId) {
    const exp = this.getExp(classId);
    // Find the highest level threshold that fits the current exp
    for (let i = MASTERY_THRESHOLDS.length - 1; i >= 0; i--) {
      if (exp >= MASTERY_THRESHOLDS[i]) {
        return i + 1; // Index 0 is Lv1
      }
    }
    return 1;
  },

  getExpProgress(classId) {
    const exp = this.getExp(classId);
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

    // Initialize if not exists
    if (!this.masteryData[classId]) {
        this.masteryData[classId] = { exp: 0, unlockedNodes: [] };
    }

    const currentExp = this.masteryData[classId].exp;
    const newExp = currentExp + amount;

    this.masteryData[classId].exp = newExp;
    this.saveMasteryData();

    const newLevel = this.getLevel(classId);

    if (newLevel > oldLevel) {
      const cls = this.classes.find(c => c.id === classId);
      if (cls) {
        showToast({
          emoji: '🆙',
          title: 'Class Level Up!',
          message: `${cls.name}が Lv.${newLevel} になりました！\nSPを獲得しました！`,
          sound: true
        });
      }
      return { leveledUp: true, oldLevel, newLevel };
    }

    return { leveledUp: false, oldLevel, newLevel };
  },

  // --- Skill Tree Logic ---

  getSP(classId) {
    const level = this.getLevel(classId);
    const totalSP = Math.max(0, level - 1);

    const unlockedNodes = this.getUnlockedNodes(classId);
    const cls = this.classes.find(c => c.id === classId);

    let usedSP = 0;
    if (cls && cls.skillTree) {
        unlockedNodes.forEach(nodeId => {
            const node = cls.skillTree.find(n => n.id === nodeId);
            if (node) {
                usedSP += node.cost;
            }
        });
    }

    return {
        total: totalSP,
        used: usedSP,
        available: totalSP - usedSP
    };
  },

  unlockNode(classId, nodeId) {
    const cls = this.classes.find(c => c.id === classId);
    if (!cls || !cls.skillTree) return { success: false, reason: 'invalid_class' };

    const node = cls.skillTree.find(n => n.id === nodeId);
    if (!node) return { success: false, reason: 'invalid_node' };

    const sp = this.getSP(classId);
    if (sp.available < node.cost) return { success: false, reason: 'not_enough_sp' };

    const unlocked = this.getUnlockedNodes(classId);
    if (unlocked.includes(nodeId)) return { success: false, reason: 'already_unlocked' };

    // Check prerequisites
    if (node.prerequisites && node.prerequisites.length > 0) {
        const allMet = node.prerequisites.every(reqId => unlocked.includes(reqId));
        if (!allMet) return { success: false, reason: 'prerequisites_not_met' };
    }

    // Unlock
    this.masteryData[classId].unlockedNodes.push(nodeId);
    this.saveMasteryData();

    // Notify UI (if needed, or caller updates UI)
    showToast({
        emoji: '🔓',
        title: 'スキル習得',
        message: `${node.name}を習得しました！`,
        sound: true
    });

    return { success: true };
  },

  // ------------------------

  setupEventListeners() {
    if (this.elements.triggerBtn) {
      this.elements.triggerBtn.addEventListener('click', () => {
        this.renderList(); // Render initial list
        this.renderSkillTree(); // Pre-render tree
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

    // Tab Handling
    const tabs = document.querySelectorAll('.modal-tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Hide all views
            document.querySelectorAll('.modal-view').forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
            });

            // Activate clicked tab
            tab.classList.add('active');
            const targetId = tab.dataset.target;
            const targetView = document.getElementById(targetId === 'class-selection' ? 'class-selection-view' : 'skill-tree-view');

            if (targetView) {
                targetView.classList.add('active');
                targetView.style.display = 'block';

                if (targetId === 'skill-tree') {
                    this.renderSkillTree();
                } else {
                    this.renderList();
                }
            }
        });
    });

    // Unlock Node Button
    const unlockBtn = document.getElementById('unlock-node-btn');
    if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
             const nodeId = unlockBtn.dataset.nodeId;
             if (nodeId) {
                 const res = this.unlockNode(this.currentClassId, nodeId);
                 if (res.success) {
                     this.renderSkillTree();
                     this.showNodeDetail(nodeId); // Refresh detail view
                 } else {
                     // Shake button or show error
                     const msg = document.getElementById('node-unlock-msg');
                     if (msg) msg.textContent = '条件を満たしていません';
                 }
             }
        });
    }
  },

  openModal() {
    if (this.elements.modal) {
      // Reset to class selection tab
      const tabs = document.querySelectorAll('.modal-tab-btn');
      tabs.forEach(t => t.classList.remove('active'));
      const selectionTab = document.querySelector('.modal-tab-btn[data-target="class-selection"]');
      if (selectionTab) selectionTab.classList.add('active');

      const views = document.querySelectorAll('.modal-view');
      views.forEach(v => {
          v.classList.remove('active');
          v.style.display = 'none';
      });
      const selectionView = document.getElementById('class-selection-view');
      if (selectionView) {
          selectionView.classList.add('active');
          selectionView.style.display = 'block';
      }

      this.renderList(); // Ensure list is up to date

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

  renderSkillTree() {
      const container = document.getElementById('skill-tree-grid');
      const spDisplay = document.getElementById('current-sp-value');
      const detailPanel = document.getElementById('skill-node-detail');

      if (!container || !spDisplay) return;

      // Clear previous
      container.innerHTML = '';
      if (detailPanel) detailPanel.style.display = 'none'; // Reset detail on re-render? Or keep it open if same node? Let's hide for simplicity.

      const currentClass = this.getCurrentClass();
      if (!currentClass || !currentClass.skillTree) {
          container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">このクラスにはスキルツリーがありません。</p>';
          return;
      }

      // Update SP
      const sp = this.getSP(this.currentClassId);
      spDisplay.textContent = sp.available;

      const unlockedNodes = this.getUnlockedNodes(this.currentClassId);

      // Render Nodes
      currentClass.skillTree.forEach(node => {
          const el = document.createElement('div');

          let state = 'locked';
          if (unlockedNodes.includes(node.id)) {
              state = 'unlocked';
          } else {
              // Check availability
              const prerequisitesMet = !node.prerequisites || node.prerequisites.every(req => unlockedNodes.includes(req));
              if (prerequisitesMet && sp.available >= node.cost) {
                  state = 'available';
              } else if (prerequisitesMet) {
                  // Prerequisites met but not enough SP
                  state = 'locked'; // Or create a specific state like 'affordable'
              }
          }

          el.className = `skill-node ${state}`;
          el.style.gridRow = node.position.row;
          el.style.gridColumn = node.position.col;

          // Icon based on effect type
          let icon = '✨';
          if (node.effect.target === 'attackMultiplier') icon = '⚔️';
          else if (node.effect.target === 'expMultiplier') icon = '📚';
          else if (node.effect.target === 'quizMultiplier') icon = '🧠';
          else if (node.effect.target === 'criticalRateBonus') icon = '🎯';

          el.textContent = icon;
          el.dataset.id = node.id;

          el.addEventListener('click', () => this.showNodeDetail(node.id));

          container.appendChild(el);

          // Draw Connector (Primitive implementation using CSS borders on new elements)
          // Only draw if there are prerequisites
          if (node.prerequisites && node.prerequisites.length > 0) {
              // Only simple vertical connections supported for now visually
              // Ideally we check position of prerequisite node.
              // Assuming prerequisites are strictly "above" (lower row index)
              node.prerequisites.forEach(reqId => {
                  const reqNode = currentClass.skillTree.find(n => n.id === reqId);
                  if (reqNode) {
                      // Only draw if in same column for vertical, or adjacent for diagonal
                      // Simple implementation: Just draw a vertical line if same column
                      if (reqNode.position.col === node.position.col && reqNode.position.row < node.position.row) {
                          const connector = document.createElement('div');
                          connector.className = 'connector-v';
                          if (unlockedNodes.includes(node.id)) connector.classList.add('active');

                          // Position logic (Hardcoded for 80px width, 100px height grid)
                          // Row height is ~100px including gap.
                          // Top of current node is (row-1)*100 + gap + offset... this is tricky with Grid.
                          // Alternative: Put connector INSIDE the grid cell of the parent, spanning down?
                          // Or absolute positioning relative to container.
                          // Let's rely on visual proximity for now without explicit lines if too complex.
                          // Or use simple CSS ::after on the parent node if it has a single child.

                          // Simplified: Skip lines for this iteration to avoid layout bugs.
                          // The grid layout itself implies hierarchy.
                      }
                  }
              });
          }
      });
  },

  showNodeDetail(nodeId) {
      const cls = this.getCurrentClass();
      const node = cls.skillTree.find(n => n.id === nodeId);
      if (!node) return;

      const detailPanel = document.getElementById('skill-node-detail');
      const nameEl = document.getElementById('node-detail-name');
      const costEl = document.getElementById('node-detail-cost');
      const descEl = document.getElementById('node-detail-desc');
      const unlockBtn = document.getElementById('unlock-node-btn');
      const msgEl = document.getElementById('node-unlock-msg');

      if (!detailPanel) return;

      detailPanel.style.display = 'block';
      detailPanel.classList.remove('active');
      void detailPanel.offsetWidth; // Trigger reflow
      detailPanel.classList.add('active');

      nameEl.textContent = node.name;
      costEl.textContent = `Cost: ${node.cost}`;
      descEl.textContent = node.description;
      msgEl.textContent = '';
      msgEl.className = 'node-msg';

      const unlockedNodes = this.getUnlockedNodes(this.currentClassId);
      const isUnlocked = unlockedNodes.includes(nodeId);
      const sp = this.getSP(this.currentClassId);

      // Update Button State
      unlockBtn.dataset.nodeId = nodeId;

      if (isUnlocked) {
          unlockBtn.textContent = '習得済み';
          unlockBtn.disabled = true;
          unlockBtn.className = 'btn ghost small';
      } else {
          // Check Requirements
          const prerequisitesMet = !node.prerequisites || node.prerequisites.every(req => unlockedNodes.includes(req));

          if (!prerequisitesMet) {
              unlockBtn.textContent = '未解放';
              unlockBtn.disabled = true;
              unlockBtn.className = 'btn ghost small';
              msgEl.textContent = '前提スキルが必要です';
          } else if (sp.available < node.cost) {
              unlockBtn.textContent = 'SP不足';
              unlockBtn.disabled = true;
              unlockBtn.className = 'btn ghost small';
              msgEl.textContent = `あとSPが ${node.cost - sp.available} 必要です`;
          } else {
              unlockBtn.textContent = '習得する';
              unlockBtn.disabled = false;
              unlockBtn.className = 'btn primary small';
          }
      }
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
      }
    }
  },

  getCurrentClass() {
    return this.classes.find(c => c.id === this.currentClassId) || this.classes[0];
  },

  getModifiers(classId = this.currentClassId, excludeSynergy = false) {
    const cls = this.classes.find(c => c.id === classId) || this.classes[0];
    if (!cls) return { attackMultiplier: 1.0, quizMultiplier: 1.0, criticalRateBonus: 0.0 };

    // Clone base modifiers
    const mods = { ...cls.modifiers };

    // Ensure default properties exist
    if (mods.attackMultiplier === undefined) mods.attackMultiplier = 1.0;
    if (mods.quizMultiplier === undefined) mods.quizMultiplier = 1.0;
    if (mods.criticalRateBonus === undefined) mods.criticalRateBonus = 0.0;
    if (mods.expMultiplier === undefined) mods.expMultiplier = 1.0;

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

    // Apply Skill Tree Bonus
    const unlockedNodes = this.getUnlockedNodes(classId);
    if (cls.skillTree) {
        unlockedNodes.forEach(nodeId => {
            const node = cls.skillTree.find(n => n.id === nodeId);
            if (node && node.effect && node.effect.type === 'stat_boost') {
                const target = node.effect.target;
                const value = node.effect.value;
                if (target && value) {
                    if (mods[target] === undefined) mods[target] = 0; // Initialize if missing
                    mods[target] += value;
                }

                // Secondary effect
                if (node.effect.secondary) {
                    const secTarget = node.effect.secondary.target;
                    const secValue = node.effect.secondary.value;
                    if (secTarget && secValue) {
                        if (mods[secTarget] === undefined) mods[secTarget] = 0;
                        mods[secTarget] += secValue;
                    }
                }
            }
        });
    }

    // Apply Title Synergy Bonus
    if (!excludeSynergy) {
        const synergyMods = TitleManager.getSynergyModifiers();
        for (const key in synergyMods) {
            if (mods[key] === undefined) {
                // Initialize based on key type logic if needed, but safe to assume 0 or 1.0 base?
                // Actually getModifiers clones base modifiers. If a key is new (not in base), we initialize.
                // But multipliers usually start at 1.0 if missing, bonuses at 0.
                // Let's assume initialized by clone or checks above.
                // If completely new key, initializing to 0 is safe for addition.
                // However, if we add to a multiplier that doesn't exist, we might want 1.0 + value?
                // Current getModifiers logic:
                // if (mods.attackMultiplier === undefined) mods.attackMultiplier = 1.0;
                // So keys are guaranteed to exist for standard stats.
                mods[key] = 0;
            }
            mods[key] += synergyMods[key];
        }
    }

    // Round to reasonable precision to avoid floating point errors
    mods.attackMultiplier = Math.round(mods.attackMultiplier * 100) / 100;
    mods.quizMultiplier = Math.round(mods.quizMultiplier * 100) / 100;
    mods.criticalRateBonus = Math.round(mods.criticalRateBonus * 1000) / 1000;
    // expMultiplier may not be rounded as strictly, but let's keep it clean
    mods.expMultiplier = Math.round(mods.expMultiplier * 100) / 100;

    return mods;
  }
};

export { ClassManager };
