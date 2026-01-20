import { WEAPONS } from '../data/weapons.js';
import { isStorageAvailable } from '../utils.js';

const INVENTORY_KEY = 'squat-tracker-inventory';

export const InventoryManager = {
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
