import { isStorageAvailable, showToast } from '../utils.js';
import { ClassManager } from './class-manager.js';
import { InventoryManager } from './inventory-manager.js';
import { TitleManager } from './title-manager.js';

const LOADOUTS_KEY = 'squat-tracker-loadouts';

export const LoadoutManager = {
  loadouts: [],
  elements: {
    modal: null,
    triggerBtn: null,
    listContainer: null,
    closeBtn: null,
    createNewBtn: null
  },

  init() {
    this.load();
    this.setupUI();
  },

  load() {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(LOADOUTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.loadouts)) {
          this.loadouts = parsed.loadouts;
        }
      }
    } catch (e) {
      console.error('Failed to load loadouts', e);
      this.loadouts = [];
    }
  },

  save() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(LOADOUTS_KEY, JSON.stringify({ loadouts: this.loadouts }));
    } catch (e) {
      console.error('Failed to save loadouts', e);
    }
  },

  getLoadouts() {
    return this.loadouts;
  },

  saveCurrentLoadout(name) {
    // Collect current state
    const currentClassId = ClassManager.currentClassId;
    const currentWeaponId = InventoryManager.state.equippedId;
    const currentPrefixId = TitleManager.state.currentPrefix;
    const currentSuffixId = TitleManager.state.currentSuffix;

    // Create new loadout object
    const newLoadout = {
      id: crypto.randomUUID(),
      name: name || `マイセット ${this.loadouts.length + 1}`,
      classId: currentClassId,
      weaponId: currentWeaponId,
      titlePrefixId: currentPrefixId,
      titleSuffixId: currentSuffixId,
      createdAt: Date.now()
    };

    this.loadouts.push(newLoadout);
    this.save();
    this.renderList();

    showToast({
        emoji: '💾',
        title: '保存完了',
        message: `「${newLoadout.name}」を保存しました。`
    });

    return newLoadout;
  },

  applyLoadout(id) {
    const loadout = this.loadouts.find(l => l.id === id);
    if (!loadout) {
      console.error('Loadout not found:', id);
      return false;
    }

    // Apply settings
    // 1. Class
    if (loadout.classId) {
        ClassManager.changeClass(loadout.classId);
    }

    // 2. Weapon
    if (loadout.weaponId) {
        // Check if owned
        if (InventoryManager.state.items[loadout.weaponId]) {
            InventoryManager.equipWeapon(loadout.weaponId);
        } else {
            console.warn(`Weapon ${loadout.weaponId} not owned, skipping.`);
            // Optional: Notify user
        }
    }

    // 3. Title
    // TitleManager.equip checks ownership internally
    TitleManager.equip(loadout.titlePrefixId, loadout.titleSuffixId);
    TitleManager.updateDisplay();

    showToast({
        emoji: '✨',
        title: '装備変更',
        message: `「${loadout.name}」を適用しました！`
    });

    return true;
  },

  deleteLoadout(id) {
    const index = this.loadouts.findIndex(l => l.id === id);
    if (index === -1) return false;

    const name = this.loadouts[index].name;
    this.loadouts.splice(index, 1);
    this.save();
    this.renderList();

    showToast({
        emoji: '🗑️',
        title: '削除完了',
        message: `「${name}」を削除しました。`
    });

    return true;
  },

  // UI Methods
  setupUI() {
    this.elements.modal = document.getElementById('loadout-modal');
    this.elements.triggerBtn = document.getElementById('open-loadout-menu');
    this.elements.listContainer = document.getElementById('loadout-list');
    this.elements.closeBtn = document.getElementById('close-loadout-modal');
    this.elements.createNewBtn = document.getElementById('create-new-loadout');
    this.elements.optimizeBtn = document.getElementById('optimize-loadout-btn');

    if (this.elements.triggerBtn) {
      this.elements.triggerBtn.addEventListener('click', () => this.openModal());
    }

    if (this.elements.closeBtn) {
        this.elements.closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.elements.modal) {
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.closeModal();
        });
    }

    if (this.elements.createNewBtn) {
        this.elements.createNewBtn.addEventListener('click', () => {
            const defaultName = `マイセット ${this.loadouts.length + 1}`;
            this.saveCurrentLoadout(defaultName);
        });
    }

    if (this.elements.optimizeBtn) {
        this.elements.optimizeBtn.addEventListener('click', () => {
            this.optimizeLoadout();
        });
    }
  },

  optimizeLoadout() {
    if (!ClassManager || !InventoryManager || !TitleManager) return;

    let bestWeaponId = null;
    let maxWeaponAtk = -1;

    // 1. Find Best Weapon
    const ownedWeapons = Object.keys(InventoryManager.state.items);
    ownedWeapons.forEach(id => {
        const def = InventoryManager.weaponsData[id];
        const item = InventoryManager.state.items[id];
        if (def && item) {
            const atk = def.baseAtk + (item.level - 1) * def.atkPerLevel;
            if (atk > maxWeaponAtk) {
                maxWeaponAtk = atk;
                bestWeaponId = id;
            }
        }
    });

    // 2. Find Best Class (excluding synergy)
    let bestClassId = null;
    let maxClassMult = -1;

    ClassManager.classes.forEach(cls => {
        const mods = ClassManager.getModifiers(cls.id, true);
        if (mods.attackMultiplier > maxClassMult) {
            maxClassMult = mods.attackMultiplier;
            bestClassId = cls.id;
        }
    });

    // 3. Find Best Synergy
    const bestSynergy = TitleManager.getBestSynergy('attackMultiplier');
    let bestPrefix = TitleManager.state.currentPrefix;
    let bestSuffix = TitleManager.state.currentSuffix;

    if (bestSynergy) {
        bestPrefix = bestSynergy.condition.prefix;
        bestSuffix = bestSynergy.condition.suffix;
    }

    // Apply Changes
    const changes = [];

    if (bestWeaponId && bestWeaponId !== InventoryManager.state.equippedId) {
        InventoryManager.equipWeapon(bestWeaponId);
        const wName = InventoryManager.weaponsData[bestWeaponId].name;
        changes.push(`武器: ${wName}`);
    }

    if (bestClassId && bestClassId !== ClassManager.currentClassId) {
        ClassManager.changeClass(bestClassId);
        const cName = ClassManager.classes.find(c => c.id === bestClassId).name;
        changes.push(`クラス: ${cName}`);
    }

    const currentP = TitleManager.state.currentPrefix;
    const currentS = TitleManager.state.currentSuffix;

    if (bestSynergy && (bestPrefix !== currentP || bestSuffix !== currentS)) {
        TitleManager.equip(bestPrefix, bestSuffix);
        TitleManager.updateDisplay();
        changes.push(`称号: ${bestSynergy.name}`);
    }

    this.closeModal();

    if (changes.length > 0) {
        showToast({
            emoji: '⚡️',
            title: '最強装備適用',
            message: `攻撃力重視で装備を更新しました！`
        });
    } else {
        showToast({
            emoji: '👍',
            title: '最強装備',
            message: '現在の装備が既に最強です。'
        });
    }
  },

  openModal() {
    if (this.elements.modal) {
        this.renderList();
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

    if (this.loadouts.length === 0) {
        this.elements.listContainer.innerHTML = '<div class="empty-state">保存されたセットはありません</div>';
        return;
    }

    this.loadouts.forEach(loadout => {
        const item = document.createElement('div');
        item.className = 'loadout-item';

        // Retrieve metadata for display (names, icons)
        const cls = ClassManager.classes.find(c => c.id === loadout.classId);
        const weaponDef = InventoryManager.weaponsData[loadout.weaponId];
        // Note: InventoryManager.weaponsData might need check

        const classIcon = cls ? cls.emoji : '❓';
        const weaponIcon = weaponDef ? weaponDef.emoji : '⚔️';

        item.innerHTML = `
            <div class="loadout-info">
                <div class="loadout-name">${loadout.name}</div>
                <div class="loadout-preview">
                    <span title="Class">${classIcon}</span>
                    <span title="Weapon">${weaponIcon}</span>
                </div>
            </div>
            <div class="loadout-actions">
                <button class="btn-small btn-primary apply-btn">適用</button>
                <button class="btn-small btn-danger delete-btn">削除</button>
            </div>
        `;

        item.querySelector('.apply-btn').addEventListener('click', () => {
            this.applyLoadout(loadout.id);
            this.closeModal(); // Optional: close on apply
        });

        item.querySelector('.delete-btn').addEventListener('click', (e) => {
            if(confirm(`「${loadout.name}」を削除しますか？`)) {
                this.deleteLoadout(loadout.id);
            }
        });

        this.elements.listContainer.appendChild(item);
    });
  }
};
