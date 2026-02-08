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
            // Prompt for name (simple implementation)
            // Ideally use a custom modal or just use default name
            // For now, let's use a prompt or default if empty
            // To be robust and non-blocking, maybe just save with default name or date
            // Let's use a simple prompt for now as Vanilla JS allows it easily,
            // but for better UX, we might want to just save.
            // Let's try to get a name via prompt.
            const defaultName = `マイセット ${this.loadouts.length + 1}`;
            // Note: prompt is blocking but simple.
            // In a real app we might want an input field in the modal.
            // Let's stick to prompt for simplicity in this iteration, or auto-name.
            // Let's auto-name for now to avoid prompt blocking issues in tests if not handled.
            // Or better: prompt but fallback.

            // Actually, let's implement a small input field in the modal later.
            // For now, auto-name.
            this.saveCurrentLoadout(defaultName);
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
