import { MONSTERS, RARITY_SETTINGS } from '../constants.js';
// import { WEAPONS } from '../data/weapons.js'; // REMOVED
import { InventoryManager } from './inventory-manager.js';
import { AdventureSystem } from './adventure-system.js';
import { BuddyManager } from './buddy-manager.js';
import { showToast, getRandomInt } from '../utils.js';

export const BossBattle = {
  baseWeaponsData: [],
  weaponsMap: {},
  state: {
    currentMonster: null,
    totalKills: 0,
    monsterIndex: 0,
    loopCount: 1,
    lastInteraction: Date.now(),
  },
  isRespawning: false,
  elements: {},

  init(options = {}) {
    if (options.baseWeaponsData) this.baseWeaponsData = options.baseWeaponsData;
    if (options.weaponsMap) this.weaponsMap = options.weaponsMap;

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

  forceHeal(amount) {
    if (!this.state.currentMonster) return;

    const oldHp = this.state.currentMonster.currentHp;
    this.state.currentMonster.currentHp = Math.min(
      this.state.currentMonster.maxHp,
      this.state.currentMonster.currentHp + amount
    );

    if (this.state.currentMonster.currentHp > oldHp) {
      this.state.lastInteraction = Date.now();
      this.saveState();
      this.render();

      if (this.elements.avatar) {
        // Simple visual feedback using existing animation
        this.elements.avatar.classList.remove('boss-spawn');
        void this.elements.avatar.offsetWidth;
        this.elements.avatar.classList.add('boss-spawn');
      }
    }
  },

  spawnMonster(animate = true) {
    const index = this.state.monsterIndex % MONSTERS.length;
    const template = MONSTERS[index];

    // Scaling: 1.0, 1.5, 2.0...
    const scalingFactor = 1 + (this.state.loopCount - 1) * 0.5;

    // Apply Route Modifiers
    const modifiers = AdventureSystem.getRouteModifiers();
    const hpModifier = modifiers ? modifiers.hp : 1.0;

    const minHp = Math.floor(template.hpRange[0] * scalingFactor * hpModifier);
    const maxHp = Math.floor(template.hpRange[1] * scalingFactor * hpModifier);
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

    // Apply Buddy Bonus
    const buddyBonus = BuddyManager.getDamageBonus();
    const totalDamage = amount + buddyBonus;

    const monster = this.state.currentMonster;
    monster.currentHp = Math.max(0, monster.currentHp - totalDamage);
    this.state.lastInteraction = Date.now();

    if (this.elements.avatar) {
      this.elements.avatar.classList.remove('boss-shake', 'boss-critical');
      void this.elements.avatar.offsetWidth;

      if (isCritical) {
        this.elements.avatar.classList.add('boss-critical');
        this.showCriticalEffect();
        if (typeof window.AchievementSystem !== 'undefined') {
          window.AchievementSystem.notify('critical');
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

    // Adventure Mode Integration
    const advResult = AdventureSystem.advance();

    // Check if area was cleared and route selection is needed
    if (advResult.areaCleared) {
      showToast({
        emoji: '🎉',
        title: 'エリアクリア！',
        message: `次のエリア: ${advResult.currentArea.name} へ進みます！`,
        sound: true
      });
    }

    // Try to tame buddy
    const currentMonsterIndex = this.state.monsterIndex % MONSTERS.length;
    BuddyManager.checkDrop(currentMonsterIndex);

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

    // Delay handling based on area clear status
    if (advResult.areaCleared) {
      // Wait for defeat animation then show route selection
      setTimeout(() => {
        AdventureSystem.showRouteSelection(() => {
          this.spawnMonster(true);
          this.isRespawning = false;
        });
      }, 1000);
    } else {
      // Normal respawn
      setTimeout(() => {
        this.spawnMonster(true);
        this.isRespawning = false;
      }, 1000);
    }
  },

  rollDrop() {
    if (!this.baseWeaponsData || this.baseWeaponsData.length === 0) return;

    // 100% drop chance

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

    // Render Buddy
    const buddyContainer = document.getElementById('buddy-container');
    if (buddyContainer) {
      const buddy = BuddyManager.getCurrentBuddy();
      if (buddy) {
        buddyContainer.style.display = 'flex';
        buddyContainer.innerHTML = `<div class="buddy-avatar" title="${buddy.name}">${buddy.emoji}</div>`;
      } else {
        buddyContainer.style.display = 'none';
      }
    }
  }
};
