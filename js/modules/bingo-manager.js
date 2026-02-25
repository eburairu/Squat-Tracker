import { isStorageAvailable, showToast, getRandomInt, getLocalDateKey } from '../utils.js';
import { InventoryManager } from './inventory-manager.js';

const STORAGE_KEY = 'squat-tracker-bingo';

const MISSION_TYPES = [
  { type: 'total_reps', description: 'スクワット', base: 50, unit: '回', emoji: '🏋️' },
  { type: 'login_days', description: 'ログイン', base: 1, unit: '日', emoji: '📅' },
  { type: 'boss_kills', description: 'ボス討伐', base: 1, unit: '体', emoji: '👹' },
  { type: 'critical_hits', description: 'クリティカル', base: 5, unit: '回', emoji: '💥' },
  { type: 'total_calories', description: 'カロリー消費', base: 20, unit: 'kcal', emoji: '🔥' }
];

const getWeekKey = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const BingoManager = {
  state: {
    weekId: null,
    cells: [], // 0-8
    claimedLines: [], // 'row-0', 'col-1', 'diag-0' etc.
    completed: false
  },
  baseWeaponsData: [],
  weaponsMap: {},

  init(options = {}) {
    if (options.baseWeaponsData) this.baseWeaponsData = options.baseWeaponsData;
    if (options.weaponsMap) this.weaponsMap = options.weaponsMap;

    this.load();
    const currentWeek = getWeekKey(new Date());
    if (this.state.weekId !== currentWeek) {
      this.generateBingo(currentWeek);
    } else {
      // データの整合性チェック
      if (!this.state.cells || this.state.cells.length !== 9) {
          this.generateBingo(currentWeek);
      }
    }

    // Login Check
    this.checkProgress({ type: 'login' });
  },

  load() {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.state = JSON.parse(raw);
        // Ensure arrays exist
        if (!this.state.claimedLines) this.state.claimedLines = [];
        if (!this.state.cells) this.state.cells = [];
      }
    } catch (e) {
      console.error('Bingo load failed', e);
    }
  },

  save() {
    if (!isStorageAvailable) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  },

  generateBingo(weekId) {
    this.state.weekId = weekId;
    this.state.cells = [];
    this.state.claimedLines = [];
    this.state.completed = false;

    // 9 cells
    for (let i = 0; i < 9; i++) {
      // Pick random type
      const m = MISSION_TYPES[getRandomInt(0, MISSION_TYPES.length - 1)];

      // Calculate target based on difficulty
      // Center (4) could be special, but random for now.
      let mult = getRandomInt(1, 3);

      // Login days max 7
      if (m.type === 'login_days') {
         mult = getRandomInt(2, 5);
      }

      const target = m.base * mult;

      this.state.cells.push({
        id: i,
        type: m.type,
        description: m.description,
        target: target,
        current: 0,
        unit: m.unit,
        emoji: m.emoji,
        completed: false,
        lastLoginDate: null
      });
    }

    this.save();
  },

  checkProgress(context = {}) {
    let changed = false;
    let justCompletedCell = false;

    this.state.cells.forEach(cell => {
      if (cell.completed) return;

      let progress = 0;

      if (cell.type === 'login_days' && context.type === 'login') {
         const today = getLocalDateKey(new Date());
         if (cell.lastLoginDate !== today) {
             progress = 1;
             cell.lastLoginDate = today;
         }
      } else if (cell.type === 'total_reps' && context.type === 'finish' && context.totalReps) {
         progress = context.totalReps;
      } else if (cell.type === 'boss_kills' && context.type === 'boss_kill') {
         progress = 1;
      } else if (cell.type === 'critical_hits' && context.type === 'critical_hit') {
         progress = 1;
      } else if (cell.type === 'total_calories' && context.type === 'finish' && context.totalReps) {
         progress = Math.floor(context.totalReps * 0.5);
      }

      if (progress > 0) {
        cell.current += progress;
        changed = true;
        if (cell.current >= cell.target) {
            cell.current = cell.target;
            cell.completed = true;
            justCompletedCell = true;
            showToast({ emoji: '⭕', title: 'ビンゴマス達成！', message: `${cell.description} クリア！` });
        }
      }
    });

    if (justCompletedCell) {
        this.checkLines();
        changed = true; // Lines check might update claimedLines
    }

    if (changed) {
        this.save();
        this.render();
    }
  },

  checkLines() {
      // Definitions of lines (indices)
      const lines = {
          'row-0': [0, 1, 2],
          'row-1': [3, 4, 5],
          'row-2': [6, 7, 8],
          'col-0': [0, 3, 6],
          'col-1': [1, 4, 7],
          'col-2': [2, 5, 8],
          'diag-0': [0, 4, 8],
          'diag-1': [2, 4, 6]
      };

      let newLineCompleted = false;

      for (const [lineId, indices] of Object.entries(lines)) {
          if (this.state.claimedLines.includes(lineId)) continue;

          const allCompleted = indices.every(idx => this.state.cells[idx].completed);
          if (allCompleted) {
              this.state.claimedLines.push(lineId);
              newLineCompleted = true;
              this.grantReward(lineId);
          }
      }

      // Check full completion
      if (this.state.claimedLines.length === 8 && !this.state.completed) {
          this.state.completed = true;
          this.grantCompleteReward();
      }

      return newLineCompleted;
  },

  grantReward(lineId) {
      const reward = this.lotteryWeapon();
      if (reward) {
          showToast({
              emoji: '🎉',
              title: 'BINGO!',
              message: `報酬: ${reward.weapon.name} GET!`,
              sound: true
          });
      } else {
           showToast({ emoji: '🎉', title: 'BINGO!', message: 'ライン達成！' });
      }
  },

  grantCompleteReward() {
      showToast({ emoji: '👑', title: 'ALL CLEAR!', message: 'コンプリートおめでとう！', sound: true });
      // Special reward logic could go here (e.g. forced high rarity)
      this.lotteryWeapon();
  },

  lotteryWeapon() {
    if (!this.baseWeaponsData || this.baseWeaponsData.length === 0) return null;

    // Random rarity 2-4 for Bingo Line
    const rarity = getRandomInt(2, 4);

    // Random base
    const base = this.baseWeaponsData[getRandomInt(0, this.baseWeaponsData.length - 1)];

    const weaponId = `${base.id}_r${rarity}`;
    if (typeof InventoryManager !== 'undefined') {
        return InventoryManager.addWeapon(weaponId);
    }
    return null;
  },

  getRemainingDays() {
      const today = new Date();
      const day = today.getDay() || 7;
      return 8 - day;
  },

  render(containerId = 'mission-list-weekly') {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '';
      container.classList.add('bingo-container-wrapper'); // Helper class

      // Render Header (Remaining Days)
      const infoDiv = document.getElementById('weekly-info-container');
      if (infoDiv) {
         infoDiv.innerHTML = `残り日数: <span style="font-weight:bold;color:var(--accent-color);">${this.getRemainingDays()}日</span>`;
         infoDiv.style.display = 'block';
      }

      // Grid
      const grid = document.createElement('div');
      grid.className = 'bingo-grid';

      this.state.cells.forEach(cell => {
          const cellDiv = document.createElement('div');
          cellDiv.className = `bingo-cell ${cell.completed ? 'completed' : ''}`;
          cellDiv.dataset.id = cell.id;

          if (cell.completed) {
              cellDiv.innerHTML = `<div class="stamp">⭕</div>`;
              cellDiv.title = `達成済: ${cell.description}`;
          } else {
              // Icon
              const icon = document.createElement('div');
              icon.className = 'cell-icon';
              icon.textContent = cell.emoji;

              // Text (Target)
              const text = document.createElement('div');
              text.className = 'cell-text';
              text.textContent = `${cell.target}`;

              // Progress Bar
              const progressWrapper = document.createElement('div');
              progressWrapper.className = 'cell-progress-wrapper';
              const progress = document.createElement('div');
              progress.className = 'cell-progress-bar';
              const pct = Math.min(100, (cell.current / cell.target) * 100);
              progress.style.width = `${pct}%`;
              progressWrapper.appendChild(progress);

              cellDiv.appendChild(icon);
              cellDiv.appendChild(text);
              cellDiv.appendChild(progressWrapper);

              // Click for detail
              cellDiv.title = `${cell.description}: ${cell.current} / ${cell.target} ${cell.unit}`;
              cellDiv.onclick = () => {
                  showToast({
                      emoji: cell.emoji,
                      title: cell.description,
                      message: `進捗: ${cell.current} / ${cell.target} ${cell.unit}`
                  });
              };
          }

          grid.appendChild(cellDiv);
      });

      container.appendChild(grid);
  }
};
