import { loadJson } from './resource-loader.js';
import { MONSTERS } from '../constants.js';
import { showToast } from '../utils.js';

export const BestiaryManager = {
  data: [],
  isInitialized: false,

  async init() {
    try {
      this.data = await loadJson('js/data/bestiary.json');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to load bestiary data:', error);
      this.data = []; // Fallback empty
    }
  },

  /**
   * Calculates discovery status and kill counts for a monster.
   * @param {number} index - Monster index in MONSTERS array.
   * @param {object} bossState - Current state from BossBattle (or localStorage).
   * @returns {object} { isDiscovered, killCount }
   */
  getMonsterStatus(index, bossState) {
    if (!bossState) {
      return { isDiscovered: false, killCount: 0 };
    }

    const currentLoop = bossState.loopCount || 1;
    const currentIndex = bossState.monsterIndex || 0;

    let isDiscovered = false;
    let killCount = 0;

    // Discovery Logic
    if (currentLoop > 1) {
      isDiscovered = true;
    } else {
      isDiscovered = index <= currentIndex;
    }

    // Kill Count Logic
    // Base kills from completed loops (each loop adds 1 kill per monster)
    // Note: loopCount starts at 1. So completed loops is loopCount - 1.
    killCount = currentLoop - 1;

    // If in the current loop, we have passed this monster?
    // If index < currentIndex, we defeated it in this loop.
    if (index < currentIndex) {
      killCount += 1;
    }
    // If index == currentIndex, we are fighting it (not killed yet in this loop).
    // If index > currentIndex, we haven't reached it in this loop.

    return { isDiscovered, killCount };
  },

  open() {
    if (!this.isInitialized) return;

    const modal = document.getElementById('bestiary-modal');
    if (!modal) return;

    this.render();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  },

  close() {
    const modal = document.getElementById('bestiary-modal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    // Clear detail view if open
    const detail = document.getElementById('bestiary-detail');
    if (detail) detail.classList.remove('active');
  },

  render() {
    const grid = document.getElementById('bestiary-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Get BossBattle state directly from window or localStorage if needed
    // Assuming window.BossBattle is available as it's exposed in app.js
    let bossState = {};
    if (window.BossBattle && window.BossBattle.state) {
      bossState = window.BossBattle.state;
    } else {
      // Fallback manual load
      try {
        const raw = localStorage.getItem('squat-tracker-boss-v1');
        if (raw) bossState = JSON.parse(raw);
      } catch (e) {}
    }

    MONSTERS.forEach((monster, index) => {
      const status = this.getMonsterStatus(index, bossState);
      const flavor = this.data[index] || {};

      const item = document.createElement('div');
      item.className = `bestiary-item ${status.isDiscovered ? 'unlocked' : 'locked'}`;
      item.onclick = () => {
        if (status.isDiscovered) {
          this.showDetail(monster, flavor, status);
        } else {
          showToast({ message: 'まだ遭遇していないモンスターです。' });
        }
      };

      const icon = document.createElement('div');
      icon.className = 'bestiary-icon';
      icon.textContent = status.isDiscovered ? monster.emoji : '❓';

      const name = document.createElement('div');
      name.className = 'bestiary-name';
      name.textContent = status.isDiscovered ? monster.name : '？？？';

      item.append(icon, name);
      grid.appendChild(item);
    });
  },

  showDetail(monster, flavor, status) {
    const detail = document.getElementById('bestiary-detail');
    if (!detail) return;

    // Populate Detail
    const dIcon = document.getElementById('bestiary-detail-icon');
    const dName = document.getElementById('bestiary-detail-name');
    const dTitle = document.getElementById('bestiary-detail-title');
    const dDesc = document.getElementById('bestiary-detail-desc');
    const dStats = document.getElementById('bestiary-detail-stats');
    const dKills = document.getElementById('bestiary-detail-kills');

    if (dIcon) dIcon.textContent = monster.emoji;
    if (dName) dName.textContent = monster.name;
    if (dTitle) dTitle.textContent = flavor.title || '';
    if (dDesc) dDesc.textContent = flavor.description || '';

    if (dStats) {
      const avgHp = Math.floor((monster.hpRange[0] + monster.hpRange[1]) / 2);
      dStats.textContent = `推定HP: ${avgHp}`;
    }

    if (dKills) {
      dKills.textContent = `討伐数: ${status.killCount}体`;
    }

    detail.classList.add('active');
  }
};
