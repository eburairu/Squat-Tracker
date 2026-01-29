// import { WEAPONS } from '../data/weapons.js'; // REMOVED: Dependency injection used instead
import { isStorageAvailable, getLocalDateKey, showToast } from '../utils.js';

const INVENTORY_KEY = 'squat-tracker-inventory';

export const InventoryManager = {
  weaponsData: {}, // Injected dynamically
  state: {
    equippedId: 'unarmed',
    items: {
      unarmed: { level: 1, acquiredAt: Date.now() }
    },
    consumables: {}
  },

  init(weaponsMap) {
    if (weaponsMap && typeof weaponsMap === 'object') {
      this.weaponsData = weaponsMap;
    } else {
      console.warn('InventoryManager: No weapons data provided, using empty map.');
      this.weaponsData = {};
    }

    this.load();
    // Ensure initial state validity
    if (!this.state.items.unarmed) {
      this.state.items.unarmed = { level: 1, acquiredAt: Date.now() };
    }
    // Ensure consumables state validity
    if (!this.state.consumables) {
      this.state.consumables = {};
    }
    // Check against injected weaponsData
    if (!this.weaponsData[this.state.equippedId]) {
      this.state.equippedId = 'unarmed';
    }
    // Render UI if elements exist
    this.render();
    this.renderShieldStatus();
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
          if (!this.state.consumables) {
            this.state.consumables = {};
          }
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
    if (this.state.equippedId && !this.weaponsData[this.state.equippedId]) {
      const newId = `${this.state.equippedId}_r1`;
      if (this.weaponsData[newId]) {
        this.state.equippedId = newId;
        changed = true;
      } else {
        this.state.equippedId = 'unarmed';
        changed = true;
      }
    }

    // Handle items migration
    Object.keys(this.state.items).forEach(key => {
      if (this.weaponsData[key]) {
        newItems[key] = this.state.items[key];
      } else {
        const newId = `${key}_r1`;
        if (this.weaponsData[newId]) {
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
    const weaponDef = this.weaponsData[weaponId];
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

  addConsumable(id, amount = 1) {
    if (!this.state.consumables[id]) {
      this.state.consumables[id] = 0;
    }
    this.state.consumables[id] += amount;
    this.save();
    this.renderShieldStatus();
    return this.state.consumables[id];
  },

  useConsumable(id, amount = 1) {
    if (!this.state.consumables[id] || this.state.consumables[id] < amount) {
      return false;
    }
    this.state.consumables[id] -= amount;
    this.save();
    this.renderShieldStatus();
    return true;
  },

  getConsumableCount(id) {
    return this.state.consumables[id] || 0;
  },

  checkStreakProtection(historyEntries, saveHistoryCallback) {
    if (!historyEntries || !Array.isArray(historyEntries) || historyEntries.length === 0) return;

    // Create a set of existing dates
    const dateKeys = new Set(
      historyEntries
        .map((entry) => getLocalDateKey(new Date(entry.date)))
        .filter((value) => value)
    );

    let shields = this.getConsumableCount('shield');
    if (shields <= 0) return;

    let consumed = 0;
    let addedEntries = [];
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - 1); // Start from yesterday

    // Limit check to avoid infinite loops or massive consumption (e.g. 30 days)
    const MAX_CHECK_DAYS = 30;

    for (let i = 0; i < MAX_CHECK_DAYS; i++) {
      const key = getLocalDateKey(cursor);
      if (!key) break; // Safety

      if (!dateKeys.has(key)) {
        // Missing day found
        if (shields > 0) {
          // Use shield logic (simulation)
          shields--;
          consumed++;

          // Create shield entry
          const shieldDate = new Date(cursor);
          shieldDate.setHours(23, 59, 59); // Set to end of day

          const entry = {
            date: shieldDate.toISOString(),
            totalReps: 0,
            type: 'shield'
          };

          addedEntries.push(entry);
        } else {
          // No more shields, stop filling gaps
          break;
        }
      } else {
        // Day exists! Streak is connected up to here. Stop checking further back.
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }

    if (consumed > 0) {
      // Actually consume shields
      this.useConsumable('shield', consumed);

      // Add entries to history and save
      const newHistory = [...historyEntries, ...addedEntries];
      // Sort history by date desc
      newHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (saveHistoryCallback) {
        saveHistoryCallback(newHistory);
      }

      // Notify user
      showToast({
        emoji: '🛡️',
        title: 'ストリークシールド発動！',
        message: `${consumed}日分の記録を守りました`,
        sound: true
      });
    }
  },

  equipWeapon(weaponId) {
    if (!this.state.items[weaponId] || !this.weaponsData[weaponId]) return false;
    this.state.equippedId = weaponId;
    this.save();
    this.render();
    return true;
  },

  getEquippedWeapon() {
    const id = this.state.equippedId;
    const def = this.weaponsData[id] || this.weaponsData.unarmed || {
      id: 'unarmed', name: '素手', emoji: '✊', baseAtk: 0, rarity: 1, maxLevel: 1, atkPerLevel: 0, weight: 0
    };
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

  renderShieldStatus() {
    let shieldCard = document.getElementById('stat-shield');
    const shieldCount = this.getConsumableCount('shield');

    if (!shieldCard) {
      const statGrid = document.querySelector('.stat-grid');
      if (statGrid) {
        shieldCard = document.createElement('div');
        shieldCard.className = 'stat-card';
        shieldCard.id = 'stat-shield';
        shieldCard.innerHTML = `
          <span class="stat-label">シールド</span>
          <span id="shield-count" class="stat-value">0</span>
          <span class="stat-unit">shields</span>
        `;
        statGrid.appendChild(shieldCard);
      }
    }

    if (shieldCard) {
      const countEl = shieldCard.querySelector('#shield-count');
      if (countEl) {
        countEl.textContent = shieldCount;
      }
    }
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

      const wa = this.weaponsData[a];
      const wb = this.weaponsData[b];

      // Safety check if data is missing
      if (!wa || !wb) return 0;

      if (wb.rarity !== wa.rarity) return wb.rarity - wa.rarity;
      return wb.baseAtk - wa.baseAtk;
    });

    ownedIds.forEach(id => {
      const def = this.weaponsData[id];
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
